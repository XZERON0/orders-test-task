import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma.js";
import { as, resetDb, seedTwoOrganizations, stockOf } from "./helpers.js";

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
    expect(await stockOf(fixture.productA.id)).toMatchObject({ onHand: 10, reserved: 3 });
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
    expect(await stockOf(fixture.productA.id)).toMatchObject({ onHand: 7, reserved: 0 });
  });

  it("отмена подтверждённого заказа снимает резерв", async () => {
    const id = await createOrder(3);
    await as("alice").post(`/api/orders/${id}/confirm`);

    const res = await as("alice").post(`/api/orders/${id}/cancel`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CANCELLED");
    expect(await stockOf(fixture.productA.id)).toMatchObject({ onHand: 10, reserved: 0 });
  });
});
