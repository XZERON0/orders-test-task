import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import {
  as,
  resetDb,
  seedTwoOrganizations,
  createProduct,
  stockOf,
} from "./helpers.js";

let fixture: Awaited<ReturnType<typeof seedTwoOrganizations>>;

beforeEach(async () => {
  await resetDb();
  fixture = await seedTwoOrganizations();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("авторизация", () => {
  it("без токена отвечает 401", async () => {
    const res = await as("").get("/api/orders");
    expect(res.status).toBe(401);
  });
});

describe("создание заказа", () => {
  it("считает суммы строк и итог", async () => {
    const res = await as("alice").post("/api/orders", {
      customerName: "Покупатель",
      lines: [{ productId: fixture.productA.id, quantity: 2 }],
    });
    expect(res.status).toBe(201);
    expect(res.body.number).toBe(1);
    expect(res.body.status).toBe("DRAFT");
    expect(res.body.lines[0].lineTotal).toBe("2000");
    expect(res.body.total).toBe("2000");
  });
  it("QA-101: итог равен сумме округлённых строк", async () => {
    const products = await Promise.all([
      createProduct(fixture.orgA.id, {
        sku: "TEA-BLK",
        price: "333.33",
        onHand: 10,
      }),
      createProduct(fixture.orgA.id, {
        sku: "TEA-GRN",
        price: "333.33",
        onHand: 10,
      }),
      createProduct(fixture.orgA.id, {
        sku: "TEA-HRB",
        price: "333.33",
        onHand: 10,
      }),
    ]);
    const res = await as("alice").post("/api/orders", {
      customerName: "Тест QA-101",
      discountPercent: 10,
      lines: products.map((product) => ({
        productId: product.id,
        quantity: 1,
      })),
    });
    expect(res.status).toBe(201);
    expect(res.body.lines).toHaveLength(3);
    for (const line of res.body.lines) {
      expect(Number(line.lineTotal)).toBe(300);
    }
    const sumOfLines = res.body.lines.reduce(
      (sum: number, line: { lineTotal: string }) =>
        sum + Number(line.lineTotal),
      0,
    );
    expect(Number(res.body.total)).toBe(900);
    expect(Number(res.body.total)).toBe(sumOfLines);
  });
  describe("QA-102: изоляция заказов организаций", () => {
    it("не позволяет просматривать заказ другой организации", async () => {
      const created = await as("bob").post("/api/orders", {
        customerName: "Секретный клиент",
        lines: [
          {
            productId: fixture.productB.id,
            quantity: 1,
          },
        ],
      });
      expect(created.status).toBe(201);
      const orderId = created.body.id;
      // Владелец может открыть заказ
      const ownerResponse = await as("bob").get(`/api/orders/${orderId}`);
      expect(ownerResponse.status).toBe(200);
      // Пользователь другой организации не может
      const foreignResponse = await as("alice").get(`/api/orders/${orderId}`);
      expect(foreignResponse.status).toBe(404);
      expect(foreignResponse.body).not.toHaveProperty("lines");
      expect(foreignResponse.body).not.toHaveProperty("customerName");
    });
  });

  it("применяет скидку", async () => {
    const res = await as("alice").post("/api/orders", {
      customerName: "Покупатель",
      discountPercent: 10,
      lines: [{ productId: fixture.productA.id, quantity: 3 }],
    });
    expect(res.status).toBe(201);
    expect(res.body.total).toBe("2700");
  });

  it("не даёт заказать товар чужой организации", async () => {
    const res = await as("alice").post("/api/orders", {
      customerName: "Покупатель",
      lines: [{ productId: fixture.productB.id, quantity: 1 }],
    });

    expect(res.status).toBe(400);
  });
});

describe("список заказов", () => {
  it("показывает только заказы своей организации", async () => {
    await as("alice").post("/api/orders", {
      customerName: "Клиент Алисы",
      lines: [{ productId: fixture.productA.id, quantity: 1 }],
    });
    await as("bob").post("/api/orders", {
      customerName: "Клиент Боба",
      lines: [{ productId: fixture.productB.id, quantity: 1 }],
    });

    const res = await as("alice").get("/api/orders");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].customerName).toBe("Клиент Алисы");
  });
});

describe("жизненный цикл заказа", () => {
  async function createOrder(quantity: number) {
    const res = await as("alice").post("/api/orders", {
      customerName: "Покупатель",
      lines: [{ productId: fixture.productA.id, quantity }],
    });
    return res.body.id as string;
  }

  it("подтверждение резервирует товар", async () => {
    const id = await createOrder(3);

    const res = await as("alice").post(`/api/orders/${id}/confirm`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CONFIRMED");
    expect(await stockOf(fixture.productA.id)).toMatchObject({
      onHand: 10,
      reserved: 3,
    });
  });

  it("не подтверждает заказ, если товара на полке меньше, чем в заказе", async () => {
    const id = await createOrder(11);

    const res = await as("alice").post(`/api/orders/${id}/confirm`);

    expect(res.status).toBe(409);
  });

  it("отгрузка списывает товар с полки и снимает резерв", async () => {
    const id = await createOrder(3);
    await as("alice").post(`/api/orders/${id}/confirm`);

    const res = await as("alice").post(`/api/orders/${id}/ship`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("SHIPPED");
    expect(await stockOf(fixture.productA.id)).toMatchObject({
      onHand: 7,
      reserved: 0,
    });
  });

  it("отмена подтверждённого заказа снимает резерв", async () => {
    const id = await createOrder(3);
    await as("alice").post(`/api/orders/${id}/confirm`);

    const res = await as("alice").post(`/api/orders/${id}/cancel`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CANCELLED");
    expect(await stockOf(fixture.productA.id)).toMatchObject({
      onHand: 10,
      reserved: 0,
    });
  });
});
