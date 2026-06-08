import type {
  TicketStatus,
  TicketTransferGateway,
} from "../../domain/bot/ticket-transfer-gateway.js";
import { env } from "../../config/env.js";
import { ExternalApiError } from "../../domain/errors/external-api-error.js";

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

    const responseBody = await response.text();

    if (!response.ok) {
      throw new ExternalApiError("Falha ao chamar QChat API", {
        provider: "qchat",
        operation: "transfer_ticket",
        status: response.status,
        statusText: response.statusText,
        responseBody,
      });
    }

    this.validateQChatResponse(
      responseBody,
      response.status,
      response.statusText,
    );
  }

  private validateQChatResponse(
    responseBody: string,
    status: number,
    statusText: string,
  ): void {
    if (!responseBody) return;

    let data: unknown;

    try {
      data = JSON.parse(responseBody);
    } catch {
      return;
    }

    if (this.hasErrorResponse(data)) {
      throw new ExternalApiError("QChat retornou erro na resposta", {
        provider: "qchat",
        operation: "transfer_ticket",
        status,
        statusText,
        responseBody,
      });
    }
  }

  private hasErrorResponse(data: unknown): boolean {
    if (!data || typeof data !== "object") return false;

    const response = data as Record<string, unknown>;

    return (
      response.error === true ||
      response.status === "error" ||
      response.success === false ||
      typeof response.error === "string" ||
      (typeof response.message === "string" &&
        response.message.toLowerCase().includes("token"))
    );
  }

  private validateConfig(): void {
    if (!this.apiUrl) throw new Error("QCHAT_API_URL não definida");
    if (!this.token) throw new Error("QCHAT_API_TOKEN não definido");
  }
}
