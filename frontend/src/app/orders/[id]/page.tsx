"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { OrderActions } from "@/components/OrderActions";
import { formatMoney, STATUS_LABEL } from "@/lib/format";
import { useOrder } from "@/lib/orders";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, error } = useOrder(id);

  if (isLoading) return <p>Загрузка…</p>;
  if (error) return <div className="error">{error.message}</div>;
  if (!order) return null;

  return (
    <>
      <p>
        <Link href="/orders">← Все заказы</Link>
      </p>
      <div className="toolbar">
        <h1>
          Заказ №{order.number} <span className={`status status-${order.status}`}>{STATUS_LABEL[order.status]}</span>
        </h1>
        <OrderActions order={order} />
      </div>

      <div className="card">
        <div>Клиент: {order.customerName}</div>
        <div>Скидка: {Number(order.discountPercent)}%</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Товар</th>
            <th>Артикул</th>
            <th className="num">Кол-во</th>
            <th className="num">Цена</th>
            <th className="num">Сумма со скидкой</th>
          </tr>
        </thead>
        <tbody>
          {order.lines.map((line) => (
            <tr key={line.id}>
              <td>{line.product.name}</td>
              <td>{line.product.sku}</td>
              <td className="num">{line.quantity}</td>
              <td className="num">{formatMoney(line.unitPrice)}</td>
              <td className="num">{formatMoney(line.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="total">Итого: {formatMoney(order.total)}</div>
    </>
  );
}
