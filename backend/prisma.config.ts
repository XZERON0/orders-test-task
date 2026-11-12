import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7: строка подключения для CLI (db push) задаётся здесь,
// рантайм-клиент подключается через driver adapter (src/lib/prisma.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
