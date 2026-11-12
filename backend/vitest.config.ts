import "dotenv/config";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./tests/global-setup.ts"],
    // Тесты ходят в отдельную базу, рабочая не трогается
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "" },
    // Одна база на все файлы — файлы идут по очереди
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 120_000,
  },
});
