import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { BotContext } from "../../src/application/context/bot-context.js";
import type { BotConfigResolver } from "../../src/application/services/bot-config-resolver.js";
import type { BotConfig } from "../../src/domain/bot/bot-config.js";
import type { NormalizedIncomingMessage } from "../../src/domain/messaging/normalized-incoming-message.js";
import { createApp } from "../../src/presentation/http/create-app.js";

const fixturePath = join(process.cwd(), "tests", "fixtures", "evolution", "text.json");
const fixture = JSON.parse(readFileSync(fixturePath, "utf-8"));

const botConfig: BotConfig = {
  id: "bot-qos-prod",
  name: "QoS Prod",
  webhookToken: "hidden",
  companyId: 1,
  whatsappId: 127,
  active: true,
  qchat: {
    apiUrl: "https://api.qchat.test.local",
    apiToken: "token",
  },
  evolution: {
    apiUrl: "https://api.evolution.qosit.cloud",
    apiKey: "key",
    instance: "4120182200",
  },
  queues: {
    triageQueueId: "114",
    supportQueueId: "115",
    financeQueueId: "116",
    otherQueueId: "117",
  },
  businessHours: {},
  messages: {},
  menus: {},
};

let capturedMessage: NormalizedIncomingMessage | null = null;
let capturedContext: BotContext | null = null;
let executionCount = 0;

const app = createApp({
  botConfigResolver: {
    async resolveByWebhookToken() {
      return null;
    },
    async resolveByMessage() {
      return null;
    },
    async resolveByEvolutionInstance(instance: string) {
      return instance === botConfig.evolution.instance ? botConfig : null;
    },
  } satisfies BotConfigResolver,
  createDynamicHandleIncomingMessageUseCase() {
    return {
      async execute(message, context) {
        executionCount += 1;
        capturedMessage = message;
        capturedContext = context ?? null;
      },
    };
  },
});

const okResponse = await app.inject({
  method: "POST",
  url: "/webhook/evolution",
  payload: fixture,
});

if (okResponse.statusCode !== 200) {
  throw new Error(`Webhook Evolution deveria retornar 200. Recebido: ${okResponse.statusCode}`);
}

if (executionCount !== 1) {
  throw new Error("Use case dinâmico deveria executar exatamente uma vez");
}

if (!capturedMessage || capturedMessage.provider !== "evolution") {
  throw new Error("Mensagem normalizada do Evolution não foi capturada");
}

if (capturedMessage.conversationId !== "4120182200:554197035511") {
  throw new Error("conversationId normalizado inesperado");
}

if (!capturedContext || capturedContext.botId !== botConfig.id) {
  throw new Error("BotContext não foi criado a partir do BotConfig");
}

const ignoredResponse = await app.inject({
  method: "POST",
  url: "/webhook/evolution",
  payload: {
    ...fixture,
    event: "connection.update",
  },
});

if (ignoredResponse.statusCode !== 200) {
  throw new Error(`Evento não suportado deveria retornar 200. Recebido: ${ignoredResponse.statusCode}`);
}

if (executionCount !== 1) {
  throw new Error("Evento ignorado não deveria executar o use case");
}

const notFoundResponse = await app.inject({
  method: "POST",
  url: "/webhook/evolution",
  payload: {
    ...fixture,
    instance: "missing-instance",
  },
});

if (notFoundResponse.statusCode !== 404) {
  throw new Error(`Instance sem bot deveria retornar 404. Recebido: ${notFoundResponse.statusCode}`);
}

console.log("EVOLUTION WEBHOOK OK RESPONSE:");
console.log(okResponse.json());
console.log("EVOLUTION WEBHOOK IGNORED RESPONSE:");
console.log(ignoredResponse.json());
console.log("EVOLUTION WEBHOOK NOT FOUND RESPONSE:");
console.log(notFoundResponse.json());

await app.close();

process.exit(0);
