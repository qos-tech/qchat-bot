import { queueConfig } from "../application/config/queue-config.js";
import { HandleIncomingMessageUseCase } from "../application/use-cases/handle-incoming-message-use-case.js";
import { EvolutionMessagingGateway } from "../infrastructure/gateways/evolution-messaging-gateway.js";
import { QChatTicketTransferGateway } from "../infrastructure/gateways/qchat-ticket-transfer-gateway.js";
import { PostgresConversationSessionRepository } from "../infrastructure/repositories/postgres-conversation-session-repository.js";
import { PostgresQChatTicketStatusLookup } from "../infrastructure/repositories/postgres-qchat-ticket-status-lookup.js";
import { DefaultBusinessHoursService } from "../infrastructure/services/default-business-hours-service.js";

export function createHandleIncomingMessageUseCase(): HandleIncomingMessageUseCase {
  const sessions = new PostgresConversationSessionRepository();

  const messaging = new EvolutionMessagingGateway();

  const transfer = new QChatTicketTransferGateway();
  const qchatTicketStatusLookup = new PostgresQChatTicketStatusLookup();

  const businessHours = new DefaultBusinessHoursService();

  return new HandleIncomingMessageUseCase(
    sessions,
    messaging,
    transfer,
    businessHours,
    queueConfig,
    qchatTicketStatusLookup,
  );
}
