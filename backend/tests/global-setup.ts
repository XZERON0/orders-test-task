import { execSync } from "node:child_process";
import pg from "pg";

/** Создаёт тестовую базу, если её нет, и приводит её схему к prisma/schema.prisma.
 *  Данные между тестами чистит resetDb() в tests/helpers.ts. */
export default async function setup() {
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error("TEST_DATABASE_URL не задан — см. backend/.env.example");
  }

  const url = new URL(testUrl);
  const dbName = url.pathname.slice(1);
  const adminUrl = new URL(testUrl);
  adminUrl.pathname = "/postgres";
  adminUrl.search = "";

  const client = new pg.Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (exists.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await client.end();
  }

  execSync("prisma db push", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testUrl },
  });
}
