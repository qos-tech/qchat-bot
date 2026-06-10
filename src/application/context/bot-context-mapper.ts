import type { BotConfig } from "../../domain/bot/bot-config.js";
import type { BotContext } from "./bot-context.js";

export class BotContextMapper {
  static fromConfig(config: BotConfig): BotContext {
    return {
      botId: config.id,
      botName: config.name,

      queues: {
        triageQueueId: config.queues.triageQueueId,
        supportQueueId: config.queues.supportQueueId,
        financeQueueId: config.queues.financeQueueId,
        otherQueueId: config.queues.otherQueueId,
      },
    };
  }
}
