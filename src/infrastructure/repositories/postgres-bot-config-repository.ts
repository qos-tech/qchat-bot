import type { BotConfigRepository } from "../../domain/bot/bot-config-repository.js";
import type { BotConfig } from "../../domain/bot/bot-config.js";
import { db } from "../database/db.js";

type BotConfigRow = {
  id: string;
  name: string;
  webhook_token: string;
  company_id: number | null;
  whatsapp_id: number | null;
  active: boolean;
  qchat_api_url: string;
  qchat_api_token: string;
  evolution_api_url: string;
  evolution_api_key: string;
  evolution_instance: string;
  queues_config: Record<string, unknown>;
  business_hours_config: Record<string, unknown>;
  messages_config: Record<string, unknown>;
  menus_config: Record<string, unknown>;
};

export class PostgresBotConfigRepository implements BotConfigRepository {
  async findByWebhookToken(webhookToken: string): Promise<BotConfig | null> {
    const result = await db.query<BotConfigRow>(
      `
      SELECT *
      FROM bot_configs
      WHERE webhook_token = $1
        AND active = true
      LIMIT 1
      `,
      [webhookToken],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findByCompanyAndWhatsapp(
    companyId: number,
    whatsappId: number,
  ): Promise<BotConfig | null> {
    const result = await db.query<BotConfigRow>(
      `
      SELECT *
      FROM bot_configs
      WHERE company_id = $1
        AND whatsapp_id = $2
        AND active = true
      LIMIT 1
      `,
      [companyId, whatsappId],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  private toDomain(row: BotConfigRow): BotConfig {
    return {
      id: row.id,
      name: row.name,
      webhookToken: row.webhook_token,

      ...(row.company_id !== null ? { companyId: row.company_id } : {}),
      ...(row.whatsapp_id !== null ? { whatsappId: row.whatsapp_id } : {}),

      active: row.active,

      qchat: {
        apiUrl: row.qchat_api_url,
        apiToken: row.qchat_api_token,
      },

      evolution: {
        apiUrl: row.evolution_api_url,
        apiKey: row.evolution_api_key,
        instance: row.evolution_instance,
      },

      queues: {
        triageQueueId: String(row.queues_config.triageQueueId ?? ""),
        supportQueueId: String(row.queues_config.supportQueueId ?? ""),
        financeQueueId: String(row.queues_config.financeQueueId ?? ""),
        otherQueueId: String(row.queues_config.otherQueueId ?? ""),
      },

      businessHours: row.business_hours_config,
      messages: row.messages_config,
      menus: row.menus_config,
    };
  }
}
