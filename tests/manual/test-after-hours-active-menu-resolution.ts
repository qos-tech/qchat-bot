import { HandleIncomingMessageUseCase } from "../../src/application/use-cases/handle-incoming-message-use-case.js";
import type { BotContext } from "../../src/application/context/bot-context.js";

type SessionState = {
  ticketId: string;
  provider: "evolution";
  phone: string;
  stage: "awaiting_main_menu" | "awaiting_finance_menu";
  intent?: string;
};

type BusinessHoursState = {
  isOpen: boolean;
};

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
        {
          id: "option_finance",
          label: "Financeiro",
          action: {
            type: "send_menu",
            menuId: "finance",
          },
        },
      ],
    },
    after_hours: {
      id: "after_hours",
      title: "Menu Fora do Horario",
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
    finance: {
      id: "finance",
      title: "Menu Financeiro",
      description: "Escolha:",
      buttons: [
        {
          id: "finance_nf",
          label: "NF",
          action: {
            type: "transfer",
            queueId: "3",
            intent: "finance_nf",
            messageKey: "finance_confirmation",
          },
        },
      ],
    },
  },
  messages: {
    support_confirmation: "CONFIRMACAO_MAIN",
    after_hours_support_confirmation: "CONFIRMACAO_AFTER_HOURS",
    finance_confirmation: "CONFIRMACAO_FINANCEIRO",
  },
};

const inputBase = {
  provider: "evolution" as const,
  messageId: "msg-1",
  conversationId: "4120182200:554197035511",
  ticketId: "4120182200:554197035511",
  companyId: 1,
  whatsappId: 127,
  phone: "554197035511",
  kind: "button" as const,
  text: "Botao",
  buttonId: "option_support",
  buttonText: "Suporte",
  isButtonReply: true,
  fromMe: false,
  raw: {},
};

async function runScenario(params: {
  name: string;
  isOpen: boolean;
  stage: SessionState["stage"];
  buttonId: string;
  expectedActiveMenuId: "main" | "after_hours" | "finance";
  expectedMessageKey: string;
  expectedTransferMessage: string;
  expectedQueueId: string;
}) {
  const sessionStore = new Map<string, SessionState>([
    [
      inputBase.conversationId,
      {
        ticketId: inputBase.conversationId,
        provider: "evolution",
        phone: inputBase.phone,
        stage: params.stage,
      },
    ],
  ]);

  const transferCalls: Array<{
    queueId: string | number;
    message: string;
    number: string;
  }> = [];
  const logCalls: Array<[string, unknown?]> = [];

  const originalInfo = console.info;
  console.info = ((...args: unknown[]) => {
    logCalls.push(args as [string, unknown?]);
    originalInfo(...(args as Parameters<typeof console.info>));
  }) as typeof console.info;

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
      async sendText() {},
      async sendButtons() {},
    },
    {
      async transfer(params) {
        transferCalls.push({
          queueId: params.queueId,
          message: params.message,
          number: params.number,
        });
      },
    },
    {
      async check() {
        return {
          isOpen: params.isOpen,
          reason: params.isOpen ? ("business_hours" as const) : ("after_closing" as const),
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
      async findLatestByContact() {
        return null;
      },
    },
  );

  try {
    await useCase.execute(
      {
        ...inputBase,
        buttonId: params.buttonId,
        buttonText: params.buttonId === "finance_nf" ? "NF" : "Suporte",
      },
      botContext,
    );
  } finally {
    console.info = originalInfo;
  }

  const dynamicActionLog = logCalls.find(
    (entry) => entry[0] === "[BOT] dynamic_action_resolved",
  );

  if (!dynamicActionLog || typeof dynamicActionLog[1] !== "object" || !dynamicActionLog[1]) {
    throw new Error(`${params.name}: log dynamic_action_resolved não encontrado`);
  }

  const actionLog = dynamicActionLog[1] as Record<string, unknown>;

  if (actionLog.activeMenuId !== params.expectedActiveMenuId) {
    throw new Error(
      `${params.name}: activeMenuId esperado ${params.expectedActiveMenuId}, recebido ${String(actionLog.activeMenuId)}`,
    );
  }

  if (actionLog.buttonId !== params.buttonId) {
    throw new Error(
      `${params.name}: buttonId esperado ${params.buttonId}, recebido ${String(actionLog.buttonId)}`,
    );
  }

  if (actionLog.actionType !== "transfer") {
    throw new Error(`${params.name}: actionType deveria ser transfer`);
  }

  if (actionLog.messageKey !== params.expectedMessageKey) {
    throw new Error(
      `${params.name}: messageKey esperado ${params.expectedMessageKey}, recebido ${String(actionLog.messageKey)}`,
    );
  }

  if (transferCalls.length !== 1) {
    throw new Error(`${params.name}: deveria haver exatamente uma transferência`);
  }

  if (transferCalls[0]?.queueId !== params.expectedQueueId) {
    throw new Error(
      `${params.name}: queueId esperado ${params.expectedQueueId}, recebido ${String(transferCalls[0]?.queueId)}`,
    );
  }

  if (transferCalls[0]?.message !== params.expectedTransferMessage) {
    throw new Error(
      `${params.name}: mensagem esperada ${params.expectedTransferMessage}, recebida ${String(transferCalls[0]?.message)}`,
    );
  }

  console.log(`\n=== ${params.name} ===`);
  console.log({
    activeMenuId: actionLog.activeMenuId,
    buttonId: actionLog.buttonId,
    actionType: actionLog.actionType,
    messageKey: actionLog.messageKey,
    transferCalls,
  });
}

await runScenario({
  name: "FORA DO HORARIO",
  isOpen: false,
  stage: "awaiting_main_menu",
  buttonId: "option_support",
  expectedActiveMenuId: "after_hours",
  expectedMessageKey: "after_hours_support_confirmation",
  expectedTransferMessage: "CONFIRMACAO_AFTER_HOURS",
  expectedQueueId: "1",
});

await runScenario({
  name: "DENTRO DO HORARIO",
  isOpen: true,
  stage: "awaiting_main_menu",
  buttonId: "option_support",
  expectedActiveMenuId: "main",
  expectedMessageKey: "support_confirmation",
  expectedTransferMessage: "CONFIRMACAO_MAIN",
  expectedQueueId: "1",
});

await runScenario({
  name: "FINANCEIRO",
  isOpen: false,
  stage: "awaiting_finance_menu",
  buttonId: "finance_nf",
  expectedActiveMenuId: "finance",
  expectedMessageKey: "finance_confirmation",
  expectedTransferMessage: "CONFIRMACAO_FINANCEIRO",
  expectedQueueId: "3",
});

console.log("OK");

process.exit(0);
