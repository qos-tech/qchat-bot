import { db } from "../infrastructure/database/db.js";
import {
  buildBotSelectorWhere,
  parseBotSelector,
} from "./bot-selector.js";

type BotDetailsRow = {
  id: string;
  name: string;
  company_id: number | null;
  whatsapp_id: number | null;
  webhook_token: string;
};

const botId = process.argv[2];

if (!botId) {
  console.error("Uso: npm run bot:show -- <botId|companyId:whatsappId>");
  process.exit(1);
}

try {
  const selector = buildBotSelectorWhere(parseBotSelector(botId));

  const result = await db.query<BotDetailsRow>(
    `
    SELECT
      id,
      name,
      company_id,
      whatsapp_id,
      webhook_token
    FROM bot_configs
    WHERE ${selector.where}
    LIMIT 1
    `,
    selector.values,
  );

  const bot = result.rows[0];

  if (!bot) {
    console.error(`Bot não encontrado: ${botId}`);
    process.exitCode = 1;
  } else {
    console.log(`id: ${bot.id}`);
    console.log(`name: ${bot.name}`);
    console.log(`companyId: ${bot.company_id ?? ""}`);
    console.log(`whatsappId: ${bot.whatsapp_id ?? ""}`);
    console.log(`webhookToken: ${bot.webhook_token}`);
  }
} finally {
  await db.end();
}
