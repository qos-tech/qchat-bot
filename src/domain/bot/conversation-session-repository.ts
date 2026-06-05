import type { ConversationSession } from "./conversation-session.js";

export interface ConversationSessionRepository {
  findByTicketId(ticketId: string): Promise<ConversationSession | null>;

  save(session: ConversationSession): Promise<void>;

  deleteByTicketId(ticketId: string): Promise<void>;
}
