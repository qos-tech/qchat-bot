export type BotSelector =
  | {
      kind: "id";
      value: string;
    }
  | {
      kind: "company-whatsapp";
      companyId: number;
      whatsappId: number;
    };

export function parseBotSelector(value: string): BotSelector {
  const parts = value.split(":");
  const companyId = Number(parts[0]);
  const whatsappId = Number(parts[1]);

  if (
    parts.length === 2 &&
    Number.isInteger(companyId) &&
    Number.isInteger(whatsappId) &&
    companyId > 0 &&
    whatsappId > 0
  ) {
    return {
      kind: "company-whatsapp",
      companyId,
      whatsappId,
    };
  }

  return {
    kind: "id",
    value,
  };
}

export function buildBotSelectorWhere(selector: BotSelector): {
  where: string;
  values: unknown[];
} {
  if (selector.kind === "company-whatsapp") {
    return {
      where: "company_id = $1 AND whatsapp_id = $2",
      values: [selector.companyId, selector.whatsappId],
    };
  }

  return {
    where: "id = $1",
    values: [selector.value],
  };
}
