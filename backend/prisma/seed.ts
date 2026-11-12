import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

// Демо-данные: две организации, у каждой свой пользователь, каталог и заказы.
// Запуск повторно пересоздаёт всё с нуля.
async function main() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE order_lines, orders, stock_items, products, users, organizations CASCADE`,
  );

  const romashka = await prisma.organization.create({
    data: { id: "org_romashka", name: "ТОО «Ромашка»" },
  });
  const bereke = await prisma.organization.create({
    data: { id: "org_bereke", name: "ИП «Береке»" },
  });

  await prisma.user.create({
    data: { name: "Алия", token: "aliya", organizationId: romashka.id },
  });
  await prisma.user.create({
    data: { name: "Бекзат", token: "bekzat", organizationId: bereke.id },
  });

  const product = (
    organizationId: string,
    id: string,
    name: string,
    sku: string,
    price: string,
    onHand: number,
    reserved = 0,
  ) =>
    prisma.product.create({
      data: { id, organizationId, name, sku, price, stock: { create: { onHand, reserved } } },
    });

  await product(romashka.id, "prd_tea_black", "Чай чёрный, 100 г", "TEA-BLK", "333.33", 50);
  await product(romashka.id, "prd_tea_green", "Чай зелёный, 100 г", "TEA-GRN", "333.33", 50);
  await product(romashka.id, "prd_tea_herbal", "Чай травяной, 100 г", "TEA-HRB", "333.33", 50);
  await product(romashka.id, "prd_coffee", "Кофе в зёрнах, 1 кг", "COF-1KG", "8990.00", 1);
  const mug = await product(romashka.id, "prd_mug", "Кружка керамическая", "MUG-01", "1500.00", 20);

  const flour = await product(bereke.id, "prd_flour", "Мука пшеничная, 2 кг", "FLR-2KG", "1250.00", 100, 10);
  await product(bereke.id, "prd_sugar", "Сахар, 1 кг", "SGR-1KG", "690.00", 100);

  await prisma.order.create({
    data: {
      id: "ord_romashka_1",
      organizationId: romashka.id,
      number: 1,
      customerName: "Айгерим Сарсенова",
      total: "3000.00",
      lines: {
        create: [{ productId: mug.id, quantity: 2, unitPrice: "1500.00", lineTotal: "3000.00" }],
      },
    },
  });

  await prisma.order.create({
    data: {
      id: "ord_bereke_1",
      organizationId: bereke.id,
      number: 1,
      customerName: "ТОО «Береке-Опт»",
      status: "CONFIRMED",
      total: "12500.00",
      lines: {
        create: [{ productId: flour.id, quantity: 10, unitPrice: "1250.00", lineTotal: "12500.00" }],
      },
    },
  });

  console.log("Готово: войти можно как Алия (токен aliya) или Бекзат (токен bekzat)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
