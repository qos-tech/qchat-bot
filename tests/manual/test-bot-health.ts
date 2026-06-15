import { checkBotHealth } from "../../src/scripts/bot-health-runner.js";

const healthyByMessage = await checkBotHealth("1:127");

if (healthyByMessage.status !== "HEALTHY") {
  throw new Error("Bot QoS deveria estar saudável por companyId/whatsappId");
}

if (healthyByMessage.lines[0]?.message !== "BotConfig válido") {
  throw new Error("Primeira linha do health check saudável inesperada");
}

const healthyMessages = healthyByMessage.lines.map((line) => line.message);
for (const expected of [
  "customer_identification_prompt válido",
  "customer_identification_invalid válido",
  "customer_identification_transfer_template válido",
]) {
  if (!healthyMessages.includes(expected)) {
    throw new Error(`Health check deveria validar ${expected}`);
  }
}

console.log("HEALTHY BY MESSAGE:");
console.log(JSON.stringify(healthyByMessage, null, 2));

const healthyByToken = await checkBotHealth("qos-test-bot");

if (healthyByToken.status !== "HEALTHY") {
  throw new Error("Bot de teste deveria estar saudável por webhook token");
}

const healthyByTokenMessages = healthyByToken.lines.map((line) => line.message);
for (const expected of [
  "customer_identification_prompt válido",
  "customer_identification_invalid válido",
  "customer_identification_transfer_template válido",
]) {
  if (!healthyByTokenMessages.includes(expected)) {
    throw new Error(`Health check do bot de teste deveria validar ${expected}`);
  }
}

console.log("HEALTHY BY TOKEN:");
console.log(JSON.stringify(healthyByToken, null, 2));

const unhealthy = await checkBotHealth("999:999");

if (unhealthy.status !== "UNHEALTHY") {
  throw new Error("Bot inexistente deveria estar unhealthy");
}

if (unhealthy.lines[0]?.message !== "BotConfig não encontrado ou inativo") {
  throw new Error("Mensagem de unhealthy inesperada");
}

console.log("UNHEALTHY:");
console.log(JSON.stringify(unhealthy, null, 2));

process.exit(0);
