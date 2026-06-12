import { maskWebhookToken } from "../application/security/webhook-token.js";
import { db } from "../infrastructure/database/db.js";

type BotListRow = {
  name: string;
  company_id: number | null;
  whatsapp_id: number | null;
  webhook_token: string;
};

try {
  const result = await db.query<BotListRow>(`
    SELECT
      name,
      company_id,
      whatsapp_id,
      webhook_token
    FROM bot_configs
    WHERE active = true
    ORDER BY name ASC
  `);

  console.log("Bot Name | CompanyId | WhatsAppId | Token Masked");

  for (const bot of result.rows) {
    console.log(
      [
        bot.name,
        bot.company_id ?? "",
        bot.whatsapp_id ?? "",
        maskWebhookToken(bot.webhook_token),
      ].join(" | "),
    );
  }
} finally {
  await db.end();
}
