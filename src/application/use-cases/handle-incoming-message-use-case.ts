import type { ConversationSessionRepository } from "../../domain/bot/conversation-session-repository.js";
import type { TicketTransferGateway } from "../../domain/bot/ticket-transfer-gateway.js";
import type { MessagingGateway } from "../../domain/messaging/messaging-gateway.js";
import type { NormalizedIncomingMessage } from "../../domain/messaging/normalized-incoming-message.js";
import type { QueueConfig } from "../config/queue-config.js";
import { afterHoursMenu, financeMenu, mainMenu } from "../menus/index.js";
import {
  AFTER_HOURS_OTHER_CONFIRMATION_MESSAGE,
  AFTER_HOURS_SUPPORT_CONFIRMATION_MESSAGE,
  FINANCE_CONFIRMATION_MESSAGE,
  OTHER_CONFIRMATION_MESSAGE,
  SUPPORT_CONFIRMATION_MESSAGE,
} from "../messages/index.js";
import type { BusinessHoursService } from "../services/business-hours-service.js";
import { defaultBusinessHoursConfig } from "../services/default-business-hours-config.js";

export class HandleIncomingMessageUseCase {
  constructor(
    private readonly sessions: ConversationSessionRepository,
    private readonly messaging: MessagingGateway,
    private readonly transfer: TicketTransferGateway,
    private readonly businessHours: BusinessHoursService,
    private readonly queues: QueueConfig,
  ) {}

  async execute(message: NormalizedIncomingMessage): Promise<void> {
    console.info("[BOT] message_received", {
      ticketId: message.ticketId,
      phone: message.phone,
      kind: message.kind,
      queueId: message.queueId,
      userId: message.userId,
      fromMe: message.fromMe,
      buttonId: message.buttonId,
    });

    if (message.fromMe) {
      console.info("[BOT] message_ignored", {
        reason: "from_me",
        ticketId: message.ticketId,
      });

      return;
    }

    if (message.status === "closed") {
      await this.sessions.deleteByTicketId(String(message.ticketId));

      console.info("[BOT] session_deleted", {
        reason: "ticket_closed",
        ticketId: message.ticketId,
      });

      return;
    }

    if (message.userId !== null && message.userId !== undefined) {
      console.info("[BOT] message_ignored", {
        reason: "already_assigned",
        ticketId: message.ticketId,
        userId: message.userId,
      });

      return;
    }

    if (String(message.queueId) !== this.queues.triageQueueId) {
      console.info("[BOT] message_ignored", {
        reason: "not_triage_queue",
        ticketId: message.ticketId,
        queueId: message.queueId,
        triageQueueId: this.queues.triageQueueId,
      });

      return;
    }

    const session = await this.sessions.findByTicketId(
      String(message.ticketId),
    );

    console.info("[BOT] session_checked", {
      ticketId: message.ticketId,
      exists: Boolean(session),
      stage: session?.stage,
      intent: session?.intent,
    });

    if (session?.stage === "waiting_human") {
      console.info("[BOT] message_ignored", {
        reason: "waiting_human",
        ticketId: message.ticketId,
        intent: session.intent,
      });

      return;
    }

    const businessHours = await this.businessHours.check(
      defaultBusinessHoursConfig,
    );

    console.info("[BOT] business_hours_checked", {
      ticketId: message.ticketId,
      isOpen: businessHours.isOpen,
      reason: businessHours.reason,
    });

    if (!session && businessHours.isOpen) {
      await this.messaging.sendButtons({
        phone: message.phone,
        ...(message.whatsappId ? { whatsappId: message.whatsappId } : {}),
        payload: mainMenu,
      });

      console.info("[BOT] menu_sent", {
        ticketId: message.ticketId,
        menu: "main",
      });

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

      console.info("[BOT] session_saved", {
        ticketId: message.ticketId,
        stage: "awaiting_main_menu",
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

      console.info("[BOT] menu_sent", {
        ticketId: message.ticketId,
        menu: "main",
        reason: "loop",
      });

      return;
    }

    if (!session && !businessHours.isOpen) {
      await this.messaging.sendButtons({
        phone: message.phone,
        ...(message.whatsappId ? { whatsappId: message.whatsappId } : {}),
        payload: afterHoursMenu,
      });

      console.info("[BOT] menu_sent", {
        ticketId: message.ticketId,
        menu: "after_hours",
      });

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

      console.info("[BOT] session_saved", {
        ticketId: message.ticketId,
        stage: "awaiting_main_menu",
        mode: "after_hours",
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

      console.info("[BOT] menu_sent", {
        ticketId: message.ticketId,
        menu: "after_hours",
        reason: "loop",
      });

      return;
    }

    if (message.buttonId === "option_support" && !businessHours.isOpen) {
      await this.transfer.transfer({
        number: message.phone,
        queueId: this.queues.supportQueueId,
        status: "pending",
        message: AFTER_HOURS_SUPPORT_CONFIRMATION_MESSAGE,
      });

      console.info("[BOT] ticket_transferred", {
        ticketId: message.ticketId,
        queueId: this.queues.supportQueueId,
        intent: "support",
        mode: "after_hours",
      });

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

      console.info("[BOT] session_saved", {
        ticketId: message.ticketId,
        stage: "waiting_human",
        intent: "support",
        mode: "after_hours",
      });

      return;
    }

    if (message.buttonId === "option_others" && !businessHours.isOpen) {
      await this.transfer.transfer({
        number: message.phone,
        queueId: this.queues.otherQueueId,
        status: "pending",
        message: AFTER_HOURS_OTHER_CONFIRMATION_MESSAGE,
      });

      console.info("[BOT] ticket_transferred", {
        ticketId: message.ticketId,
        queueId: this.queues.otherQueueId,
        intent: "other",
        mode: "after_hours",
      });

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

      console.info("[BOT] session_saved", {
        ticketId: message.ticketId,
        stage: "waiting_human",
        intent: "other",
        mode: "after_hours",
      });

      return;
    }

    if (message.buttonId === "option_support" && businessHours.isOpen) {
      await this.transfer.transfer({
        number: message.phone,
        queueId: this.queues.supportQueueId,
        status: "pending",
        message: SUPPORT_CONFIRMATION_MESSAGE,
      });

      console.info("[BOT] ticket_transferred", {
        ticketId: message.ticketId,
        queueId: this.queues.supportQueueId,
        intent: "support",
      });

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

      console.info("[BOT] session_saved", {
        ticketId: message.ticketId,
        stage: "waiting_human",
        intent: "support",
      });

      return;
    }

    if (message.buttonId === "option_others" && businessHours.isOpen) {
      await this.transfer.transfer({
        number: message.phone,
        queueId: this.queues.otherQueueId,
        status: "pending",
        message: OTHER_CONFIRMATION_MESSAGE,
      });

      console.info("[BOT] ticket_transferred", {
        ticketId: message.ticketId,
        queueId: this.queues.otherQueueId,
        intent: "other",
      });

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

      console.info("[BOT] session_saved", {
        ticketId: message.ticketId,
        stage: "waiting_human",
        intent: "other",
      });

      return;
    }

    if (message.buttonId === "option_finance" && businessHours.isOpen) {
      await this.messaging.sendButtons({
        phone: message.phone,
        ...(message.whatsappId ? { whatsappId: message.whatsappId } : {}),
        payload: financeMenu,
      });

      console.info("[BOT] menu_sent", {
        ticketId: message.ticketId,
        menu: "finance",
      });

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

      console.info("[BOT] session_saved", {
        ticketId: message.ticketId,
        stage: "awaiting_finance_menu",
        intent: "finance",
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

      console.info("[BOT] menu_sent", {
        ticketId: message.ticketId,
        menu: "finance",
        reason: "loop",
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

      const intent = intentMap[message.buttonId as keyof typeof intentMap];

      await this.transfer.transfer({
        number: message.phone,
        queueId: this.queues.financeQueueId,
        status: "pending",
        message: FINANCE_CONFIRMATION_MESSAGE,
      });

      console.info("[BOT] ticket_transferred", {
        ticketId: message.ticketId,
        queueId: this.queues.financeQueueId,
        intent,
      });

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
        intent,
      });

      console.info("[BOT] session_saved", {
        ticketId: message.ticketId,
        stage: "waiting_human",
        intent,
      });

      return;
    }

    console.info("[BOT] message_unhandled", {
      ticketId: message.ticketId,
      stage: session?.stage,
      buttonId: message.buttonId,
      isOpen: businessHours.isOpen,
      reason: businessHours.reason,
    });
  }
}
