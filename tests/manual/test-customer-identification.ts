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

const baseContext: BotContext = {
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
  },
  messages: {
    support_confirmation: "Mensagem dinâmica de suporte",
  },
};

function createUseCaseFixture(messages?: Record<string, string>) {
  const sessionStore = new Map<string, SessionState>();
  const sendTextCalls: Array<Record<string, unknown>> = [];
  const transferCalls: Array<Record<string, unknown>> = [];
  const context: BotContext = {
    ...baseContext,
    messages: {
      ...baseContext.messages,
      ...(messages ?? {}),
    },
    features: {
      customerIdentification: {
        enabled: true,
        requiredBeforeTransfer: true,
      },
    },
  };

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

  return { context, sessionStore, sendTextCalls, transferCalls, useCase };
}

async function runScenario(params: {
  name: string;
  messages?: Record<string, string>;
  expectedPrompt: string;
  expectedInvalid: string;
  expectedTemplate: string;
}) {
  const { context, sessionStore, sendTextCalls, transferCalls, useCase } =
    createUseCaseFixture(params.messages);

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
    context,
  );

  const pendingSession = sessionStore.get("15551");
  if (!pendingSession || pendingSession.stage !== "awaiting_customer_identification") {
    throw new Error(`${params.name}: deveria entrar em awaiting_customer_identification`);
  }

  if (sendTextCalls.length !== 1 || sendTextCalls[0]?.message !== params.expectedPrompt) {
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
      text: "   ",
      fromMe: false,
      isButtonReply: false,
      status: "pending",
      raw: {},
    },
    context,
  );

  const invalidSession = sessionStore.get("15551");
  if (!invalidSession || invalidSession.stage !== "awaiting_customer_identification") {
    throw new Error(`${params.name}: entrada vazia deveria manter awaiting_customer_identification`);
  }

  if (sendTextCalls.length !== 2 || sendTextCalls[1]?.message !== params.expectedInvalid) {
    throw new Error(`${params.name}: entrada vazia deveria responder com a mensagem inválida`);
  }

  await useCase.execute(
    {
      provider: "evolution",
      messageId: "msg-3",
      conversationId: "15551",
      ticketId: "15551",
      companyId: 1,
      whatsappId: 122,
      contactId: "84",
      phone: "5541999999999",
      kind: "text",
      text: "Banapneus",
      fromMe: false,
      isButtonReply: false,
      status: "pending",
      raw: {},
    },
    context,
  );

  const completedSession = sessionStore.get("15551");
  if (!completedSession || completedSession.stage !== "waiting_human") {
    throw new Error(`${params.name}: deveria finalizar em waiting_human`);
  }

  if (completedSession.identificationType !== "company_name") {
    throw new Error(
      `${params.name}: identificationType esperado company_name, recebido ${String(completedSession.identificationType)}`,
    );
  }

  if (completedSession.customerIdentification !== "Banapneus") {
    throw new Error(
      `${params.name}: customerIdentification esperado Banapneus, recebido ${String(completedSession.customerIdentification)}`,
    );
  }

  if (transferCalls.length !== 1) {
    throw new Error(`${params.name}: deveria transferir após a identificação`);
  }

  const transferMessage = String(transferCalls[0]?.message ?? "");
  const expectedTransferMessage = params.expectedTemplate.replaceAll(
    "{{value}}",
    "Banapneus",
  );

  if (
    !transferMessage.includes(expectedTransferMessage) ||
    !transferMessage.includes("Mensagem dinâmica de suporte")
  ) {
    throw new Error(
      `${params.name}: mensagem de transferência não contém o template esperado`,
    );
  }

  console.log(`\n=== ${params.name} ===`);
  console.log({
    prompt: sendTextCalls[0]?.message,
    invalid: sendTextCalls[1]?.message,
    transferMessage,
  });
}

await runScenario({
  name: "CONFIG COMPLETA",
  messages: {
    customer_identification_prompt: "PROMPT CUSTOMIZADO",
    customer_identification_invalid: "INVALIDO CUSTOMIZADO",
    customer_identification_transfer_template: "Cliente informado: {{value}}",
  },
  expectedPrompt: "PROMPT CUSTOMIZADO",
  expectedInvalid: "INVALIDO CUSTOMIZADO",
  expectedTemplate: "Cliente informado: {{value}}",
});

await runScenario({
  name: "CONFIG AUSENTE",
  messages: {},
  expectedPrompt:
    "Para adiantar seu atendimento, informe o nome da sua empresa ou o CNPJ.",
  expectedInvalid:
    "Não consegui identificar a informação enviada.\n\nPor favor, informe o nome da empresa ou o CNPJ.",
  expectedTemplate: "Identificação do cliente: {{value}}",
});

console.log("OK");

process.exit(0);
