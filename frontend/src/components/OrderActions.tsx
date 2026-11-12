"use client";

import type { Order } from "@/lib/api";
import { useOrderAction, type OrderAction } from "@/lib/orders";

const BUTTONS: { action: OrderAction; label: string; visible: (order: Order) => boolean }[] = [
  { action: "confirm", label: "Подтвердить", visible: (o) => o.status === "DRAFT" },
  { action: "ship", label: "Отгрузить", visible: (o) => o.status === "CONFIRMED" },
  { action: "cancel", label: "Отменить", visible: (o) => o.status !== "CANCELLED" },
];

export function OrderActions({ order }: { order: Order }) {
  const mutation = useOrderAction(order.id);

  return (
    <div>
      <div className="actions">
        {BUTTONS.filter((button) => button.visible(order)).map((button) => (
          <button
            key={button.action}
            className={button.action === "confirm" ? "primary" : undefined}
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(button.action)}
          >
            {button.label}
          </button>
        ))}
      </div>
      {mutation.error && <div className="error">{mutation.error.message}</div>}
    </div>
  );
}
