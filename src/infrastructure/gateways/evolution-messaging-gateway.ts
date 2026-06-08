import type { ButtonMessage } from "../../domain/messaging/button-message.js";
import type { MessagingGateway } from "../../domain/messaging/messaging-gateway.js";
import { env } from "../../config/env.js";
import { ExternalApiError } from "../../domain/errors/external-api-error.js";
import { withRetry } from "../http/with-retry.js";

export class EvolutionMessagingGateway implements MessagingGateway {
  private readonly apiUrl = env.EVOLUTION_API_URL;
  private readonly apiKey = env.EVOLUTION_API_KEY;
  private readonly instance = env.EVOLUTION_INSTANCE;

  async sendText(params: {
    correlationId?: string;
    phone: string;
    message: string;
    whatsappId?: string | number;
  }): Promise<void> {
    console.info("[EVOLUTION] send_text", {
      correlationId: params.correlationId,
      phone: params.phone,
    });

    await this.post(
      `message/sendText/${this.instance}`,
      {
        number: params.phone,
        text: params.message,
      },
      params.correlationId,
    );
  }

  async sendButtons(params: {
    correlationId?: string;
    phone: string;
    whatsappId?: string | number;
    payload: ButtonMessage;
  }): Promise<void> {
    console.info("[EVOLUTION] send_buttons", {
      correlationId: params.correlationId,
      phone: params.phone,
      buttons: params.payload.buttons.length,
    });

    await this.post(
      `message/sendButtons/${this.instance}`,
      {
        number: params.phone,
        title: params.payload.title,
        description: params.payload.description,
        buttons: params.payload.buttons,
      },
      params.correlationId,
    );
  }

  private async post(
    path: string,
    body: unknown,
    correlationId?: string,
  ): Promise<void> {
    this.validateConfig();

    await withRetry(
      async () => {
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
            ...(correlationId ? { correlationId } : {}),
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
          correlationId,
        );
      },
      {
        attempts: env.EXTERNAL_API_RETRY_ATTEMPTS,
        baseDelayMs: env.EXTERNAL_API_RETRY_BASE_DELAY_MS,

        shouldRetry: (error) => {
          if (!(error instanceof ExternalApiError)) {
            return true;
          }

          return [408, 429, 500, 502, 503, 504].includes(
            error.context.status ?? 0,
          );
        },

        onRetry: ({ attempt, delayMs, error }) => {
          console.warn("[EVOLUTION] retry", {
            correlationId,
            attempt,
            delayMs,
            error:
              error instanceof ExternalApiError
                ? {
                    provider: error.context.provider,
                    operation: error.context.operation,
                    status: error.context.status,
                    statusText: error.context.statusText,
                  }
                : String(error),
          });
        },
      },
    );
  }

  private validateEvolutionResponse(
    responseBody: string,
    status: number,
    statusText: string,
    operation: string,
    correlationId?: string,
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
        ...(correlationId ? { correlationId } : {}),
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
