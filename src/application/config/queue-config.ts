import { env } from "../../config/env.js";

export type QueueConfig = {
  triageQueueId: string;
  supportQueueId: string;
  financeQueueId: string;
  otherQueueId: string;
};

export const queueConfig: QueueConfig = {
  triageQueueId: env.QCHAT_QUEUE_TRIAGE_ID,
  supportQueueId: env.QCHAT_QUEUE_SUPPORT_ID,
  financeQueueId: env.QCHAT_QUEUE_FINANCE_ID,
  otherQueueId: env.QCHAT_QUEUE_OTHER_ID,
};
