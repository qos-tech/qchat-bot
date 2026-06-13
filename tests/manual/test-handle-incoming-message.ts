import { HandleIncomingMessageUseCase } from "../../src/application/use-cases/handle-incoming-message-use-case.js";
import type { BotContext } from "../../src/application/context/bot-context.js";

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
          id: "option_others",
          label: "Outros Assuntos",
          action: {
            type: "transfer",
            queueId: "999",
            intent: "other_test",
            messageKey: "other_confirmation",
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
          id: "option_others",
          label: "Outros Assuntos",
          action: {
            type: "transfer",
            queueId: "999",
            intent: "other_test",
            messageKey: "other_confirmation",
          },
        },
      ],
    },
  },

  messages: {
    other_confirmation: "Mensagem dinâmica do banco/teste",
  },
};

const sessions = {
  async findByTicketId(ticketId: string) {
    console.log("Buscou sessão:", ticketId);

    return {
      ticketId,
      provider: "qchat" as const,
      companyId: "1",
      whatsappId: "122",
      contactId: "84",
      phone: "5541999999999",
      stage: "awaiting_main_menu" as const,
    };
  },

  async save(session: unknown) {
    console.log("SESSÃO SALVA:");
    console.log(session);
  },

  async deleteByTicketId() {},
};

const messaging = {
  async sendText(params: unknown) {
    console.log("TEXTO ENVIADO:");
    console.log(params);
  },

  async sendButtons(params: any) {
    console.log("MENU ENVIADO:");
    console.log(JSON.stringify(params.payload, null, 2));
  },
};

const transfer = {
  async transfer(params: unknown) {
    transferCalled = true;
    console.log("TRANSFERIU:");
    console.log(params);
  },
};

let transferCalled = false;

const businessHours = {
  async check() {
    console.log("Verificou horário");

    return {
      isOpen: false,
      reason: "after_closing" as const,
    };
  },
};

const useCase = new HandleIncomingMessageUseCase(
  sessions,
  messaging,
  transfer,
  businessHours,
  {
    triageQueueId: "legacy-triage",
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

await useCase.execute(
  {
    provider: "qchat",
    messageId: "msg-1",
    conversationId: "15551",
    ticketId: "15551",
    companyId: "1",
    whatsappId: "122",
    contactId: "84",
    phone: "5541999999999",
    kind: "button",
    text: "Outros Assuntos",
    buttonId: "option_others",
    buttonText: "Outros Assuntos",
    isButtonReply: true,
    fromMe: false,
    status: "pending",
    queueId: "46",
    userId: null,
    raw: {},
  },
  botContext,
);

if (!transferCalled) {
  throw new Error("Fluxo dinâmico não usou context.triageQueueId");
}

let evolutionMenuSent = false;

const evolutionSessions = {
  async findByTicketId(ticketId: string) {
    console.log("Buscou sessão Evolution:", ticketId);

    return null;
  },

  async save(session: unknown) {
    console.log("SESSÃO EVOLUTION SALVA:");
    console.log(session);
  },

  async deleteByTicketId() {},
};

const evolutionMessaging = {
  async sendText(params: unknown) {
    console.log("TEXTO EVOLUTION ENVIADO:");
    console.log(params);
  },

  async sendButtons(params: any) {
    evolutionMenuSent = true;
    console.log("MENU EVOLUTION ENVIADO:");
    console.log(JSON.stringify(params.payload, null, 2));
  },
};

const evolutionUseCase = new HandleIncomingMessageUseCase(
  evolutionSessions,
  evolutionMessaging,
  transfer,
  businessHours,
  {
    triageQueueId: "legacy-triage",
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

await evolutionUseCase.execute(
  {
    provider: "evolution",
    messageId: "msg-evolution-1",
    conversationId: "4120182200:554197035511",
    ticketId: "4120182200:554197035511",
    phone: "554197035511",
    kind: "text",
    text: "Olá",
    fromMe: false,
    isButtonReply: false,
    status: "pending",
    raw: {},
  },
  botContext,
);

if (!evolutionMenuSent) {
  throw new Error("Mensagem Evolution sem queueId não deveria ser bloqueada");
}

process.exit(0);
