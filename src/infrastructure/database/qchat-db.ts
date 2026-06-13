import { Pool } from "pg";
import { env } from "../../config/env.js";

const connectionString = env.QCHAT_DB_URL;

if (!connectionString) {
  throw new Error("QCHAT_DB_URL não definida no ambiente");
}

export const qchatDb = new Pool({
  connectionString,
});
