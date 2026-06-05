import type { MessageKind } from "./message-kind.js";
import type { NormalizedMedia } from "./normalized-media.js";

export type Provider = "qchat" | "evolution" | "meta";

export type NormalizedIncomingMessage = {
  provider: Provider;

  messageId: string;

  ticketId?: number | string;
  contactId?: number | string;
  companyId?: number | string;
  whatsappId?: number | string;

  phone: string;
  name?: string;

  kind: MessageKind;
  text: string;

  fromMe: boolean;

  buttonId?: string;
  buttonText?: string;
  isButtonReply: boolean;

  media?: NormalizedMedia;

  status?: string;
  queueId?: number | string | null;
  userId?: number | string | null;

  timestamp?: Date;

  raw: unknown;
};
