import { readFileSync } from "node:fs";
import { join } from "node:path";
import { HandleIncomingMessageUseCase } from "../../src/application/use-cases/handle-incoming-message-use-case.js";
import { BotContextMapper } from "../../src/application/context/bot-context-mapper.js";
import { createApp } from "../../src/presentation/http/create-app.js";
import type { BotConfig } from "../../src/domain/bot/bot-config.js";
import type { BotContext } from "../../src/application/context/bot-context.js";
import type { NormalizedIncomingMessage } from "../../src/domain/messaging/normalized-incoming-message.js";

type SessionState = {
  ticketId: string;
  provider: "evolution";
  phone: string;
  stage: "awaiting_main_menu" | "awaiting_customer_identification" | "waiting_human";
  intent?: string;
  pendingAction?: string;
  pendingQueueId?: string;
  pendingIntent?: string;
  pendingMessageKey?: string;
  cnpj?: string;
};

const textFixture = JSON.parse(
  readFileSync(
    join(process.cwd(), "tests", "fixtures", "evolution", "text.json"),
    "utf-8",
  ),
);

const buttonFixture = JSON.parse(
  readFileSync(
    join(process.cwd(), "tests", "fixtures", "evolution", "button.json"),
    "utf-8",
  ),
);

const botConfig: BotConfig = {
  id: "bot-qos-prod",
  name: "QoS Prod",
  webhookToken: "qos-prod",
  companyId: 1,
  whatsappId: 127,
  active: true,
  qchat: {
    apiUrl: "https://api.qchat.test.local",
    apiToken: "qchat-token",
  },
  evolution: {
    apiUrl: "https://api.evolution.test.local",
    apiKey: "evolution-token",
    instance: "4120182200",
  },
  queues: {
    triageQueueId: "46",
    supportQueueId: "1",
    financeQueueId: "3",
    otherQueueId: "2",
  },
  businessHours: {},
  messages: {
    support_confirmation: "Encaminhando para suporte",
    other_confirmation: "Encaminhando para outros assuntos",
    customer_identification_prompt: "PROMPT EVOLUTION",
    customer_identification_invalid: "INVALID EVOLUTION",
    customer_identification_transfer_template:
      "Cliente informado: {{value}}",
  },
  features: {
    customerIdentification: {
      enabled: true,
      requiredBeforeTransfer: true,
    },
  },
  menus: {
    main: {
      id: "main",
      title: "Menu Principal",
      description: "Escolha uma opcao:",
      buttons: [
        {
          id: "opt_confirm",
          label: "Confirmar",
          action: {
            type: "transfer",
            queueId: "1",
            intent: "support",
            messageKey: "support_confirmation",
          },
        },
      ],
    },
    after_hours: {
      id: "after_hours",
      title: "Menu Fora do Horario",
      description: "Escolha uma opcao:",
      buttons: [
        {
          id: "opt_confirm",
          label: "Confirmar",
          action: {
            type: "transfer",
            queueId: "1",
            intent: "support",
            messageKey: "support_confirmation",
          },
        },
      ],
    },
  },
};

const context = BotContextMapper.fromConfig(botConfig);
const botContext: BotContext = context;

const sessionStore = new Map<string, SessionState>();
const sendButtonCalls: Array<{ phone: string; title: string }> = [];
const sendTextCalls: Array<{ phone: string; message: string }> = [];
const transferCalls: Array<{ number: string; queueId: string | number }> = [];
const lookupCalls: Array<{
  phone: string;
  companyId?: string | number;
  whatsappId?: string | number;
  result?: string;
}> = [];

let latestTicketStatus: "open" | "pending" | "closed" | null = null;
let resolveBotConfigCalledWith: string | null = null;

const sessions = {
  async findByTicketId(ticketId: string) {
    return sessionStore.get(ticketId) ?? null;
  },
  async save(session: SessionState) {
    sessionStore.set(session.ticketId, session);
  },
  async deleteByTicketId(ticketId: string) {
    sessionStore.delete(ticketId);
  },
};

const messaging = {
  async sendText(params: { phone: string; message: string }) {
    sendTextCalls.push({
      phone: params.phone,
      message: params.message,
    });
  },
  async sendButtons(params: { phone: string; payload: { title: string } }) {
    sendButtonCalls.push({
      phone: params.phone,
      title: params.payload.title,
    });
  },
};

const transfer = {
  async transfer(params: {
    number: string;
    queueId: string | number;
    message?: string;
  }) {
    transferCalls.push({
      number: params.number,
      queueId: params.queueId,
      message: params.message,
    });
  },
};

const businessHours = {
  async check() {
    return {
      isOpen: true,
      reason: "open" as const,
    };
  },
};

const qchatTicketStatusLookup = {
  async findLatestByContact(params: {
    phone: string;
    companyId?: string | number;
    whatsappId?: string | number;
  }) {
    lookupCalls.push({
      ...params,
      result: latestTicketStatus ?? undefined,
    });

    if (!latestTicketStatus) {
      return null;
    }

    return {
      ticketId: "987",
      status: latestTicketStatus,
      contactId: "84",
      companyId: "1",
      whatsappId: "127",
    };
  },
};

const useCase = new HandleIncomingMessageUseCase(
  sessions,
  messaging,
  transfer,
  businessHours,
  botConfig.queues,
  qchatTicketStatusLookup,
);

const app = createApp({
  botConfigResolver: {
    async resolveByWebhookToken() {
      return null;
    },
    async resolveByMessage() {
      return null;
    },
    async resolveByEvolutionInstance(instance: string) {
      resolveBotConfigCalledWith = instance;
      return instance === botConfig.evolution.instance ? botConfig : null;
    },
  },
  createDynamicHandleIncomingMessageUseCase() {
    return useCase;
  },
});

function resetScenarioState() {
  sessionStore.clear();
  sendButtonCalls.length = 0;
  sendTextCalls.length = 0;
  transferCalls.length = 0;
  lookupCalls.length = 0;
  latestTicketStatus = null;
  resolveBotConfigCalledWith = null;
}

function resetEventLogs() {
  sendButtonCalls.length = 0;
  sendTextCalls.length = 0;
  transferCalls.length = 0;
  lookupCalls.length = 0;
}

async function runTextWithoutSession() {
  resetScenarioState();

  const response = await app.inject({
    method: "POST",
    url: "/webhook/evolution",
    payload: textFixture,
  });

  if (response.statusCode !== 200) {
    throw new Error(`Scenario 1 deveria retornar 200, recebeu ${response.statusCode}`);
  }

  if (resolveBotConfigCalledWith !== botConfig.evolution.instance) {
    throw new Error("Scenario 1 não resolveu o bot pela Evolution instance");
  }

  const saved = sessionStore.get("4120182200:554197035511");
  if (!saved || saved.stage !== "awaiting_main_menu") {
    throw new Error("Scenario 1 não salvou sessão awaiting_main_menu");
  }

  if (sendButtonCalls.length !== 1 || sendButtonCalls[0]?.title !== "Menu Principal") {
    throw new Error("Scenario 1 não enviou o menu principal");
  }

  console.log("SCENARIO 1 - TEXTO SEM SESSAO");
  console.log(response.json());
  console.log({ savedSession: saved, sendButtonCalls });
}

async function runButtonClick() {
  const response = await app.inject({
    method: "POST",
    url: "/webhook/evolution",
    payload: buttonFixture,
  });

  if (response.statusCode !== 200) {
    throw new Error(`Scenario 2 deveria retornar 200, recebeu ${response.statusCode}`);
  }

  const saved = sessionStore.get("4120182200:554197035511");
  if (!saved || saved.stage !== "awaiting_customer_identification") {
    throw new Error("Scenario 2 deveria salvar sessão awaiting_customer_identification");
  }

  if (sendTextCalls.length !== 1 || sendTextCalls[0]?.message !== "PROMPT EVOLUTION") {
    throw new Error("Scenario 2 deveria pedir identificação antes de transferir");
  }

  if (transferCalls.length !== 0) {
    throw new Error("Scenario 2 não deveria transferir antes do CNPJ");
  }

  const cnpjFixture = JSON.parse(JSON.stringify(textFixture));
  cnpjFixture.data.message.conversation = "04.252.011/0001-10";
  cnpjFixture.data.messageType = "conversation";
  cnpjFixture.data.status = "DELIVERY_ACK";

  const cnpjResponse = await app.inject({
    method: "POST",
    url: "/webhook/evolution",
    payload: cnpjFixture,
  });

  if (cnpjResponse.statusCode !== 200) {
    throw new Error(`Scenario 2b deveria retornar 200, recebeu ${cnpjResponse.statusCode}`);
  }

  const completed = sessionStore.get("4120182200:554197035511");
  if (!completed || completed.stage !== "waiting_human") {
    throw new Error("Scenario 2b deveria salvar sessão waiting_human");
  }

  if (completed.cnpj !== "04252011000110") {
    throw new Error("Scenario 2b deveria salvar CNPJ normalizado");
  }

  if (transferCalls.length !== 1 || transferCalls[0]?.queueId !== "1") {
    throw new Error("Scenario 2b deveria transferir para a fila esperada");
  }

  if (
    !String(transferCalls[0]?.message).includes("04252011000110") ||
    !String(transferCalls[0]?.message).includes("Cliente informado: 04252011000110") ||
    !String(transferCalls[0]?.message).includes("Encaminhando para suporte")
  ) {
    throw new Error(
      `Scenario 2b deveria incluir a identificação na mensagem enviada ao QChat. Recebido: ${String(transferCalls[0]?.message)}`,
    );
  }

  console.log("SCENARIO 2 - CLIQUE DE BOTAO + CNPJ");
  console.log(response.json());
  console.log(cnpjResponse.json());
  console.log({ savedSession: completed, sendTextCalls, transferCalls });
}

async function runWaitingHumanOpen() {
  resetEventLogs();
  latestTicketStatus = "open";

  const response = await app.inject({
    method: "POST",
    url: "/webhook/evolution",
    payload: textFixture,
  });

  if (response.statusCode !== 200) {
    throw new Error(`Scenario 3 deveria retornar 200, recebeu ${response.statusCode}`);
  }

  const saved = sessionStore.get("4120182200:554197035511");
  if (!saved || saved.stage !== "waiting_human") {
    throw new Error("Scenario 3 não deveria alterar a sessão waiting_human");
  }

  if (sendButtonCalls.length !== 0 || transferCalls.length !== 0) {
    throw new Error("Scenario 3 não deveria responder nem transferir");
  }

  if (lookupCalls.length !== 1 || lookupCalls[0]?.result !== "open") {
    throw new Error("Scenario 3 não consultou ticket aberto corretamente");
  }

  console.log("SCENARIO 3 - WAITING_HUMAN COM TICKET ABERTO");
  console.log(response.json());
  console.log({ lookupCalls, session: saved });
}

async function runWaitingHumanClosed() {
  resetEventLogs();
  latestTicketStatus = "closed";

  const response = await app.inject({
    method: "POST",
    url: "/webhook/evolution",
    payload: textFixture,
  });

  if (response.statusCode !== 200) {
    throw new Error(`Scenario 4 deveria retornar 200, recebeu ${response.statusCode}`);
  }

  const saved = sessionStore.get("4120182200:554197035511");
  if (!saved || saved.stage !== "awaiting_main_menu") {
    throw new Error("Scenario 4 deveria reiniciar o fluxo e salvar awaiting_main_menu");
  }

  if (sendButtonCalls.length !== 1 || sendButtonCalls[0]?.title !== "Menu Principal") {
    throw new Error("Scenario 4 deveria enviar um novo menu");
  }

  if (lookupCalls.length !== 1 || lookupCalls[0]?.result !== "closed") {
    throw new Error("Scenario 4 não consultou ticket fechado corretamente");
  }

  console.log("SCENARIO 4 - WAITING_HUMAN COM TICKET FECHADO");
  console.log(response.json());
  console.log({ lookupCalls, session: saved, sendButtonCalls });
}

await runTextWithoutSession();
await runButtonClick();
await runWaitingHumanOpen();
await runWaitingHumanClosed();

await app.close();

console.log("OK");

process.exit(0);
