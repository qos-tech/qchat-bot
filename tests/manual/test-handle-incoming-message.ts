import { HandleIncomingMessageUseCase } from "../../src/application/use-cases/handle-incoming-message-use-case.js";

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
      stage: "awaiting_finance_menu" as const,
      intent: "finance" as const,
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

const routing = {
  async moveToQueue(params: unknown) {
    console.log("MOVEU FILA:");
    console.log(params);
  },
};

const businessHours = {
  async check() {
    console.log("Verificou horário");

    return {
      isOpen: true,
      reason: "business_hours" as const,
    };
  },
};

const useCase = new HandleIncomingMessageUseCase(
  sessions,
  messaging,
  routing,
  businessHours,
  {
    triageQueueId: "10",
    supportQueueId: "1",
    financeQueueId: "2",
    otherQueueId: "3",
  },
);

await useCase.execute({
  provider: "qchat",
  messageId: "msg-1",
  ticketId: "15551",
  contactId: "84",
  companyId: "1",
  whatsappId: "122",
  phone: "5541999999999",

  kind: "text",
  text: "quero meu boleto",

  fromMe: false,

  isButtonReply: false,

  status: "pending",
  queueId: "10",
  userId: null,

  raw: {},
});

process.exit(0);
