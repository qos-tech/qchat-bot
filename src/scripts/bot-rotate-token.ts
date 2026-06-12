import {
  generateWebhookToken,
  maskWebhookToken,
} from "../application/security/webhook-token.js";
import { db } from "../infrastructure/database/db.js";
import {
  buildBotSelectorWhere,
  parseBotSelector,
} from "./bot-selector.js";

type BotTokenRow = {
  id: string;
  name: string;
  webhook_token: string;
};

const botId = process.argv[2];

if (!botId) {
  console.error(
    "Uso: npm run bot:rotate-token -- <botId|companyId:whatsappId>",
  );
  process.exit(1);
}

try {
  const selector = buildBotSelectorWhere(parseBotSelector(botId));

  const currentResult = await db.query<BotTokenRow>(
    `
    SELECT
      id,
      name,
      webhook_token
    FROM bot_configs
    WHERE ${selector.where}
    LIMIT 1
    `,
    selector.values,
  );

  const currentBot = currentResult.rows[0];

  if (!currentBot) {
    console.error(`Bot não encontrado: ${botId}`);
    process.exitCode = 1;
  } else {
    const nextToken = generateWebhookToken();

    const updatedResult = await db.query<BotTokenRow>(
      `
      UPDATE bot_configs
      SET
        webhook_token = $2,
        updated_at = now()
      WHERE id = $1
      RETURNING id, name, webhook_token
      `,
      [currentBot.id, nextToken],
    );

    const updatedBot = updatedResult.rows[0];

    if (!updatedBot) {
      console.error(`Token não foi atualizado para o bot: ${botId}`);
      process.exitCode = 1;
    } else {
      console.log(`id: ${updatedBot.id}`);
      console.log(`name: ${updatedBot.name}`);
      console.log(
        `oldTokenMasked: ${maskWebhookToken(currentBot.webhook_token)}`,
      );
      console.log(`newToken: ${updatedBot.webhook_token}`);
    }
  }
} finally {
  await db.end();
}
