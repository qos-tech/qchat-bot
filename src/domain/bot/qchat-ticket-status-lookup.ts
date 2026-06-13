export type QChatTicketStatusLookupResult = {
  ticketId: string;
  status: string;
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
