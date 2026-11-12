import type { OrderStatus } from "./api";

const moneyFormat = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: string | number): string {
  return `${moneyFormat.format(Number(value))} ₸`;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT: "Черновик",
  CONFIRMED: "Подтверждён",
  SHIPPED: "Отгружен",
  CANCELLED: "Отменён",
};
