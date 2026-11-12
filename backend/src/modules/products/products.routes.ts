import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { currentUser } from "../../middlewares/auth.js";

export const productsRouter = Router();

/** Каталог организации с остатками: на складе, в резерве и доступно к заказу. */
productsRouter.get("/", async (req, res) => {
  const { organizationId } = currentUser(req);
  const products = await prisma.product.findMany({
    where: { organizationId },
    include: { stock: true },
    orderBy: { name: "asc" },
  });

  res.json(
    products.map((product) => {
      const onHand = product.stock?.onHand ?? 0;
      const reserved = product.stock?.reserved ?? 0;
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        onHand,
        reserved,
        available: onHand - reserved,
      };
    }),
  );
});
