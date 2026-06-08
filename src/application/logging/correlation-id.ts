import type { NormalizedIncomingMessage } from "../../domain/messaging/normalized-incoming-message.js";

export function createCorrelationId(
  message: NormalizedIncomingMessage,
): string {
  return [
    message.provider,
    message.ticketId ?? "no-ticket",
    message.messageId ?? "no-message",
  ].join(":");
}
