import type { Provider } from "../messaging/normalized-incoming-message.js";
import type { Intent } from "./intent.js";
import type { Stage } from "./stage.js";

export type ConversationSession = {
  ticketId: string;

  provider: Provider;

  companyId?: string;
  whatsappId?: string;
  contactId?: string;

  phone: string;

  stage: Stage;
  intent?: Intent;
  pendingAction?: string;
  pendingQueueId?: string;
  pendingIntent?: Intent | string;
  pendingMessageKey?: string;
  customerIdentification?: string;
  identificationType?: "company_name" | "cnpj";
  cnpj?: string;

  createdAt?: Date;
  updatedAt?: Date;
};
