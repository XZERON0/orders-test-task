import "dotenv/config";
import pg from "pg";

// Создаёт рабочую базу из DATABASE_URL, если её ещё нет (нужно для своего Postgres без docker).
const url = new URL(process.env.DATABASE_URL ?? "");
const dbName = url.pathname.slice(1);
url.pathname = "/postgres";
url.search = "";

const client = new pg.Client({ connectionString: url.toString() });
await client.connect();
try {
  const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (exists.rowCount === 0) {
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`База ${dbName} создана`);
  }
} finally {
  await client.end();
}
