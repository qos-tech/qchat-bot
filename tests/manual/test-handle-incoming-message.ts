import { CNPJ_INVALID_MESSAGE, CNPJ_PROMPT_MESSAGE } from "../../src/application/messages/index.js";
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
    support_confirmation: "Mensagem dinâmica de suporte",
    other_confirmation: "Mensagem dinâmica do banco/teste",
  },
};

function createBaseMocks() {
  const sessionStore = new Map<string, Record<string, unknown>>();
  const textCalls: Array<Record<string, unknown>> = [];
  const buttonCalls: Array<Record<string, unknown>> = [];
  const transferCalls: Array<Record<string, unknown>> = [];
  let isOpen = false;

  const sessions = {
    async findByTicketId(ticketId: string) {
      console.log("Buscou sessão:", ticketId);

      return (sessionStore.get(ticketId) as
        | Record<string, unknown>
        | null
        | undefined) ?? null;
    },

    async save(session: Record<string, unknown>) {
      sessionStore.set(session.ticketId as string, session);
      console.log("SESSÃO SALVA:");
      console.log(session);
    },

    async deleteByTicketId(ticketId: string) {
      sessionStore.delete(ticketId);
    },
  };

  const messaging = {
    async sendText(params: Record<string, unknown>) {
      textCalls.push(params);
      console.log("TEXTO ENVIADO:");
      console.log(params);
    },

    async sendButtons(params: Record<string, unknown>) {
      buttonCalls.push(params);
      console.log("MENU ENVIADO:");
      console.log(JSON.stringify(params, null, 2));
    },
  };

  const transfer = {
    async transfer(params: Record<string, unknown>) {
      transferCalls.push(params);
      console.log("TRANSFERIU:");
      console.log(params);
    },
  };

  const businessHours = {
    async check() {
      console.log("Verificou horário");

      return {
        isOpen,
        reason: isOpen ? ("business_hours" as const) : ("after_closing" as const),
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

  return {
    sessionStore,
    textCalls,
    buttonCalls,
    transferCalls,
    setOpen(value: boolean) {
      isOpen = value;
    },
    useCase,
  };
}

async function runDynamicCnpjFlow() {
  const { useCase, sessionStore, textCalls, buttonCalls, transferCalls, setOpen } =
    createBaseMocks();

  setOpen(false);
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
      text: "Outros Assuntos",
      buttonId: "option_others",
      buttonText: "Outros Assuntos",
      isButtonReply: true,
      fromMe: false,
      status: "pending",
      raw: {},
    },
    botContext,
  );

  const pendingSession = sessionStore.get("15551");
  if (!pendingSession || pendingSession.stage !== "awaiting_customer_identification") {
    throw new Error(
      "Fluxo dinâmico deveria pedir identificação do cliente antes de transferir",
    );
  }

  if (pendingSession.pendingAction !== "transfer") {
    throw new Error("Sessão pendente deveria guardar pendingAction=transfer");
  }

  if (textCalls.length !== 1 || textCalls[0]?.message !== CNPJ_PROMPT_MESSAGE) {
    throw new Error("Fluxo dinâmico deveria enviar a mensagem de CNPJ");
  }

  if (transferCalls.length !== 0) {
    throw new Error("Fluxo dinâmico não deveria transferir antes do CNPJ");
  }

  if (buttonCalls.length !== 0) {
    throw new Error("Fluxo dinâmico com transferência não deveria reenviar menu");
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
      text: "Banapneus",
      fromMe: false,
      isButtonReply: false,
      status: "pending",
      raw: {},
    },
    botContext,
  );

  const completedSession = sessionStore.get("15551");
  if (!completedSession || completedSession.stage !== "waiting_human") {
    throw new Error(
      "Identificação do cliente deveria finalizar em waiting_human",
    );
  }

  if (completedSession.customerIdentification !== "Banapneus") {
    throw new Error("Nome da empresa deveria ser salvo na sessão");
  }

  if (completedSession.identificationType !== "company_name") {
    throw new Error("Nome da empresa deveria ser identificado como company_name");
  }

  if (textCalls.length !== 1) {
    throw new Error("Identificação do cliente não deveria enviar mensagem extra");
  }

  if (transferCalls.length !== 1) {
    throw new Error("Identificação do cliente deveria disparar uma transferência");
  }

  const transferMessage = transferCalls[0]?.message as string | undefined;
  if (
    !transferMessage?.includes("Tipo: company_name") ||
    !transferMessage?.includes("Banapneus") ||
    !transferMessage?.includes("Mensagem dinâmica do banco/teste")
  ) {
    throw new Error(
      "Mensagem de transferência deveria incluir identificação e confirmação",
    );
  }
}

async function runLegacyTransferFlow() {
  const sessionStore = new Map<string, Record<string, unknown>>();
  const transferCalls: Array<Record<string, unknown>> = [];
  const textCalls: Array<Record<string, unknown>> = [];

  const useCase = new HandleIncomingMessageUseCase(
    {
      async findByTicketId(ticketId: string) {
        return (sessionStore.get(ticketId) as Record<string, unknown> | null | undefined) ?? null;
      },
      async save(session: Record<string, unknown>) {
        sessionStore.set(session.ticketId as string, session);
      },
      async deleteByTicketId(ticketId: string) {
        sessionStore.delete(ticketId);
      },
    },
    {
      async sendText(params: Record<string, unknown>) {
        textCalls.push(params);
      },
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
          isOpen: false,
          reason: "after_closing" as const,
        };
      },
    },
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

  sessionStore.set("15552", {
    ticketId: "15552",
    provider: "qchat",
    phone: "5541999999998",
    stage: "awaiting_main_menu",
  });

  await useCase.execute({
    provider: "qchat",
    messageId: "msg-legacy-1",
    conversationId: "15552",
    ticketId: "15552",
    phone: "5541999999998",
    kind: "button",
    text: "Suporte",
    buttonId: "option_support",
    buttonText: "Suporte",
    isButtonReply: true,
    fromMe: false,
    status: "pending",
    queueId: "legacy-triage",
    userId: null,
    raw: {},
  });

  if (transferCalls.length !== 1) {
    throw new Error("Fluxo legado deveria transferir imediatamente");
  }

  if (textCalls.length !== 0) {
    throw new Error("Fluxo legado não deveria pedir CNPJ");
  }
}

async function runEvolutionWithoutQueueId() {
  const { useCase, buttonCalls, setOpen } = createBaseMocks();

  setOpen(true);

  await useCase.execute(
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

  if (buttonCalls.length !== 1) {
    throw new Error("Mensagem Evolution sem queueId não deveria ser bloqueada");
  }
}

await runDynamicCnpjFlow();
await runLegacyTransferFlow();
await runEvolutionWithoutQueueId();

process.exit(0);
