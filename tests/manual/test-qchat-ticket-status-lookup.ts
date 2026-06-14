import { HandleIncomingMessageUseCase } from "../../src/application/use-cases/handle-incoming-message-use-case.js";
import type { BotContext } from "../../src/application/context/bot-context.js";
import type { NormalizedIncomingMessage } from "../../src/domain/messaging/normalized-incoming-message.js";

type SessionState = {
  ticketId: string;
  provider: "evolution";
  phone: string;
  stage: "waiting_human" | "awaiting_main_menu";
  intent?: string;
};

type LookupResult = {
  ticketId: string;
  status: string;
  userId?: string | number | null;
  queueId?: string | number | null;
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

const input: NormalizedIncomingMessage = {
  provider: "evolution",
  messageId: "msg-1",
  conversationId: "4120182200:554197035511",
  ticketId: "4120182200:554197035511",
  companyId: 1,
  whatsappId: 127,
  phone: "554197035511",
  kind: "text",
  text: "Nova mensagem do cliente",
  fromMe: false,
  isButtonReply: false,
  raw: {},
};

const businessHours = {
  async check() {
    return {
      isOpen: true,
      reason: "open" as const,
    };
  },
};

function createScenarioRunner() {
  const sessions = new Map<string, SessionState>();
  const sendButtonsCalls: Array<{ title: string }> = [];
  const transferCalls: Array<{ queueId: string | number }> = [];
  let lookupCallCount = 0;
  let currentLookupResult: LookupResult | null = null;

  const useCase = new HandleIncomingMessageUseCase(
    {
      async findByTicketId(ticketId: string) {
        return sessions.get(ticketId) ?? null;
      },
      async save(session: SessionState) {
        sessions.set(session.ticketId, session);
      },
      async deleteByTicketId(ticketId: string) {
        sessions.delete(ticketId);
      },
    },
    {
      async sendText() {},
      async sendButtons(params) {
        sendButtonsCalls.push({ title: params.payload.title });
      },
    },
    {
      async transfer(params) {
        transferCalls.push({ queueId: params.queueId });
      },
    },
    businessHours,
    {
      triageQueueId: "legacy-triage",
      supportQueueId: "1",
      financeQueueId: "3",
      otherQueueId: "2",
    },
    {
      async findLatestByContact() {
        lookupCallCount += 1;
        return currentLookupResult;
      },
    },
  );

  return {
    sessions,
    sendButtonsCalls,
    transferCalls,
    setLookupResult(result: LookupResult | null) {
      currentLookupResult = result;
    },
    async execute(initialSession: SessionState | null) {
      sessions.clear();
      sendButtonsCalls.length = 0;
      transferCalls.length = 0;
      lookupCallCount = 0;

      if (initialSession) {
        sessions.set(initialSession.ticketId, initialSession);
      }

      await useCase.execute(input, botContext);

      return {
        session: sessions.get(input.conversationId) ?? null,
        lookupCallCount,
        sendButtonsCount: sendButtonsCalls.length,
        transferCount: transferCalls.length,
        sendButtonsCalls: [...sendButtonsCalls],
        transferCalls: [...transferCalls],
      };
    },
  };
}

async function runScenario(params: {
  name: string;
  initialSession: SessionState | null;
  lookupResult: LookupResult | null;
  expectedSessionStage: SessionState["stage"] | null;
  expectedMenuCount: number;
  expectedTransferCount: number;
}) {
  const runner = createScenarioRunner();
  runner.setLookupResult(params.lookupResult);

  const result = await runner.execute(params.initialSession);

  if (result.lookupCallCount !== 1) {
    throw new Error(`${params.name}: lookup deveria ser executado uma vez`);
  }

  if (result.sendButtonsCount !== params.expectedMenuCount) {
    throw new Error(
      `${params.name}: menu esperado ${params.expectedMenuCount}, recebido ${result.sendButtonsCount}`,
    );
  }

  if (result.transferCount !== params.expectedTransferCount) {
    throw new Error(
      `${params.name}: transfer esperado ${params.expectedTransferCount}, recebido ${result.transferCount}`,
    );
  }

  if (params.expectedSessionStage === null) {
    if (result.session !== null) {
      throw new Error(`${params.name}: sessão deveria ser removida`);
    }
  } else if (result.session?.stage !== params.expectedSessionStage) {
    throw new Error(
      `${params.name}: estágio esperado ${params.expectedSessionStage}, recebido ${result.session?.stage}`,
    );
  }

  console.log(`\n=== ${params.name} ===`);
  console.log({
    lookupResult: params.lookupResult,
    session: result.session,
    sendButtonsCalls: result.sendButtonsCalls,
    transferCalls: result.transferCalls,
  });
}

await runScenario({
  name: "SCENARIO 1 - status open",
  initialSession: {
    ticketId: input.conversationId,
    provider: "evolution",
    phone: input.phone,
    stage: "waiting_human",
  },
  lookupResult: {
    ticketId: "987",
    status: "open",
    userId: null,
    queueId: null,
  },
  expectedSessionStage: "waiting_human",
  expectedMenuCount: 0,
  expectedTransferCount: 0,
});

await runScenario({
  name: "SCENARIO 2 - status pending com userId",
  initialSession: {
    ticketId: input.conversationId,
    provider: "evolution",
    phone: input.phone,
    stage: "waiting_human",
  },
  lookupResult: {
    ticketId: "987",
    status: "pending",
    userId: 99,
    queueId: "46",
  },
  expectedSessionStage: "waiting_human",
  expectedMenuCount: 0,
  expectedTransferCount: 0,
});

await runScenario({
  name: "SCENARIO 3 - status pending na triagem",
  initialSession: {
    ticketId: input.conversationId,
    provider: "evolution",
    phone: input.phone,
    stage: "waiting_human",
  },
  lookupResult: {
    ticketId: "987",
    status: "pending",
    userId: null,
    queueId: "46",
  },
  expectedSessionStage: "awaiting_main_menu",
  expectedMenuCount: 1,
  expectedTransferCount: 0,
});

await runScenario({
  name: "SCENARIO 4 - status pending fora da triagem",
  initialSession: {
    ticketId: input.conversationId,
    provider: "evolution",
    phone: input.phone,
    stage: "waiting_human",
  },
  lookupResult: {
    ticketId: "987",
    status: "pending",
    userId: null,
    queueId: "99",
  },
  expectedSessionStage: "waiting_human",
  expectedMenuCount: 0,
  expectedTransferCount: 0,
});

await runScenario({
  name: "SCENARIO 5 - status closed",
  initialSession: {
    ticketId: input.conversationId,
    provider: "evolution",
    phone: input.phone,
    stage: "waiting_human",
  },
  lookupResult: {
    ticketId: "987",
    status: "closed",
    userId: null,
    queueId: "99",
  },
  expectedSessionStage: "awaiting_main_menu",
  expectedMenuCount: 1,
  expectedTransferCount: 0,
});

await runScenario({
  name: "SCENARIO 6 - ticket not found",
  initialSession: {
    ticketId: input.conversationId,
    provider: "evolution",
    phone: input.phone,
    stage: "waiting_human",
  },
  lookupResult: null,
  expectedSessionStage: "waiting_human",
  expectedMenuCount: 0,
  expectedTransferCount: 0,
});

console.log("OK");

process.exit(0);
