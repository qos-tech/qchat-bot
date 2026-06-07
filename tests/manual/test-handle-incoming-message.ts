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
    console.log("TRANSFERIU:");
    console.log(params);
  },
};

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
    triageQueueId: "46",
    supportQueueId: "1",
    financeQueueId: "3",
    otherQueueId: "2",
  },
);

await useCase.execute({
  provider: "qchat",
  messageId: "msg-1",
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
});

process.exit(0);
