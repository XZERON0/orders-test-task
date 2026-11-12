import { Router } from "express";
import { currentUser } from "../../middlewares/auth.js";
import { createOrderSchema } from "./orders.schema.js";
import {
  cancelOrder,
  confirmOrder,
  createOrder,
  getOrder,
  listOrders,
  shipOrder,
} from "./orders.service.js";

export const ordersRouter = Router();

ordersRouter.get("/", async (req, res) => {
  const { organizationId } = currentUser(req);
  res.json(await listOrders(organizationId));
});

ordersRouter.get("/:id", async (req, res) => {
  res.json(await getOrder(req.params.id));
});

ordersRouter.post("/", async (req, res) => {
  const { organizationId } = currentUser(req);
  const input = createOrderSchema.parse(req.body);
  res.status(201).json(await createOrder(organizationId, input));
});

ordersRouter.post("/:id/confirm", async (req, res) => {
  res.json(await confirmOrder(req.params.id));
});

ordersRouter.post("/:id/ship", async (req, res) => {
  res.json(await shipOrder(req.params.id));
});

ordersRouter.post("/:id/cancel", async (req, res) => {
  res.json(await cancelOrder(req.params.id));
});
