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

async function runCustomerIdentificationEnabledScenario() {
  const context: BotContext = {
    ...baseContext,
    features: {
      customerIdentification: {
        enabled: true,
        requiredBeforeTransfer: true,
      },
    },
  };

  const { sessionStore, sendTextCalls, transferCalls, useCase } =
    createUseCaseFixture(context);

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
    context,
  );

  const session = sessionStore.get("15551");
  if (session?.stage !== "awaiting_customer_identification") {
    throw new Error(
      "customerIdentification.enabled=true deveria pedir identificação antes de transferir",
    );
  }

  if (sendTextCalls.length !== 1) {
    throw new Error("customerIdentification.enabled=true deveria enviar prompt");
  }

  if (transferCalls.length !== 0) {
    throw new Error("customerIdentification.enabled=true não deveria transferir ainda");
  }
}

async function runCustomerIdentificationDisabledScenario() {
  const context: BotContext = {
    ...baseContext,
    features: {
      customerIdentification: {
        enabled: false,
        requiredBeforeTransfer: false,
      },
    },
  };

  const { sessionStore, sendTextCalls, transferCalls, useCase } =
    createUseCaseFixture(context);

  sessionStore.set("15552", {
    ticketId: "15552",
    provider: "evolution",
    phone: "5541999999998",
    stage: "awaiting_main_menu",
  });

  await useCase.execute(
    {
      provider: "evolution",
      messageId: "msg-2",
      conversationId: "15552",
      ticketId: "15552",
      companyId: 1,
      whatsappId: 122,
      phone: "5541999999998",
      kind: "button",
      text: "Suporte",
      buttonId: "option_support",
      buttonText: "Suporte",
      isButtonReply: true,
      fromMe: false,
      status: "pending",
      raw: {},
    },
    context,
  );

  const session = sessionStore.get("15552");
  if (session?.stage !== "waiting_human") {
    throw new Error(
      "customerIdentification.enabled=false deveria transferir imediatamente",
    );
  }

  if (sendTextCalls.length !== 0) {
    throw new Error("customerIdentification.enabled=false não deveria enviar prompt");
  }

  if (transferCalls.length !== 1) {
    throw new Error("customerIdentification.enabled=false deveria transferir");
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

await runCustomerIdentificationEnabledScenario();
await runCustomerIdentificationDisabledScenario();
await runQchatLifecycleConfigScenario();

console.log("OK");

process.exit(0);
