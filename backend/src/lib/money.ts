/** Округление денежной суммы до тиынов (два знака после запятой). */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Сумма со скидкой в процентах. */
export function applyDiscount(amount: number, discountPercent: number): number {
  return amount * (1 - discountPercent / 100);
}
