import type { Provider } from "../messaging/normalized-incoming-message.js";
import type { Intent } from "./Intent.js";
import type { Stage } from "./Stage.js";

export type ConversationSession = {
  ticketId: string;

  provider: Provider;

  companyId?: string;
  whatsappId?: string;
  contactId?: string;

  phone: string;

  stage: Stage;
  intent?: Intent;

  createdAt?: Date;
  updatedAt?: Date;
};
