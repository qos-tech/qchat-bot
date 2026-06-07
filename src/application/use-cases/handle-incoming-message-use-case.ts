import type { ConversationSessionRepository } from "../../domain/bot/conversation-session-repository.js";
import type { TicketRoutingGateway } from "../../domain/bot/ticket-routing-gateway.js";
import type { MessagingGateway } from "../../domain/messaging/messaging-gateway.js";
import type { NormalizedIncomingMessage } from "../../domain/messaging/normalized-incoming-message.js";
import type { QueueConfig } from "../config/queue-config.js";
import { financeMenu, mainMenu } from "../menus/index.js";
import type { BusinessHoursService } from "../services/business-hours-service.js";
import { defaultBusinessHoursConfig } from "../services/default-business-hours-config.js";

export class HandleIncomingMessageUseCase {
  constructor(
    private readonly sessions: ConversationSessionRepository,
    private readonly messaging: MessagingGateway,
    private readonly routing: TicketRoutingGateway,
    private readonly businessHours: BusinessHoursService,
    private readonly queues: QueueConfig,
  ) {}

  async execute(message: NormalizedIncomingMessage): Promise<void> {
    if (message.fromMe) return;

    if (message.userId !== null && message.userId !== undefined) return;

    if (String(message.queueId) !== this.queues.triageQueueId) return;

    const session = await this.sessions.findByTicketId(
      String(message.ticketId),
    );

    const businessHours = await this.businessHours.check(
      defaultBusinessHoursConfig,
    );

    if (!session && businessHours.isOpen) {
      await this.sessions.save({
        ticketId: String(message.ticketId),
        provider: message.provider,
        ...(message.companyId ? { companyId: String(message.companyId) } : {}),
        ...(message.whatsappId
          ? { whatsappId: String(message.whatsappId) }
          : {}),
        ...(message.contactId ? { contactId: String(message.contactId) } : {}),
        phone: message.phone,
        stage: "awaiting_main_menu",
      });

      await this.messaging.sendButtons({
        phone: message.phone,
        ...(message.whatsappId ? { whatsappId: message.whatsappId } : {}),
        payload: mainMenu,
      });

      return;
    }

    if (
      session?.stage === "awaiting_main_menu" &&
      !message.isButtonReply &&
      businessHours.isOpen
    ) {
      await this.messaging.sendButtons({
        phone: message.phone,
        ...(message.whatsappId ? { whatsappId: message.whatsappId } : {}),
        payload: mainMenu,
      });

      return;
    }

    if (message.buttonId === "option_finance" && businessHours.isOpen) {
      await this.sessions.save({
        ticketId: String(message.ticketId),
        provider: message.provider,
        ...(message.companyId ? { companyId: String(message.companyId) } : {}),
        ...(message.whatsappId
          ? { whatsappId: String(message.whatsappId) }
          : {}),
        ...(message.contactId ? { contactId: String(message.contactId) } : {}),
        phone: message.phone,
        stage: "awaiting_finance_menu",
        intent: "finance",
      });

      await this.messaging.sendButtons({
        phone: message.phone,
        ...(message.whatsappId ? { whatsappId: message.whatsappId } : {}),
        payload: financeMenu,
      });

      return;
    }

    if (
      session?.stage === "awaiting_finance_menu" &&
      !message.isButtonReply &&
      businessHours.isOpen
    ) {
      await this.messaging.sendButtons({
        phone: message.phone,
        ...(message.whatsappId ? { whatsappId: message.whatsappId } : {}),
        payload: financeMenu,
      });

      return;
    }

    console.log({
      session,
      businessHours,
    });
  }
}
