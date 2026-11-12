import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

export const app = createApp();

export async function resetDb() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE order_lines, orders, stock_items, products, users, organizations CASCADE`,
  );
}

/** Запросы к API от имени пользователя с данным токеном. */
export function as(token: string) {
  const auth = { Authorization: `Bearer ${token}` };
  return {
    get: (path: string) => request(app).get(path).set(auth),
    post: (path: string, body?: object) => request(app).post(path).set(auth).send(body ?? {}),
  };
}

/** Две организации с пользователями «alice» и «bob» и по одному товару у каждой. */
export async function seedTwoOrganizations() {
  const orgA = await prisma.organization.create({ data: { name: "Организация А" } });
  const orgB = await prisma.organization.create({ data: { name: "Организация Б" } });
  await prisma.user.create({ data: { name: "Alice", token: "alice", organizationId: orgA.id } });
  await prisma.user.create({ data: { name: "Bob", token: "bob", organizationId: orgB.id } });

  const productA = await createProduct(orgA.id, { sku: "A-1", price: "1000.00", onHand: 10 });
  const productB = await createProduct(orgB.id, { sku: "B-1", price: "500.00", onHand: 10 });

  return { orgA, orgB, productA, productB };
}

export async function createProduct(
  organizationId: string,
  opts: { sku: string; price: string; onHand: number; name?: string },
) {
  return prisma.product.create({
    data: {
      organizationId,
      name: opts.name ?? `Товар ${opts.sku}`,
      sku: opts.sku,
      price: opts.price,
      stock: { create: { onHand: opts.onHand } },
    },
  });
}

export async function stockOf(productId: string) {
  return prisma.stockItem.findUniqueOrThrow({ where: { productId } });
}
