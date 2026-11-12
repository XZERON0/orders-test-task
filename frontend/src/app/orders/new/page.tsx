"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/format";
import { useCreateOrder, useProducts } from "@/lib/orders";

interface LineDraft {
  productId: string;
  quantity: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const { data: products } = useProducts();
  const createOrder = useCreateOrder();

  const [customerName, setCustomerName] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [lines, setLines] = useState<LineDraft[]>([{ productId: "", quantity: 1 }]);

  const updateLine = (index: number, patch: Partial<LineDraft>) =>
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    createOrder.mutate(
      { customerName, discountPercent, lines: lines.filter((line) => line.productId) },
      { onSuccess: (order) => router.push(`/orders/${order.id}`) },
    );
  };

  return (
    <form onSubmit={submit}>
      <div className="toolbar">
        <h1>Новый заказ</h1>
        <button type="submit" className="primary" disabled={createOrder.isPending}>
          Создать
        </button>
      </div>

      {createOrder.error && <div className="error">{createOrder.error.message}</div>}

      <div className="card">
        <div className="form-row">
          <label>
            Клиент{" "}
            <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
          </label>
          <label>
            Скидка, %{" "}
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={discountPercent}
              onChange={(event) => setDiscountPercent(Number(event.target.value))}
            />
          </label>
        </div>
      </div>

      <div className="card">
        {lines.map((line, index) => (
          <div className="form-row" key={index}>
            <select value={line.productId} onChange={(event) => updateLine(index, { productId: event.target.value })}>
              <option value="">— товар —</option>
              {products?.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · {formatMoney(product.price)} · доступно {product.available}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={line.quantity}
              onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })}
              style={{ width: 80 }}
            />
            <button type="button" onClick={() => setLines((current) => current.filter((_, i) => i !== index))}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setLines((current) => [...current, { productId: "", quantity: 1 }])}>
          + Строка
        </button>
      </div>
    </form>
  );
}
