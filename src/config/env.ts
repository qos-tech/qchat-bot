import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),

  DATABASE_URL: z.string().min(1),

  EVOLUTION_API_URL: z.string().url(),
  EVOLUTION_API_KEY: z.string().min(1),
  EVOLUTION_INSTANCE: z.string().min(1),

  QCHAT_API_URL: z.string().url(),
  QCHAT_API_TOKEN: z.string().min(1),

  QCHAT_QUEUE_TRIAGE_ID: z.string().min(1),
  QCHAT_QUEUE_SUPPORT_ID: z.string().min(1),
  QCHAT_QUEUE_OTHER_ID: z.string().min(1),
  QCHAT_QUEUE_FINANCE_ID: z.string().min(1),

  BUSINESS_HOURS_TIMEZONE: z.string().default("America/Sao_Paulo"),
  BUSINESS_START_MORNING: z.string().default("08:30"),
  BUSINESS_END_MORNING: z.string().default("12:00"),
  BUSINESS_START_AFTERNOON: z.string().default("13:00"),
  BUSINESS_END_AFTERNOON: z.string().default("17:30"),

  SESSION_RETENTION_DAYS: z.coerce.number().default(7),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:");
  console.error(parsed.error.flatten().fieldErrors);

  process.exit(1);
}

export const env = parsed.data;
