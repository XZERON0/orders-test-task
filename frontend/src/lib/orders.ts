"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Order, type Product } from "./api";

export const ordersKey = ["orders"] as const;
export const orderKey = (id: string) => ["order", id] as const;
export const productsKey = ["products"] as const;

export function useOrders() {
  return useQuery({ queryKey: ordersKey, queryFn: () => api<Order[]>("/orders") });
}

export function useOrder(id: string) {
  return useQuery({ queryKey: orderKey(id), queryFn: () => api<Order>(`/orders/${id}`) });
}

export function useProducts() {
  return useQuery({ queryKey: productsKey, queryFn: () => api<Product[]>("/products") });
}

export type OrderAction = "confirm" | "ship" | "cancel";

/** Действие над заказом; ответ сервера — обновлённый заказ, кладём его в кэш карточки. */
export function useOrderAction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: OrderAction) => api<Order>(`/orders/${id}/${action}`, { method: "POST" }),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKey(id), order);
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      customerName: string;
      discountPercent: number;
      lines: { productId: string; quantity: number }[];
    }) => api<Order>("/orders", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKey });
    },
  });
}
