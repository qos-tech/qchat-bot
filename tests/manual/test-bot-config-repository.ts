import { PostgresBotConfigRepository } from "../../src/infrastructure/repositories/postgres-bot-config-repository.js";

const repository = new PostgresBotConfigRepository();

const byToken = await repository.findByWebhookToken("qos-prod");

console.log("CONFIG POR TOKEN:");
console.log(JSON.stringify(byToken, null, 2));

const byCompanyWhatsapp = await repository.findByCompanyAndWhatsapp(1, 127);

console.log("CONFIG POR COMPANY/WHATSAPP:");
console.log(JSON.stringify(byCompanyWhatsapp, null, 2));

process.exit(0);
