import type { ConversationSessionRepository } from "../../domain/bot/conversation-session-repository.js";
import type { TicketTransferGateway } from "../../domain/bot/ticket-transfer-gateway.js";
import type { MessagingGateway } from "../../domain/messaging/messaging-gateway.js";
import type { NormalizedIncomingMessage } from "../../domain/messaging/normalized-incoming-message.js";
import type { QueueConfig } from "../config/queue-config.js";
import { afterHoursMenu, financeMenu, mainMenu } from "../menus/index.js";
import type { BusinessHoursService } from "../services/business-hours-service.js";
import { defaultBusinessHoursConfig } from "../services/default-business-hours-config.js";
import {
  FINANCE_CONFIRMATION_MESSAGE,
  OTHER_CONFIRMATION_MESSAGE,
  SUPPORT_CONFIRMATION_MESSAGE,
  AFTER_HOURS_OTHER_CONFIRMATION_MESSAGE,
  AFTER_HOURS_SUPPORT_CONFIRMATION_MESSAGE,
} from "../messages/index.js";

export class HandleIncomingMessageUseCase {
  constructor(
    private readonly sessions: ConversationSessionRepository,
    private readonly messaging: MessagingGateway,
    private readonly transfer: TicketTransferGateway,
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

    if (!session && !businessHours.isOpen) {
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
        payload: afterHoursMenu,
      });

      return;
    }

    if (
      session?.stage === "awaiting_main_menu" &&
      !message.isButtonReply &&
      !businessHours.isOpen
    ) {
      await this.messaging.sendButtons({
        phone: message.phone,
        ...(message.whatsappId ? { whatsappId: message.whatsappId } : {}),
        payload: afterHoursMenu,
      });

      return;
    }

    // clique do menu fora de horario
    if (message.buttonId === "option_support" && !businessHours.isOpen) {
      await this.sessions.save({
        ticketId: String(message.ticketId),
        provider: message.provider,
        ...(message.companyId ? { companyId: String(message.companyId) } : {}),
        ...(message.whatsappId
          ? { whatsappId: String(message.whatsappId) }
          : {}),
        ...(message.contactId ? { contactId: String(message.contactId) } : {}),
        phone: message.phone,
        stage: "waiting_human",
        intent: "support",
      });

      await this.transfer.transfer({
        number: message.phone,
        queueId: this.queues.supportQueueId,
        status: "pending",
        message: AFTER_HOURS_SUPPORT_CONFIRMATION_MESSAGE,
      });

      return;
    }

    if (message.buttonId === "option_others" && !businessHours.isOpen) {
      await this.sessions.save({
        ticketId: String(message.ticketId),
        provider: message.provider,
        ...(message.companyId ? { companyId: String(message.companyId) } : {}),
        ...(message.whatsappId
          ? { whatsappId: String(message.whatsappId) }
          : {}),
        ...(message.contactId ? { contactId: String(message.contactId) } : {}),
        phone: message.phone,
        stage: "waiting_human",
        intent: "other",
      });

      await this.transfer.transfer({
        number: message.phone,
        queueId: this.queues.otherQueueId,
        status: "pending",
        message: AFTER_HOURS_OTHER_CONFIRMATION_MESSAGE,
      });

      return;
    }

    if (message.buttonId === "option_support" && businessHours.isOpen) {
      await this.sessions.save({
        ticketId: String(message.ticketId),
        provider: message.provider,
        ...(message.companyId ? { companyId: String(message.companyId) } : {}),
        ...(message.whatsappId
          ? { whatsappId: String(message.whatsappId) }
          : {}),
        ...(message.contactId ? { contactId: String(message.contactId) } : {}),
        phone: message.phone,
        stage: "waiting_human",
        intent: "support",
      });

      await this.transfer.transfer({
        number: message.phone,
        queueId: this.queues.supportQueueId,
        status: "pending",
        message: SUPPORT_CONFIRMATION_MESSAGE,
      });

      return;
    }

    if (message.buttonId === "option_others" && businessHours.isOpen) {
      await this.sessions.save({
        ticketId: String(message.ticketId),
        provider: message.provider,
        ...(message.companyId ? { companyId: String(message.companyId) } : {}),
        ...(message.whatsappId
          ? { whatsappId: String(message.whatsappId) }
          : {}),
        ...(message.contactId ? { contactId: String(message.contactId) } : {}),
        phone: message.phone,
        stage: "waiting_human",
        intent: "other",
      });

      await this.transfer.transfer({
        number: message.phone,
        queueId: this.queues.otherQueueId,
        status: "pending",
        message: OTHER_CONFIRMATION_MESSAGE,
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

    if (
      ["finance_nf", "finance_invoice", "finance_others"].includes(
        message.buttonId ?? "",
      ) &&
      businessHours.isOpen
    ) {
      const intentMap = {
        finance_nf: "finance_nf",
        finance_invoice: "finance_invoice",
        finance_others: "finance_other",
      } as const;

      await this.sessions.save({
        ticketId: String(message.ticketId),
        provider: message.provider,
        ...(message.companyId ? { companyId: String(message.companyId) } : {}),
        ...(message.whatsappId
          ? { whatsappId: String(message.whatsappId) }
          : {}),
        ...(message.contactId ? { contactId: String(message.contactId) } : {}),
        phone: message.phone,
        stage: "waiting_human",
        intent: intentMap[message.buttonId as keyof typeof intentMap],
      });

      await this.transfer.transfer({
        number: message.phone,
        queueId: this.queues.financeQueueId,
        status: "pending",
        message: FINANCE_CONFIRMATION_MESSAGE,
      });

      return;
    }

    console.log({
      session,
      businessHours,
    });
  }
}
