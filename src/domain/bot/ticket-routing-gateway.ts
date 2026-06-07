export interface TicketRoutingGateway {
  moveToQueue(params: {
    ticketId: string;
    queueId: string | number;
  }): Promise<void>;
}
