export type TicketStatus = "pending" | "open";

export interface TicketTransferGateway {
  transfer(params: {
    correlationId?: string;
    number: string;
    queueId: string | number;
    message: string;
    status: TicketStatus;
  }): Promise<void>;
}
