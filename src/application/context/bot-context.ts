export type BotContext = {
  botId: string;
  botName: string;

  queues: {
    triageQueueId: string;
    supportQueueId: string;
    financeQueueId: string;
    otherQueueId: string;
  };
};
