import type {
  TicketStatus,
  TicketTransferGateway,
} from "../../domain/bot/ticket-transfer-gateway.js";
import { env } from "../../config/env.js";

export class QChatTicketTransferGateway implements TicketTransferGateway {
  private readonly apiUrl = env.QCHAT_API_URL;
  private readonly token = env.QCHAT_API_TOKEN;

  async transfer(params: {
    number: string;
    queueId: string | number;
    message: string;
    status: TicketStatus;
  }): Promise<void> {
    this.validateConfig();

    const response = await fetch(`${this.apiUrl}/api/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        number: params.number,
        body: params.message,
        queueId: params.queueId,
        status: params.status,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();

      throw new Error(
        `QChat API error: ${response.status} ${response.statusText} - ${errorBody}`,
      );
    }
  }

  private validateConfig(): void {
    if (!this.apiUrl) throw new Error("QCHAT_API_URL não definida");
    if (!this.token) throw new Error("QCHAT_API_TOKEN não definido");
  }
}
