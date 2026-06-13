import { PostgresBotConfigRepository } from "../../src/infrastructure/repositories/postgres-bot-config-repository.js";

const repository = new PostgresBotConfigRepository();

const byCompanyWhatsapp = await repository.findByCompanyAndWhatsapp(1, 127);

if (!byCompanyWhatsapp) {
  throw new Error("Bot qos-prod não encontrado por companyId/whatsappId");
}

console.log("CONFIG POR COMPANY/WHATSAPP:");
console.log(JSON.stringify(byCompanyWhatsapp, null, 2));

const byToken = await repository.findByWebhookToken(
  byCompanyWhatsapp.webhookToken,
);

console.log("CONFIG POR TOKEN:");
console.log(JSON.stringify(byToken, null, 2));

process.exit(0);
