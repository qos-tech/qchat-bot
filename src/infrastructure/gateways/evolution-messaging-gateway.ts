import type { ButtonMessage } from "../../domain/messaging/button-message.js";
import type { MessagingGateway } from "../../domain/messaging/messaging-gateway.js";

export class EvolutionMessagingGateway implements MessagingGateway {
  private readonly apiUrl = process.env.EVOLUTION_API_URL ?? "";
  private readonly apiKey = process.env.EVOLUTION_API_KEY ?? "";
  private readonly instance = process.env.EVOLUTION_INSTANCE ?? "";

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

    if (!response.ok) {
      const errorBody = await response.text();

      throw new Error(
        `Evolution API error: ${response.status} ${response.statusText} - ${errorBody}`,
      );
    }
  }

  private validateConfig(): void {
    if (!this.apiUrl) throw new Error("EVOLUTION_API_URL não definida");
    if (!this.apiKey) throw new Error("EVOLUTION_API_KEY não definida");
    if (!this.instance) throw new Error("EVOLUTION_INSTANCE não definida");
  }
}
