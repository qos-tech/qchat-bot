import { randomUUID } from "node:crypto";

export function generateWebhookToken(): string {
  return randomUUID();
}

export function maskWebhookToken(webhookToken: string): string {
  const [first, , , , last] = webhookToken.split("-");

  if (first && last) {
    return `${first}-****-****-****-${last}`;
  }

  if (webhookToken.length <= 8) {
    return "****";
  }

  return `${webhookToken.slice(0, 4)}****${webhookToken.slice(-4)}`;
}
