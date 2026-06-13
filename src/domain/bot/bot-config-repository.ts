import type { BotConfig } from "./bot-config.js";

export interface BotConfigRepository {
  findByWebhookToken(webhookToken: string): Promise<BotConfig | null>;

  findByCompanyAndWhatsapp(
    companyId: number,
    whatsappId: number,
  ): Promise<BotConfig | null>;

  findByEvolutionInstance(instance: string): Promise<BotConfig | null>;
}
