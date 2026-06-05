import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definida no ambiente");
}

export const db = new Pool({
  connectionString,
});
