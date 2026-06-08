import type { ButtonMessage } from "../../domain/messaging/button-message.js";
import type { MessagingGateway } from "../../domain/messaging/messaging-gateway.js";
import { env } from "../../config/env.js";
import { ExternalApiError } from "../../domain/errors/external-api-error.js";

export class EvolutionMessagingGateway implements MessagingGateway {
  private readonly apiUrl = env.EVOLUTION_API_URL;
  private readonly apiKey = env.EVOLUTION_API_KEY;
  private readonly instance = env.EVOLUTION_INSTANCE;

  async sendText(params: {
    phone: string;
    message: string;
    whatsappId?: string | number;
  }): Promise<void> {
    await this.post(`message/sendText/${this.instance}`, {
      number: params.phone,
      text: params.message,
    });
  }

  async sendButtons(params: {
    phone: string;
    whatsappId?: string | number;
    payload: ButtonMessage;
  }): Promise<void> {
    await this.post(`message/sendButtons/${this.instance}`, {
      number: params.phone,
      title: params.payload.title,
      description: params.payload.description,
      buttons: params.payload.buttons,
    });
  }

  private async post(path: string, body: unknown): Promise<void> {
    this.validateConfig();

    const response = await fetch(`${this.apiUrl}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: this.apiKey,
      },
      body: JSON.stringify(body),
    });

    const responseBody = await response.text();

    if (!response.ok) {
      throw new ExternalApiError("Falha ao chamar Evolution API", {
        provider: "evolution",
        operation: path,
        status: response.status,
        statusText: response.statusText,
        responseBody,
      });
    }

    this.validateEvolutionResponse(
      responseBody,
      response.status,
      response.statusText,
      path,
    );
  }

  private validateEvolutionResponse(
    responseBody: string,
    status: number,
    statusText: string,
    operation: string,
  ): void {
    if (!responseBody) return;

    let data: unknown;

    try {
      data = JSON.parse(responseBody);
    } catch {
      return;
    }

    if (this.hasErrorResponse(data)) {
      throw new ExternalApiError("Evolution retornou erro na resposta", {
        provider: "evolution",
        operation,
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
        (response.message.toLowerCase().includes("unauthorized") ||
          response.message.toLowerCase().includes("invalid") ||
          response.message.toLowerCase().includes("apikey") ||
          response.message.toLowerCase().includes("token")))
    );
  }

  private validateConfig(): void {
    if (!this.apiUrl) {
      throw new Error("EVOLUTION_API_URL não definida");
    }

    if (!this.apiKey) {
      throw new Error("EVOLUTION_API_KEY não definida");
    }

    if (!this.instance) {
      throw new Error("EVOLUTION_INSTANCE não definida");
    }
  }
}
