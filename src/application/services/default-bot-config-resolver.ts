import type { BotConfigRepository } from "../../domain/bot/bot-config-repository.js";
import type { BotConfig } from "../../domain/bot/bot-config.js";
import type { BotConfigResolver } from "./bot-config-resolver.js";

export class DefaultBotConfigResolver implements BotConfigResolver {
  constructor(private readonly repository: BotConfigRepository) {}

  async resolveByWebhookToken(webhookToken: string): Promise<BotConfig | null> {
    return this.repository.findByWebhookToken(webhookToken);
  }

  async resolveByMessage(params: {
    companyId?: number;
    whatsappId?: number;
  }): Promise<BotConfig | null> {
    if (params.companyId === undefined || params.whatsappId === undefined) {
      return null;
    }

    return this.repository.findByCompanyAndWhatsapp(
      params.companyId,
      params.whatsappId,
    );
  }
}
