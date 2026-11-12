import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../lib/http-error.js";
import { applyDiscount, round2 } from "../../lib/money.js";
import type { CreateOrderInput } from "./orders.schema.js";

const orderInclude = {
  lines: {
    include: { product: { select: { id: true, name: true, sku: true } } },
    orderBy: { id: "asc" },
  },
} as const;

async function findOrder(id: string, organizationId: string) {
  const order = await prisma.order.findFirst({
    where: {
      id,
      organizationId,
    },
    include: orderInclude,
  });

  if (!order) {
    throw new HttpError(404, "Заказ не найден");
  }

  return order;
}

export async function listOrders(organizationId: string) {
  return prisma.order.findMany({
    where: { organizationId },
    include: orderInclude,
    orderBy: { number: "desc" },
  });
}

export async function getOrder(id: string, organizationId: string) {
  return findOrder(id, organizationId);
}

export async function createOrder(
  organizationId: string,
  input: CreateOrderInput,
) {
  const productIds = [...new Set(input.lines.map((line) => line.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, organizationId },
  });
  if (products.length !== productIds.length) {
    throw new HttpError(400, "Товар не найден");
  }
  const productById = new Map(products.map((product) => [product.id, product]));
  const discount = input.discountPercent;

  // let subtotal = 0;
  const lines = input.lines.map((line) => {
    const unitPrice = Number(productById.get(line.productId)!.price);
    const gross = unitPrice * line.quantity;
    // subtotal += gross;
    return {
      productId: line.productId,
      quantity: line.quantity,
      unitPrice,
      lineTotal: round2(applyDiscount(gross, discount)),
    };
  });
  const total = round2(
    lines.reduce((sum, line, index) => {
      const result = sum + line.lineTotal;
      // console.log(`[QA-101] Итерация ${index + 1}`);
      // console.log("Накопленная сумма:", sum);
      // console.log("Сумма текущей строки:", line.lineTotal);
      // console.log("Новый результат:", result);
      // console.log("---------------------");
      return result;
    }, 0),
  );
  // console.log("[QA-101] Итого:", total);

  // const total = round2(applyDiscount(subtotal, discount));

  const last = await prisma.order.aggregate({
    where: { organizationId },
    _max: { number: true },
  });

  return prisma.order.create({
    data: {
      organizationId,
      number: (last._max.number ?? 0) + 1,
      customerName: input.customerName,
      discountPercent: discount,
      total,
      lines: { create: lines },
    },
    include: orderInclude,
  });
}

/** Подтверждение: проверяем наличие и резервируем товар под заказ. */
export async function confirmOrder(id: string, organizationId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id, organizationId },
      include: orderInclude,
    });

    if (!order) {
      throw new HttpError(404, "Заказ не найден");
    }

    // Атомарно переводим заказ из DRAFT в CONFIRMED.
    // Конкурентное подтверждение того же заказа не пройдёт.
    const updated = await tx.order.updateMany({
      where: {
        id,
        organizationId,
        status: "DRAFT",
      },
      data: {
        status: "CONFIRMED",
      },
    });

    if (updated.count !== 1) {
      throw new HttpError(409, "Подтвердить можно только черновик");
    }

    for (const line of order.lines) {
      const affected = await tx.$executeRaw`
        UPDATE stock_items
        SET reserved = reserved + ${line.quantity}
        WHERE product_id = ${line.productId}
          AND on_hand - reserved >= ${line.quantity}
      `;

      if (affected !== 1) {
        throw new HttpError(409, `Не хватает товара «${line.product.name}»`);
      }
    }
  });

  return findOrder(id, organizationId);
}

/** Отгрузка: товар уходит с полки, резерв под него снимается. */
export async function shipOrder(id: string, organizationId: string) {
  const order = await findOrder(id, organizationId);
  if (order.status !== "CONFIRMED") {
    throw new HttpError(409, "Отгрузить можно только подтверждённый заказ");
  }

  await prisma.$transaction([
    ...order.lines.map((line) =>
      prisma.stockItem.update({
        where: { productId: line.productId },
        data: {
          onHand: { decrement: line.quantity },
          reserved: { decrement: line.quantity },
        },
      }),
    ),
    prisma.order.update({ where: { id }, data: { status: "SHIPPED" } }),
  ]);

  return findOrder(id, organizationId);
}

/** Отмена: возвращаем зарезервированный товар в доступный остаток. */
export async function cancelOrder(id: string, organizationId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id, organizationId },
      include: orderInclude,
    });
    if (!order) {
      throw new HttpError(404, "Заказ не найден");
    }
    if (order.status === "CANCELLED") {
      throw new HttpError(409, "Заказ уже отменён");
    }
    if (order.status === "SHIPPED") {
      throw new HttpError(409, "Отгруженный заказ нельзя отменить");
    }
    const updated = await tx.order.updateMany({
      where: {
        id,
        organizationId,
        status: order.status,
      },
      data: { status: "CANCELLED" },
    });
    if (updated.count !== 1) {
      throw new HttpError(409, "Статус заказа уже изменился");
    }

    if (order.status === "CONFIRMED") {
      for (const line of order.lines) {
        await tx.stockItem.update({
          where: { productId: line.productId },
          data: {
            reserved: { decrement: line.quantity },
          },
        });
      }
    }
  });
  return findOrder(id, organizationId);
}
