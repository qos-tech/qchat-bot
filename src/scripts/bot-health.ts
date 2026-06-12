import { checkBotHealth } from "./bot-health-runner.js";

const selector = process.argv[2];

if (!selector) {
  console.error("Uso: npm run bot:health -- <botId|companyId:whatsappId>");
  process.exit(1);
}

const result = await checkBotHealth(selector);

for (const line of result.lines) {
  console.log(`[${line.level}] ${line.message}`);
}

console.log(`STATUS: ${result.status}`);

process.exitCode = result.status === "HEALTHY" ? 0 : 1;
