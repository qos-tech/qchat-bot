export type TicketStatus = "pending" | "open";

export interface TicketTransferGateway {
  transfer(params: {
    number: string;
    queueId: string | number;
    message: string;
    status: TicketStatus;
  }): Promise<void>;
}
