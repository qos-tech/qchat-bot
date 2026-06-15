import { HandleIncomingMessageUseCase } from "../../src/application/use-cases/handle-incoming-message-use-case.js";
import type { BotContext } from "../../src/application/context/bot-context.js";

type SessionState = {
  ticketId: string;
  provider: "evolution";
  phone: string;
  stage: "awaiting_main_menu" | "waiting_human";
};

const botContext: BotContext = {
  botId: "test-bot-human-guard",
  botName: "Bot Human Guard",
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

function createUseCaseFixture(
  latestTicket: { status: string; userId?: string | number | null } | null,
) {
  const sessionStore = new Map<string, SessionState>();
  const sendTextCalls: Array<Record<string, unknown>> = [];
  const sendButtonCalls: Array<Record<string, unknown>> = [];
  const transferCalls: Array<Record<string, unknown>> = [];
  let businessHoursChecks = 0;
  const lookupCalls: Array<Record<string, unknown>> = [];

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
      async sendButtons(params: Record<string, unknown>) {
        sendButtonCalls.push(params);
      },
    },
    {
      async transfer(params: Record<string, unknown>) {
        transferCalls.push(params);
      },
    },
    {
      async check() {
        businessHoursChecks += 1;
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
    {
      async findLatestByContact(params: Record<string, unknown>) {
        lookupCalls.push(params);
        return latestTicket;
      },
    },
  );

  return {
    sessionStore,
    sendTextCalls,
    sendButtonCalls,
    transferCalls,
    lookupCalls,
    getBusinessHoursChecks() {
      return businessHoursChecks;
    },
    useCase,
  };
}

async function runHumanTicketOpenScenario() {
  const fixture = createUseCaseFixture({
    status: "open",
    userId: 2,
  });

  fixture.sessionStore.set("15560", {
    ticketId: "15560",
    provider: "evolution",
    phone: "5541999999910",
    stage: "awaiting_main_menu",
  });

  await fixture.useCase.execute(
    {
      provider: "evolution",
      messageId: "msg-human-open",
      conversationId: "15560",
      ticketId: "15560",
      companyId: 1,
      whatsappId: 122,
      phone: "5541999999910",
      kind: "text",
      text: "Olá",
      fromMe: false,
      isButtonReply: false,
      status: "pending",
      raw: {},
    },
    botContext,
  );

  const session = fixture.sessionStore.get("15560");

  if (session?.stage !== "awaiting_main_menu") {
    throw new Error("Ticket humano ativo não deveria alterar a sessão local");
  }

  if (fixture.sendTextCalls.length !== 0) {
    throw new Error("Ticket humano ativo não deveria enviar texto");
  }

  if (fixture.sendButtonCalls.length !== 0) {
    throw new Error("Ticket humano ativo não deveria enviar menu");
  }

  if (fixture.transferCalls.length !== 0) {
    throw new Error("Ticket humano ativo não deveria transferir");
  }

  if (fixture.getBusinessHoursChecks() !== 0) {
    throw new Error("Ticket humano ativo deveria bloquear antes do horário comercial");
  }

  if (fixture.lookupCalls.length !== 1) {
    throw new Error("Ticket humano ativo deveria consultar o QChat uma vez");
  }
}

async function runHumanTicketPendingScenario() {
  const fixture = createUseCaseFixture({
    status: "pending",
    userId: 7,
  });

  fixture.sessionStore.set("15561", {
    ticketId: "15561",
    provider: "evolution",
    phone: "5541999999911",
    stage: "awaiting_main_menu",
  });

  await fixture.useCase.execute(
    {
      provider: "evolution",
      messageId: "msg-human-pending",
      conversationId: "15561",
      ticketId: "15561",
      companyId: 1,
      whatsappId: 122,
      phone: "5541999999911",
      kind: "text",
      text: "Preciso de ajuda",
      fromMe: false,
      isButtonReply: false,
      status: "pending",
      raw: {},
    },
    botContext,
  );

  const session = fixture.sessionStore.get("15561");

  if (session?.stage !== "awaiting_main_menu") {
    throw new Error("Ticket pendente com atendente não deveria alterar a sessão");
  }

  if (fixture.sendTextCalls.length !== 0) {
    throw new Error("Ticket pendente com atendente não deveria enviar texto");
  }

  if (fixture.sendButtonCalls.length !== 0) {
    throw new Error("Ticket pendente com atendente não deveria enviar menu");
  }

  if (fixture.transferCalls.length !== 0) {
    throw new Error("Ticket pendente com atendente não deveria transferir");
  }

  if (fixture.getBusinessHoursChecks() !== 0) {
    throw new Error("Ticket pendente com atendente deveria bloquear antes do horário comercial");
  }

  if (fixture.lookupCalls.length !== 1) {
    throw new Error("Ticket pendente com atendente deveria consultar o QChat uma vez");
  }
}

await runHumanTicketOpenScenario();
await runHumanTicketPendingScenario();

console.log("OK");
