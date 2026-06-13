import { HandleIncomingMessageUseCase } from "../../src/application/use-cases/handle-incoming-message-use-case.js";
import type { BotContext } from "../../src/application/context/bot-context.js";

const botContext: BotContext = {
  botId: "bot-qos-prod",
  botName: "QoS Prod",
  companyId: 1,
  whatsappId: 127,
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
    after_hours: {
      id: "after_hours",
      title: "Fora do Horario",
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
    support_confirmation: "Encaminhando para suporte",
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

async function runOpenTicketScenario() {
  let deleted = false;
  let menuSent = false;

  const useCase = new HandleIncomingMessageUseCase(
    {
      async findByTicketId() {
        return {
          ticketId: "4120182200:554197035511",
          provider: "evolution",
          phone: "554197035511",
          stage: "waiting_human" as const,
        };
      },
      async save() {},
      async deleteByTicketId() {
        deleted = true;
      },
    },
    {
      async sendText() {},
      async sendButtons() {
        menuSent = true;
      },
    },
    {
      async transfer() {},
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
        return {
          ticketId: "987",
          status: "open",
          companyId: "1",
          whatsappId: "127",
        };
      },
    },
  );

  await useCase.execute(
    {
      provider: "evolution",
      messageId: "msg-open",
      conversationId: "4120182200:554197035511",
      ticketId: "4120182200:554197035511",
      phone: "554197035511",
      kind: "text",
      text: "Ainda preciso de ajuda",
      fromMe: false,
      isButtonReply: false,
      raw: {},
    },
    botContext,
  );

  if (deleted) {
    throw new Error(
      "Sessão waiting_human não deveria ser removida com ticket aberto",
    );
  }

  if (menuSent) {
    throw new Error("Bot não deveria reenviar menu com ticket humano aberto");
  }
}

async function runClosedTicketScenario() {
  let deleted = false;
  let menuSent = false;

  const useCase = new HandleIncomingMessageUseCase(
    {
      async findByTicketId() {
        return {
          ticketId: "4120182200:554197035511",
          provider: "evolution",
          phone: "554197035511",
          stage: "waiting_human" as const,
        };
      },
      async save() {},
      async deleteByTicketId() {
        deleted = true;
      },
    },
    {
      async sendText() {},
      async sendButtons() {
        menuSent = true;
      },
    },
    {
      async transfer() {},
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
        return {
          ticketId: "987",
          status: "closed",
          companyId: "1",
          whatsappId: "127",
        };
      },
    },
  );

  await useCase.execute(
    {
      provider: "evolution",
      messageId: "msg-closed",
      conversationId: "4120182200:554197035511",
      ticketId: "4120182200:554197035511",
      phone: "554197035511",
      kind: "text",
      text: "Quero abrir novo atendimento",
      fromMe: false,
      isButtonReply: false,
      raw: {},
    },
    botContext,
  );

  if (!deleted) {
    throw new Error(
      "Sessão waiting_human deveria ser removida com ticket fechado",
    );
  }

  if (!menuSent) {
    throw new Error("Bot deveria retomar o fluxo após ticket fechado");
  }
}

await runOpenTicketScenario();
await runClosedTicketScenario();

console.log("OK");

process.exit(0);
