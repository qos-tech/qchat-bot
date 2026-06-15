import type { BotConfig } from "../../domain/bot/bot-config.js";
import type { BotContext } from "./bot-context.js";

export class BotContextMapper {
  static fromConfig(config: BotConfig): BotContext {
    return {
      botId: config.id,
      botName: config.name,
      ...(config.companyId !== undefined ? { companyId: config.companyId } : {}),
      ...(config.whatsappId !== undefined
        ? { whatsappId: config.whatsappId }
        : {}),

      triageQueueId: config.queues.triageQueueId,

      menus: config.menus as BotContext["menus"],

      messages: config.messages as BotContext["messages"],

      ...(config.features ? { features: config.features } : {}),
    };
  }
}
