"use client";

import { formatMoney } from "@/lib/format";
import { useProducts } from "@/lib/orders";

export default function ProductsPage() {
  const { data: products, isLoading, error } = useProducts();

  return (
    <>
      <div className="toolbar">
        <h1>Остатки</h1>
      </div>

      {isLoading && <p>Загрузка…</p>}
      {error && <div className="error">{error.message}</div>}

      {products && (
        <table>
          <thead>
            <tr>
              <th>Товар</th>
              <th>Артикул</th>
              <th className="num">Цена</th>
              <th className="num">На складе</th>
              <th className="num">В резерве</th>
              <th className="num">Доступно</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td className="num">{formatMoney(product.price)}</td>
                <td className="num">{product.onHand}</td>
                <td className="num">{product.reserved}</td>
                <td className="num">{product.available}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
