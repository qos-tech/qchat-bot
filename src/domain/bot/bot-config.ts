export type BotConfig = {
  id: string;

  name: string;

  webhookToken: string;

  companyId?: number;
  whatsappId?: number;

  active: boolean;

  qchat: {
    apiUrl: string;
    apiToken: string;
  };

  evolution: {
    apiUrl: string;
    apiKey: string;
    instance: string;
  };

  queues: {
    triageQueueId: string;
    supportQueueId: string;
    financeQueueId: string;
    otherQueueId: string;
  };

  businessHours: Record<string, unknown>;

  messages: Record<string, unknown>;

  menus: Record<string, unknown>;
};
