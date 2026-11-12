export type OrderStatus = "DRAFT" | "CONFIRMED" | "SHIPPED" | "CANCELLED";

export interface OrderLine {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  product: { id: string; name: string; sku: string };
}

export interface Order {
  id: string;
  number: number;
  customerName: string;
  status: OrderStatus;
  discountPercent: string;
  total: string;
  createdAt: string;
  lines: OrderLine[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: string;
  onHand: number;
  reserved: number;
  available: number;
}

export interface Me {
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
}

export const USERS = [
  { token: "aliya", label: "Алия — ТОО «Ромашка»" },
  { token: "bekzat", label: "Бекзат — ИП «Береке»" },
];

const TOKEN_KEY = "token";

export function getToken(): string {
  if (typeof window === "undefined") return USERS[0].token;
  return window.localStorage.getItem(TOKEN_KEY) ?? USERS[0].token;
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `Ошибка ${res.status}`);
  }
  return data as T;
}
