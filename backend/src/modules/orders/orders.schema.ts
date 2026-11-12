import { z } from "zod";

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(1).max(200),
  discountPercent: z.number().min(0).max(100).default(0),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
