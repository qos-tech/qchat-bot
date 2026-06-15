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

function validateCustomerIdentificationMessages(
  messages: Record<string, unknown>,
): void {
  requiredMessage(
    messages.customer_identification_prompt,
    "Bot.messages.customer_identification_prompt obrigatório",
  );
  requiredMessage(
    messages.customer_identification_invalid,
    "Bot.messages.customer_identification_invalid obrigatório",
  );
  requiredMessage(
    messages.customer_identification_transfer_template,
    "Bot.messages.customer_identification_transfer_template obrigatório",
  );
}

function requiredMessage(value: unknown, errorMessage: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(errorMessage);
  }
}

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

    const healthLines: HealthLine[] = [
      { level: "OK", message: "BotConfig válido" },
      { level: "OK", message: "Evolution configurada" },
      { level: "OK", message: "QChat configurado" },
      { level: "OK", message: "Menus válidos" },
      { level: "OK", message: "Mensagens válidas" },
    ];

    if (config.features?.customerIdentification?.enabled) {
      validateCustomerIdentificationMessages(config.messages);
      healthLines.push(
        {
          level: "OK",
          message: "customer_identification_prompt válido",
        },
        {
          level: "OK",
          message: "customer_identification_invalid válido",
        },
        {
          level: "OK",
          message: "customer_identification_transfer_template válido",
        },
      );
    }

    return {
      status: "HEALTHY",
      lines: healthLines,
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
