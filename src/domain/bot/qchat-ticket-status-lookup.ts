export type QChatTicketStatusLookupResult = {
  ticketId: string;
  status: string;
  userId?: string | number | null;
  queueId?: string | number | null;
  contactId?: string;
  companyId?: string;
  whatsappId?: string;
};

export interface QChatTicketStatusLookup {
  findLatestByContact(params: {
    phone: string;
    companyId?: string | number;
    whatsappId?: string | number;
  }): Promise<QChatTicketStatusLookupResult | null>;
}
