import { Pool } from "pg";
import { env } from "../../config/env.js";

const connectionString = env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não definida no ambiente");
}

export const db = new Pool({
  connectionString,
});
