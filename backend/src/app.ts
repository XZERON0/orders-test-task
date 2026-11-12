import express from "express";
import { auth, currentUser } from "./middlewares/auth.js";
import { errorHandler } from "./middlewares/error.js";
import { ordersRouter } from "./modules/orders/orders.routes.js";
import { productsRouter } from "./modules/products/products.routes.js";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api", auth);

  app.get("/api/me", (req, res) => {
    res.json(currentUser(req));
  });
  app.use("/api/products", productsRouter);
  app.use("/api/orders", ordersRouter);

  app.use(errorHandler);
  return app;
}
