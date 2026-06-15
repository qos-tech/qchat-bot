const DEFAULT_CUSTOMER_IDENTIFICATION_PROMPT_MESSAGE =
  "Para adiantar seu atendimento, informe o nome da sua empresa ou o CNPJ.";

const DEFAULT_CUSTOMER_IDENTIFICATION_INVALID_MESSAGE =
  "Não consegui identificar a informação enviada.\n\nPor favor, informe o nome da empresa ou o CNPJ.";

const DEFAULT_CUSTOMER_IDENTIFICATION_TRANSFER_TEMPLATE =
  "Identificação do cliente: {{value}}";

function resolveConfiguredMessage(
  messages: Record<string, unknown> | undefined,
  key: string,
  fallback: string,
): string {
  const value = messages?.[key];

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return fallback;
}

export function resolveCustomerIdentificationPromptMessage(
  messages: Record<string, unknown> | undefined,
): string {
  return resolveConfiguredMessage(
    messages,
    "customer_identification_prompt",
    DEFAULT_CUSTOMER_IDENTIFICATION_PROMPT_MESSAGE,
  );
}

export function resolveCustomerIdentificationInvalidMessage(
  messages: Record<string, unknown> | undefined,
): string {
  return resolveConfiguredMessage(
    messages,
    "customer_identification_invalid",
    DEFAULT_CUSTOMER_IDENTIFICATION_INVALID_MESSAGE,
  );
}

export function resolveCustomerIdentificationTransferTemplate(
  messages: Record<string, unknown> | undefined,
): string {
  return resolveConfiguredMessage(
    messages,
    "customer_identification_transfer_template",
    DEFAULT_CUSTOMER_IDENTIFICATION_TRANSFER_TEMPLATE,
  );
}

export function formatCustomerIdentificationTransferMessage(
  messages: Record<string, unknown> | undefined,
  value: string,
): string {
  return resolveCustomerIdentificationTransferTemplate(messages).replaceAll(
    "{{value}}",
    value,
  );
}

export function getDefaultCustomerIdentificationPromptMessage(): string {
  return DEFAULT_CUSTOMER_IDENTIFICATION_PROMPT_MESSAGE;
}

export function getDefaultCustomerIdentificationInvalidMessage(): string {
  return DEFAULT_CUSTOMER_IDENTIFICATION_INVALID_MESSAGE;
}

export function getDefaultCustomerIdentificationTransferTemplate(): string {
  return DEFAULT_CUSTOMER_IDENTIFICATION_TRANSFER_TEMPLATE;
}
