import type { ButtonMessage } from "./button-message.js";

export interface MessagingGateway {
  sendText(params: {
    correlationId?: string;
    phone: string;
    message: string;
    whatsappId?: string | number;
  }): Promise<void>;

  sendButtons(params: {
    correlationId?: string;
    phone: string;
    whatsappId?: string | number;
    payload: ButtonMessage;
  }): Promise<void>;
}
