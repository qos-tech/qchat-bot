export type QueueConfig = {
  triageQueueId: string;
  supportQueueId: string;
  financeQueueId: string;
  otherQueueId: string;
};

export const queueConfig: QueueConfig = {
  triageQueueId: process.env.QCHAT_QUEUE_TRIAGE_ID ?? "",
  supportQueueId: process.env.QCHAT_QUEUE_SUPPORT_ID ?? "",
  financeQueueId: process.env.QCHAT_QUEUE_FINANCE_ID ?? "",
  otherQueueId: process.env.QCHAT_QUEUE_OTHER_ID ?? "",
};
