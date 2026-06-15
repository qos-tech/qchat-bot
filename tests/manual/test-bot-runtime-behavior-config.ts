import { HandleIncomingMessageUseCase } from "../../src/application/use-cases/handle-incoming-message-use-case.js";
import type { BotContext } from "../../src/application/context/bot-context.js";

type SessionState = {
  ticketId: string;
  provider: "evolution";
  phone: string;
  stage:
    | "awaiting_main_menu"
    | "awaiting_customer_identification"
    | "waiting_human";
  pendingAction?: string;
  pendingQueueId?: string;
  pendingIntent?: string;
  pendingMessageKey?: string;
  customerIdentification?: string;
  identificationType?: "company_name" | "cnpj";
};

function createUseCaseFixture(context: BotContext) {
  const sessionStore = new Map<string, SessionState>();
  const sendTextCalls: Array<Record<string, unknown>> = [];
  const transferCalls: Array<Record<string, unknown>> = [];
  const businessHours = {
    async check() {
      return {
        isOpen: true,
        reason: "business_hours" as const,
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

  return { sessionStore, sendTextCalls, transferCalls, useCase };
}

const baseContext: BotContext = {
  botId: "bot-runtime-config",
  botName: "Bot Runtime Config",
  companyId: 1,
  whatsappId: 122,
  triageQueueId: "46",
  menus: {
    main: {
      id: "main",
      title: "Menu Principal",
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
  },
  messages: {
    support_confirmation: "CONFIRMACAO",
  },
};

async function runCustomerIdentificationScenario(params: {
  name: string;
  ticketId: string;
  context: BotContext;
  shouldPrompt: boolean;
}) {
  const { sessionStore, sendTextCalls, transferCalls, useCase } =
    createUseCaseFixture(params.context);

  sessionStore.set(params.ticketId, {
    ticketId: params.ticketId,
    provider: "evolution",
    phone: `55419999999${params.ticketId.slice(-2)}`,
    stage: "awaiting_main_menu",
  });

  await useCase.execute(
    {
      provider: "evolution",
      messageId: `msg-${params.ticketId}`,
      conversationId: params.ticketId,
      ticketId: params.ticketId,
      companyId: 1,
      whatsappId: 122,
      phone: `55419999999${params.ticketId.slice(-2)}`,
      kind: "button",
      text: "Suporte",
      buttonId: "option_support",
      buttonText: "Suporte",
      isButtonReply: true,
      fromMe: false,
      status: "pending",
      raw: {},
    },
    params.context,
  );

  const session = sessionStore.get(params.ticketId);

  if (params.shouldPrompt) {
    if (session?.stage !== "awaiting_customer_identification") {
      throw new Error(
        `${params.name}: customerIdentification deveria pedir identificação antes de transferir`,
      );
    }

    if (sendTextCalls.length !== 1) {
      throw new Error(`${params.name}: deveria enviar prompt`);
    }

    if (transferCalls.length !== 0) {
      throw new Error(`${params.name}: não deveria transferir ainda`);
    }

    return;
  }

  if (session?.stage !== "waiting_human") {
    throw new Error(
      `${params.name}: customerIdentification deveria transferir imediatamente`,
    );
  }

  if (sendTextCalls.length !== 0) {
    throw new Error(`${params.name}: não deveria enviar prompt`);
  }

  if (transferCalls.length !== 1) {
    throw new Error(`${params.name}: deveria transferir`);
  }
}

async function runQchatLifecycleConfigScenario() {
  const context: BotContext = {
    ...baseContext,
    features: {
      qchatTicketLifecycle: {
        enabled: true,
        openStatuses: ["in_progress"],
        closedStatuses: ["resolved"],
        pendingStatuses: ["waiting"],
        resumeWhenPendingInTriage: true,
      },
    },
  };

  const { sessionStore, transferCalls, useCase } = createUseCaseFixture(context);

  sessionStore.set("15553", {
    ticketId: "15553",
    provider: "evolution",
    phone: "5541999999997",
    stage: "waiting_human",
    pendingAction: "transfer",
    pendingQueueId: "1",
    pendingIntent: "support",
    pendingMessageKey: "support_confirmation",
  });

  const lookupResult = {
    ticketId: "999",
    status: "resolved",
    queueId: "1",
    userId: null,
  };

  const qchatTicketStatusLookup = {
    async findLatestByContact() {
      return lookupResult;
    },
  };

  const useCaseWithLookup = new HandleIncomingMessageUseCase(
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
      async sendText() {},
      async sendButtons() {},
    },
    {
      async transfer(params: Record<string, unknown>) {
        transferCalls.push(params);
      },
    },
    {
      async check() {
        return {
          isOpen: true,
          reason: "business_hours" as const,
        };
      },
    },
    {
      triageQueueId: "46",
      supportQueueId: "1",
      financeQueueId: "3",
      otherQueueId: "2",
    },
    qchatTicketStatusLookup,
  );

  await useCaseWithLookup.execute(
    {
      provider: "evolution",
      messageId: "msg-3",
      conversationId: "15553",
      ticketId: "15553",
      companyId: 1,
      whatsappId: 122,
      phone: "5541999999997",
      kind: "text",
      text: "Mensagem após fechamento",
      fromMe: false,
      isButtonReply: false,
      status: "pending",
      raw: {},
    },
    context,
  );

  const resultingSession = sessionStore.get("15553");

  if (resultingSession?.stage !== "awaiting_main_menu") {
    throw new Error(
      "qchatTicketLifecycle configurável deveria reiniciar o fluxo após status resolvido",
    );
  }

  if (transferCalls.length !== 0) {
    throw new Error("waiting_human com status resolvido não deveria transferir");
  }
}

await runCustomerIdentificationScenario({
  name: "features ausentes",
  ticketId: "15551",
  context: { ...baseContext },
  shouldPrompt: false,
});

await runCustomerIdentificationScenario({
  name: "features vazio",
  ticketId: "15552",
  context: {
    ...baseContext,
    features: {},
  },
  shouldPrompt: false,
});

await runCustomerIdentificationScenario({
  name: "customerIdentification.enabled=false",
  ticketId: "15553",
  context: {
    ...baseContext,
    features: {
      customerIdentification: {
        enabled: false,
        requiredBeforeTransfer: false,
      },
    },
  },
  shouldPrompt: false,
});

await runCustomerIdentificationScenario({
  name: "customerIdentification.enabled=true",
  ticketId: "15554",
    context: {
      ...baseContext,
      features: {
        customerIdentification: {
          enabled: true,
          requiredBeforeTransfer: false,
        },
      },
    },
  shouldPrompt: true,
});

await runQchatLifecycleConfigScenario();

console.log("OK");

process.exit(0);
