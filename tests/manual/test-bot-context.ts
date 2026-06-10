import { DefaultBotConfigResolver } from "../../src/application/services/default-bot-config-resolver.js";
import { BotContextMapper } from "../../src/application/context/bot-context-mapper.js";
import { PostgresBotConfigRepository } from "../../src/infrastructure/repositories/postgres-bot-config-repository.js";

const repository = new PostgresBotConfigRepository();
const resolver = new DefaultBotConfigResolver(repository);

const config = await resolver.resolveByWebhookToken("qos-prod");

if (!config) {
  throw new Error("Bot não encontrado");
}

const context = BotContextMapper.fromConfig(config);

console.log(JSON.stringify(context, null, 2));

process.exit(0);
