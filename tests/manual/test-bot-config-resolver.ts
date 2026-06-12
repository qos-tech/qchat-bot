import { DefaultBotConfigResolver } from "../../src/application/services/default-bot-config-resolver.js";
import { PostgresBotConfigRepository } from "../../src/infrastructure/repositories/postgres-bot-config-repository.js";

const repository = new PostgresBotConfigRepository();
const resolver = new DefaultBotConfigResolver(repository);

const byMessage = await resolver.resolveByMessage({
  companyId: 1,
  whatsappId: 127,
});

if (!byMessage) {
  throw new Error("Bot qos-prod não encontrado por companyId/whatsappId");
}

console.log("RESOLVE POR MENSAGEM:");
console.log(JSON.stringify(byMessage, null, 2));

const byToken = await resolver.resolveByWebhookToken(byMessage.webhookToken);

if (!byToken) {
  throw new Error("Bot qos-prod não encontrado por webhook token");
}

console.log("RESOLVE POR TOKEN:");
console.log(JSON.stringify(byToken, null, 2));

const secondBotByToken = await resolver.resolveByWebhookToken("qos-test-bot");

if (!secondBotByToken) {
  throw new Error("Segundo bot não encontrado por webhook token");
}

console.log("RESOLVE SEGUNDO BOT POR TOKEN:");
console.log(JSON.stringify(secondBotByToken, null, 2));

if (
  secondBotByToken.companyId !== 2 ||
  secondBotByToken.whatsappId !== 228
) {
  throw new Error("Segundo bot encontrado com configuração inesperada");
}

const secondBotByMessage = await resolver.resolveByMessage({
  companyId: 2,
  whatsappId: 228,
});

if (!secondBotByMessage) {
  throw new Error("Segundo bot não encontrado por companyId/whatsappId");
}

console.log("RESOLVE SEGUNDO BOT POR MENSAGEM:");
console.log(JSON.stringify(secondBotByMessage, null, 2));

process.exit(0);
