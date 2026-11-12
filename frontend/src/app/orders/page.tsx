"use client";

import Link from "next/link";
import { OrderActions } from "@/components/OrderActions";
import { formatMoney, STATUS_LABEL } from "@/lib/format";
import { useOrders } from "@/lib/orders";

export default function OrdersPage() {
  const { data: orders, isLoading, error } = useOrders();

  return (
    <>
      <div className="toolbar">
        <h1>Заказы</h1>
        <Link href="/orders/new" className="button primary">
          Новый заказ
        </Link>
      </div>

      {isLoading && <p>Загрузка…</p>}
      {error && <div className="error">{error.message}</div>}

      {orders && (
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Клиент</th>
              <th>Статус</th>
              <th className="num">Сумма</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link href={`/orders/${order.id}`}>{order.number}</Link>
                </td>
                <td>{order.customerName}</td>
                <td>
                  <span className={`status status-${order.status}`}>{STATUS_LABEL[order.status]}</span>
                </td>
                <td className="num">{formatMoney(order.total)}</td>
                <td>
                  <OrderActions order={order} />
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5}>Заказов пока нет</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </>
  );
}
