import type { BotConfig } from "../../src/domain/bot/bot-config.js";
import { BotConfigValidator } from "../../src/application/config/bot-config-validator.js";

type TestCase = {
  name: string;
  configure: (config: BotConfig) => void;
  errorMessage: string;
};

const validConfig: BotConfig = {
  id: "bot-1",
  name: "Bot Teste",
  webhookToken: "3f9e0a7d-7a67-4f65-bd61-9b7d18df5a2c",
  companyId: 1,
  whatsappId: 127,
  active: true,
  evolution: {
    apiUrl: "https://api.evolution.example.com",
    apiKey: "evolution-api-key",
    instance: "instance-1",
  },
  qchat: {
    apiUrl: "https://api.qchat.example.com",
    apiToken: "qchat-api-token",
  },
  queues: {
    triageQueueId: "46",
    supportQueueId: "1",
    financeQueueId: "3",
    otherQueueId: "2",
  },
  businessHours: {},
  messages: {
    support_confirmation: "Transferindo para suporte.",
    finance_confirmation: "Transferindo para financeiro.",
  },
  menus: {
    main: {
      id: "main",
      title: "Menu Principal",
      description: "Escolha uma opção",
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
    finance: {
      id: "finance",
      title: "Menu Financeiro",
      description: "Escolha uma opção",
      buttons: [
        {
          id: "finance_invoice",
          label: "Boleto",
          action: {
            type: "transfer",
            queueId: "3",
            intent: "finance_invoice",
            messageKey: "finance_confirmation",
          },
        },
      ],
    },
  },
};

function cloneConfig(): BotConfig {
  return structuredClone(validConfig);
}

function expectValid(): void {
  BotConfigValidator.validate(cloneConfig());
  console.log("OK: config válida");
}

function expectInvalid(testCase: TestCase): void {
  const config = cloneConfig();
  testCase.configure(config);

  try {
    BotConfigValidator.validate(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message !== testCase.errorMessage) {
      throw new Error(
        `${testCase.name}: erro esperado "${testCase.errorMessage}", recebido "${message}"`,
      );
    }

    console.log(`OK: ${testCase.name}`);
    return;
  }

  throw new Error(`${testCase.name}: validação deveria falhar`);
}

expectValid();

const invalidCases: TestCase[] = [
  {
    name: "menu inexistente",
    configure: (config) => {
      (config.menus.main as any).buttons[1].action.menuId = "missing_menu";
    },
    errorMessage: 'Menu "missing_menu" não encontrado',
  },
  {
    name: "mensagem inexistente",
    configure: (config) => {
      (config.menus.main as any).buttons[0].action.messageKey =
        "missing_message";
    },
    errorMessage: 'Message "missing_message" não encontrada',
  },
  {
    name: "evolution inválida",
    configure: (config) => {
      config.evolution.instance = "";
    },
    errorMessage: "Evolution.instance obrigatório",
  },
  {
    name: "qchat inválido",
    configure: (config) => {
      config.qchat.apiToken = "";
    },
    errorMessage: "QChat.apiToken obrigatório",
  },
];

for (const testCase of invalidCases) {
  expectInvalid(testCase);
}

process.exit(0);
