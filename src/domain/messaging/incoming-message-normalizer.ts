import type { NormalizedIncomingMessage } from "./normalized-incoming-message.js";

export interface IncomingMessageNormalizer {
  normalize(payload: unknown): NormalizedIncomingMessage;
}
