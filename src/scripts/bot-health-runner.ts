import { BotConfigValidator } from "../application/config/bot-config-validator.js";
import { DefaultBotConfigResolver } from "../application/services/default-bot-config-resolver.js";
import { PostgresBotConfigRepository } from "../infrastructure/repositories/postgres-bot-config-repository.js";
import { parseBotSelector } from "./bot-selector.js";

type HealthLine = {
  level: "OK" | "ERROR";
  message: string;
};

export type BotHealthResult = {
  status: "HEALTHY" | "UNHEALTHY";
  lines: HealthLine[];
};

export async function checkBotHealth(
  selectorInput: string,
): Promise<BotHealthResult> {
  try {
    const selector = parseBotSelector(selectorInput);
    const resolver = new DefaultBotConfigResolver(
      new PostgresBotConfigRepository(),
    );

    const config =
      selector.kind === "company-whatsapp"
        ? await resolver.resolveByMessage({
            companyId: selector.companyId,
            whatsappId: selector.whatsappId,
          })
        : await resolver.resolveByWebhookToken(selector.value);

    if (!config) {
      return {
        status: "UNHEALTHY",
        lines: [
          {
            level: "ERROR",
            message: "BotConfig não encontrado ou inativo",
          },
        ],
      };
    }

    BotConfigValidator.validate(config);

    return {
      status: "HEALTHY",
      lines: [
        { level: "OK", message: "BotConfig válido" },
        { level: "OK", message: "Evolution configurada" },
        { level: "OK", message: "QChat configurado" },
        { level: "OK", message: "Menus válidos" },
        { level: "OK", message: "Mensagens válidas" },
      ],
    };
  } catch (error) {
    return {
      status: "UNHEALTHY",
      lines: [
        {
          level: "ERROR",
          message: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }
}
