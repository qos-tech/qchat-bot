import type { ConversationSessionRepository } from "../../domain/bot/conversation-session-repository.js";
import type { ConversationSession } from "../../domain/bot/conversation-session.js";
import { db } from "../database/db.js";

export class PostgresConversationSessionRepository implements ConversationSessionRepository {
  async findByTicketId(ticketId: string): Promise<ConversationSession | null> {
    const result = await db.query(
      `
      SELECT
        provider,
        company_id,
        whatsapp_id,
        ticket_id,
        contact_id,
        phone,
        stage,
        intent,
        created_at,
        updated_at
      FROM bot_sessions
      WHERE ticket_id = $1
      LIMIT 1
      `,
      [ticketId],
    );

    const row = result.rows[0];

    if (!row) return null;

    return {
      provider: row.provider,
      ticketId: row.ticket_id,
      phone: row.phone,
      stage: row.stage,

      ...(row.company_id ? { companyId: row.company_id } : {}),
      ...(row.whatsapp_id ? { whatsappId: row.whatsapp_id } : {}),
      ...(row.contact_id ? { contactId: row.contact_id } : {}),
      ...(row.intent ? { intent: row.intent } : {}),

      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async save(session: ConversationSession): Promise<void> {
    await db.query(
      `
      INSERT INTO bot_sessions (
        provider,
        company_id,
        whatsapp_id,
        ticket_id,
        contact_id,
        phone,
        stage,
        intent,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
      ON CONFLICT (ticket_id)
      DO UPDATE SET
        provider = EXCLUDED.provider,
        company_id = EXCLUDED.company_id,
        whatsapp_id = EXCLUDED.whatsapp_id,
        contact_id = EXCLUDED.contact_id,
        phone = EXCLUDED.phone,
        stage = EXCLUDED.stage,
        intent = EXCLUDED.intent,
        updated_at = now()
      `,
      [
        session.provider,
        session.companyId ?? null,
        session.whatsappId ?? null,
        session.ticketId,
        session.contactId ?? null,
        session.phone,
        session.stage,
        session.intent ?? null,
      ],
    );
  }

  async deleteByTicketId(ticketId: string): Promise<void> {
    await db.query(
      `
      DELETE FROM bot_sessions
      WHERE ticket_id = $1
      `,
      [ticketId],
    );
  }
}
