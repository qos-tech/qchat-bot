import type { BotConfigRepository } from "../../domain/bot/bot-config-repository.js";
import type { BotConfig } from "../../domain/bot/bot-config.js";
import { BotConfigValidator } from "../config/bot-config-validator.js";
import type { BotConfigResolver } from "./bot-config-resolver.js";

export class DefaultBotConfigResolver implements BotConfigResolver {
  constructor(private readonly repository: BotConfigRepository) {}

  async resolveByWebhookToken(webhookToken: string): Promise<BotConfig | null> {
    return this.validateResolved(
      await this.repository.findByWebhookToken(webhookToken),
    );
  }

  async resolveByMessage(params: {
    companyId?: number;
    whatsappId?: number;
  }): Promise<BotConfig | null> {
    if (params.companyId === undefined || params.whatsappId === undefined) {
      return null;
    }

    return this.validateResolved(
      await this.repository.findByCompanyAndWhatsapp(
        params.companyId,
        params.whatsappId,
      ),
    );
  }

  async resolveByEvolutionInstance(instance: string): Promise<BotConfig | null> {
    return this.validateResolved(
      await this.repository.findByEvolutionInstance(instance),
    );
  }

  private validateResolved(config: BotConfig | null): BotConfig | null {
    if (!config) {
      return null;
    }

    BotConfigValidator.validate(config);

    return config;
  }
}
