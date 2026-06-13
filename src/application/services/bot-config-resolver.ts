import type { BotConfig } from "../../domain/bot/bot-config.js";

export interface BotConfigResolver {
  resolveByWebhookToken(webhookToken: string): Promise<BotConfig | null>;

  resolveByMessage(params: {
    companyId?: number;
    whatsappId?: number;
  }): Promise<BotConfig | null>;

  resolveByEvolutionInstance(instance: string): Promise<BotConfig | null>;
}
