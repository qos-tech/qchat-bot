import { DefaultBotConfigResolver } from "../../src/application/services/default-bot-config-resolver.js";
import { PostgresBotConfigRepository } from "../../src/infrastructure/repositories/postgres-bot-config-repository.js";

const repository = new PostgresBotConfigRepository();
const resolver = new DefaultBotConfigResolver(repository);

const byToken = await resolver.resolveByWebhookToken("qos-prod");

console.log("RESOLVE POR TOKEN:");
console.log(JSON.stringify(byToken, null, 2));

const byMessage = await resolver.resolveByMessage({
  companyId: 1,
  whatsappId: 127,
});

console.log("RESOLVE POR MENSAGEM:");
console.log(JSON.stringify(byMessage, null, 2));

process.exit(0);
