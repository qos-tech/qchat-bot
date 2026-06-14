import type {
  QChatTicketStatusLookup,
  QChatTicketStatusLookupResult,
} from "../../domain/bot/qchat-ticket-status-lookup.js";
import { qchatDb } from "../database/qchat-db.js";

type TicketRow = {
  id: number;
  status: string;
  userId: number | null;
  queueId: number | null;
  contactId: number | null;
  companyId: number | null;
  whatsappId: number | null;
};

export class PostgresQChatTicketStatusLookup
  implements QChatTicketStatusLookup
{
  async findLatestByContact(params: {
    phone: string;
    companyId?: string | number;
    whatsappId?: string | number;
  }): Promise<QChatTicketStatusLookupResult | null> {
    const result = await qchatDb.query<TicketRow>(
      `
      SELECT
        t."id",
        t."status",
        t."userId",
        t."queueId",
        t."contactId",
        t."companyId",
        t."whatsappId"
      FROM "Tickets" t
      INNER JOIN "Contacts" c
        ON c."id" = t."contactId"
      WHERE c."number" = $1
        AND ($2::int IS NULL OR t."companyId" = $2::int)
        AND ($3::int IS NULL OR t."whatsappId" = $3::int)
      ORDER BY t."updatedAt" DESC, t."id" DESC
      LIMIT 1
      `,
      [
        params.phone,
        this.toNullableInt(params.companyId),
        this.toNullableInt(params.whatsappId),
      ],
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return {
      ticketId: String(row.id),
      status: row.status,
      ...(row.userId !== null ? { userId: String(row.userId) } : {}),
      ...(row.queueId !== null ? { queueId: String(row.queueId) } : {}),
      ...(row.contactId !== null ? { contactId: String(row.contactId) } : {}),
      ...(row.companyId !== null ? { companyId: String(row.companyId) } : {}),
      ...(row.whatsappId !== null
        ? { whatsappId: String(row.whatsappId) }
        : {}),
    };
  }

  private toNullableInt(value?: string | number): number | null {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    const parsed = Number(value);

    return Number.isInteger(parsed) ? parsed : null;
  }
}
