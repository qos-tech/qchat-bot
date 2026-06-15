import { CUSTOMER_IDENTIFICATION_PROMPT_MESSAGE } from "../../src/application/messages/index.js";
import { HandleIncomingMessageUseCase } from "../../src/application/use-cases/handle-incoming-message-use-case.js";
import type { BotContext } from "../../src/application/context/bot-context.js";

type SessionState = {
  ticketId: string;
  provider: "evolution";
  phone: string;
  stage: "awaiting_main_menu" | "awaiting_customer_identification" | "waiting_human";
  pendingAction?: string;
  pendingQueueId?: string;
  pendingIntent?: string;
  pendingMessageKey?: string;
  customerIdentification?: string;
  identificationType?: "company_name" | "cnpj";
};

const botContext: BotContext = {
  botId: "test-bot",
  botName: "Bot Teste",
  companyId: 1,
  whatsappId: 122,
  triageQueueId: "46",
  menus: {
    main: {
      id: "main",
      title: "Menu Teste",
      description: "Escolha:",
      buttons: [
        {
          id: "option_support",
          label: "Suporte",
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
      title: "Menu Fora Teste",
      description: "Escolha:",
      buttons: [
        {
          id: "option_support",
          label: "Suporte",
          action: {
            type: "transfer",
            queueId: "1",
            intent: "support",
            messageKey: "after_hours_support_confirmation",
          },
        },
      ],
    },
  },
  messages: {
    support_confirmation: "Mensagem dinâmica de suporte",
    after_hours_support_confirmation: "Mensagem dinâmica fora do horário",
  },
};

function createUseCaseFixture() {
  const sessionStore = new Map<string, SessionState>();
  const sendTextCalls: Array<Record<string, unknown>> = [];
  const transferCalls: Array<Record<string, unknown>> = [];
  const businessHours = {
    async check() {
      return {
        isOpen: false,
        reason: "after_closing" as const,
      };
    },
  };

  const useCase = new HandleIncomingMessageUseCase(
    {
      async findByTicketId(ticketId: string) {
        return sessionStore.get(ticketId) ?? null;
      },
      async save(session: SessionState) {
        sessionStore.set(session.ticketId, session);
      },
      async deleteByTicketId(ticketId: string) {
        sessionStore.delete(ticketId);
      },
    },
    {
      async sendText(params: Record<string, unknown>) {
        sendTextCalls.push(params);
      },
      async sendButtons() {},
    },
    {
      async transfer(params: Record<string, unknown>) {
        transferCalls.push(params);
      },
    },
    businessHours,
    {
      triageQueueId: "46",
      supportQueueId: "1",
      financeQueueId: "3",
      otherQueueId: "2",
    },
    {
      async findLatestByContact() {
        return null;
      },
    },
  );

  return {
    sessionStore,
    sendTextCalls,
    transferCalls,
    useCase,
  };
}

async function runScenario(params: {
  name: string;
  identificationText: string;
  expectedType: "company_name" | "cnpj";
  expectedValue: string;
}) {
  const { sessionStore, sendTextCalls, transferCalls, useCase } = createUseCaseFixture();

  sessionStore.set("15551", {
    ticketId: "15551",
    provider: "evolution",
    phone: "5541999999999",
    stage: "awaiting_main_menu",
  });

  await useCase.execute(
    {
      provider: "evolution",
      messageId: "msg-1",
      conversationId: "15551",
      ticketId: "15551",
      companyId: 1,
      whatsappId: 122,
      contactId: "84",
      phone: "5541999999999",
      kind: "button",
      text: "Suporte",
      buttonId: "option_support",
      buttonText: "Suporte",
      isButtonReply: true,
      fromMe: false,
      status: "pending",
      raw: {},
    },
    botContext,
  );

  const pendingSession = sessionStore.get("15551");
  if (!pendingSession || pendingSession.stage !== "awaiting_customer_identification") {
    throw new Error(`${params.name}: deveria entrar em awaiting_customer_identification`);
  }

  if (sendTextCalls.length !== 1 || sendTextCalls[0]?.message !== CUSTOMER_IDENTIFICATION_PROMPT_MESSAGE) {
    throw new Error(`${params.name}: deveria enviar a solicitação de identificação`);
  }

  if (transferCalls.length !== 0) {
    throw new Error(`${params.name}: não deveria transferir antes da identificação`);
  }

  await useCase.execute(
    {
      provider: "evolution",
      messageId: "msg-2",
      conversationId: "15551",
      ticketId: "15551",
      companyId: 1,
      whatsappId: 122,
      contactId: "84",
      phone: "5541999999999",
      kind: "text",
      text: params.identificationText,
      fromMe: false,
      isButtonReply: false,
      status: "pending",
      raw: {},
    },
    botContext,
  );

  const completedSession = sessionStore.get("15551");
  if (!completedSession || completedSession.stage !== "waiting_human") {
    throw new Error(`${params.name}: deveria finalizar em waiting_human`);
  }

  if (completedSession.identificationType !== params.expectedType) {
    throw new Error(
      `${params.name}: identificationType esperado ${params.expectedType}, recebido ${String(completedSession.identificationType)}`,
    );
  }

  if (completedSession.customerIdentification !== params.expectedValue) {
    throw new Error(
      `${params.name}: customerIdentification esperado ${params.expectedValue}, recebido ${String(completedSession.customerIdentification)}`,
    );
  }

  if (transferCalls.length !== 1) {
    throw new Error(`${params.name}: deveria transferir após a identificação`);
  }

  const transferMessage = String(transferCalls[0]?.message ?? "");
  if (
    !transferMessage.includes(`Tipo: ${params.expectedType}`) ||
    !transferMessage.includes(`Valor: ${params.expectedValue}`)
  ) {
    throw new Error(`${params.name}: mensagem de transferência não contém a identificação`);
  }

  console.log(`\n=== ${params.name} ===`);
  console.log({
    identificationType: completedSession.identificationType,
    customerIdentification: completedSession.customerIdentification,
    stage: completedSession.stage,
    transferMessage,
  });
}

await runScenario({
  name: "EMPRESA",
  identificationText: "Banapneus",
  expectedType: "company_name",
  expectedValue: "Banapneus",
});

await runScenario({
  name: "CNPJ COM MASCARA",
  identificationText: "04.252.011/0001-10",
  expectedType: "cnpj",
  expectedValue: "04252011000110",
});

await runScenario({
  name: "CNPJ SEM MASCARA",
  identificationText: "04252011000110",
  expectedType: "cnpj",
  expectedValue: "04252011000110",
});

console.log("OK");

process.exit(0);
