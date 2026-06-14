import type { ConversationSessionRepository } from "../../domain/bot/conversation-session-repository.js";
import type { Intent } from "../../domain/bot/intent.js";
import type { QChatTicketStatusLookup } from "../../domain/bot/qchat-ticket-status-lookup.js";
import type { TicketTransferGateway } from "../../domain/bot/ticket-transfer-gateway.js";
import type { ButtonMessage } from "../../domain/messaging/button-message.js";
import type { MessagingGateway } from "../../domain/messaging/messaging-gateway.js";
import type { NormalizedIncomingMessage } from "../../domain/messaging/normalized-incoming-message.js";
import type { QueueConfig } from "../config/queue-config.js";
import type { BotContext } from "../context/bot-context.js";
import { MenuResolver } from "../context/menu-resolver.js";
import { MenuToButtonMessage } from "../context/menu-to-button-message.js";
import { createCorrelationId } from "../logging/correlation-id.js";
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
    private readonly qchatTicketStatusLookup: QChatTicketStatusLookup,
  ) {}

  async execute(
    message: NormalizedIncomingMessage,
    context?: BotContext,
  ): Promise<void> {
    const correlationId = createCorrelationId(message);
    const conversationId = message.conversationId;

    console.info("[BOT] message_received", {
      correlationId,
      conversationId,
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
        correlationId,
        reason: "from_me",
        conversationId,
        ticketId: message.ticketId,
      });

      return;
    }

    if (message.status === "closed") {
      await this.sessions.deleteByTicketId(conversationId);

      console.info("[BOT] session_deleted", {
        correlationId,
        reason: "ticket_closed",
        conversationId,
        ticketId: message.ticketId,
      });

      return;
    }

    if (message.userId !== null && message.userId !== undefined) {
      console.info("[BOT] message_ignored", {
        correlationId,
        reason: "already_assigned",
        conversationId,
        ticketId: message.ticketId,
        userId: message.userId,
      });

      return;
    }

    const triageQueueId = context?.triageQueueId ?? this.queues.triageQueueId;

    if (
      message.provider === "qchat" &&
      String(message.queueId) !== triageQueueId
    ) {
      console.info("[BOT] message_ignored", {
        correlationId,
        reason: "not_triage_queue",
        conversationId,
        ticketId: message.ticketId,
        queueId: message.queueId,
        triageQueueId,
      });

      return;
    }

    let session = await this.sessions.findByTicketId(conversationId);

    console.info("[BOT] session_checked", {
      correlationId,
      conversationId,
      ticketId: message.ticketId,
      exists: Boolean(session),
      stage: session?.stage,
      intent: session?.intent,
    });

    if (session?.stage === "waiting_human") {
      if (message.provider === "evolution") {
        const latestTicket = await this.lookupLatestQChatTicket(
          message,
          context,
          correlationId,
        );

        if (!latestTicket) {
          console.info("[BOT] message_ignored", {
            correlationId,
            reason: "human_ticket_not_found",
            conversationId,
            ticketId: message.ticketId,
          });

          return;
        }

        const normalizedStatus = latestTicket.status.toLowerCase();
        const normalizedQueueId =
          latestTicket.queueId !== undefined && latestTicket.queueId !== null
            ? String(latestTicket.queueId)
            : null;
        const normalizedUserId =
          latestTicket.userId !== undefined && latestTicket.userId !== null
            ? String(latestTicket.userId)
            : null;
        const triageQueueId = context?.triageQueueId ?? this.queues.triageQueueId;

        if (normalizedStatus === "open") {
          console.info("[BOT] message_ignored", {
            correlationId,
            reason: "human_ticket_still_open",
            conversationId,
            ticketId: message.ticketId,
            qchatTicketId: latestTicket.ticketId,
            qchatTicketStatus: latestTicket.status,
            qchatTicketUserId: normalizedUserId,
            qchatTicketQueueId: normalizedQueueId,
          });

          return;
        }

        if (normalizedStatus === "pending") {
          if (normalizedUserId) {
            console.info("[BOT] message_ignored", {
              correlationId,
              reason: "human_ticket_still_open",
              conversationId,
              ticketId: message.ticketId,
              qchatTicketId: latestTicket.ticketId,
              qchatTicketStatus: latestTicket.status,
              qchatTicketUserId: normalizedUserId,
              qchatTicketQueueId: normalizedQueueId,
            });

            return;
          }

          if (normalizedQueueId === triageQueueId) {
            await this.sessions.deleteByTicketId(conversationId);

            console.info("[BOT] session_deleted", {
              correlationId,
              reason: "human_ticket_pending_in_triage",
              conversationId,
              ticketId: message.ticketId,
              qchatTicketId: latestTicket.ticketId,
              qchatTicketStatus: latestTicket.status,
              qchatTicketUserId: normalizedUserId,
              qchatTicketQueueId: normalizedQueueId,
              triageQueueId,
            });

            session = null;
          } else {
            console.info("[BOT] message_ignored", {
              correlationId,
              reason: "human_ticket_pending_outside_triage",
              conversationId,
              ticketId: message.ticketId,
              qchatTicketId: latestTicket.ticketId,
              qchatTicketStatus: latestTicket.status,
              qchatTicketUserId: normalizedUserId,
              qchatTicketQueueId: normalizedQueueId,
              triageQueueId,
            });

            return;
          }
        } else if (normalizedStatus === "closed") {
          await this.sessions.deleteByTicketId(conversationId);

          console.info("[BOT] session_deleted", {
            correlationId,
            reason: "human_ticket_closed",
            conversationId,
            ticketId: message.ticketId,
            qchatTicketId: latestTicket.ticketId,
            qchatTicketStatus: latestTicket.status,
            qchatTicketUserId: normalizedUserId,
            qchatTicketQueueId: normalizedQueueId,
          });

          session = null;
        } else {
          console.info("[BOT] message_ignored", {
            correlationId,
            reason: "human_ticket_still_open",
            conversationId,
            ticketId: message.ticketId,
            qchatTicketId: latestTicket.ticketId,
            qchatTicketStatus: latestTicket.status,
            qchatTicketUserId: normalizedUserId,
            qchatTicketQueueId: normalizedQueueId,
          });

          return;
        }
      } else {
        await this.sessions.deleteByTicketId(conversationId);

        console.info("[BOT] session_deleted", {
          correlationId,
          reason: "stale_waiting_human_session",
          conversationId,
          ticketId: message.ticketId,
          queueId: message.queueId,
          userId: message.userId,
        });

        session = null;
      }
    }

    const businessHours = await this.businessHours.check(
      defaultBusinessHoursConfig,
    );

    console.info("[BOT] business_hours_checked", {
      correlationId,
      conversationId,
      ticketId: message.ticketId,
      isOpen: businessHours.isOpen,
      reason: businessHours.reason,
    });

    if (!session && businessHours.isOpen) {
      await this.messaging.sendButtons({
        correlationId,
        phone: message.phone,
        ...(message.whatsappId ? { whatsappId: message.whatsappId } : {}),
        payload: this.resolveMainMenu(context),
      });

      console.info("[BOT] menu_sent", {
        correlationId,
        conversationId,
        ticketId: message.ticketId,
        menu: "main",
      });

      await this.sessions.save({
        ticketId: conversationId,
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
        correlationId,
        conversationId,
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
        correlationId,
        phone: message.phone,
        ...(message.whatsappId ? { whatsappId: message.whatsappId } : {}),
        payload: this.resolveMainMenu(context),
      });

      console.info("[BOT] menu_sent", {
        correlationId,
        conversationId,
        ticketId: message.ticketId,
        menu: "main",
        reason: "loop",
      });

      return;
    }

    if (!session && !businessHours.isOpen) {
      await this.messaging.sendButtons({
        correlationId,
        phone: message.phone,
        ...(message.whatsappId ? { whatsappId: message.whatsappId } : {}),
        payload: this.resolveAfterHoursMenu(context),
      });

      console.info("[BOT] menu_sent", {
        correlationId,
        conversationId,
        ticketId: message.ticketId,
        menu: "after_hours",
      });

      await this.sessions.save({
        ticketId: conversationId,
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
        correlationId,
        conversationId,
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
        correlationId,
        phone: message.phone,
        ...(message.whatsappId ? { whatsappId: message.whatsappId } : {}),
        payload: this.resolveAfterHoursMenu(context),
      });

      console.info("[BOT] menu_sent", {
        correlationId,
        conversationId,
        ticketId: message.ticketId,
        menu: "after_hours",
        reason: "loop",
      });

      return;
    }

    if (context) {
      if (message.isButtonReply) {
        await this.executeContextButtonAction(
          context,
          message,
          conversationId,
          correlationId,
          session?.stage,
          businessHours.isOpen,
          businessHours.reason,
        );

        return;
      }

      console.info("[BOT] message_unhandled", {
        correlationId,
        ticketId: message.ticketId,
        stage: session?.stage,
        buttonId: message.buttonId,
        isOpen: businessHours.isOpen,
        reason: businessHours.reason,
      });

      return;
    }

    if (message.buttonId === "option_support" && !businessHours.isOpen) {
      await this.transfer.transfer({
        correlationId,
        number: message.phone,
        queueId: this.queues.supportQueueId,
        status: "pending",
        message: AFTER_HOURS_SUPPORT_CONFIRMATION_MESSAGE,
      });

      console.info("[BOT] ticket_transferred", {
        correlationId,
        ticketId: message.ticketId,
        queueId: this.queues.supportQueueId,
        intent: "support",
        mode: "after_hours",
      });

      await this.sessions.save({
        ticketId: conversationId,
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
        correlationId,
        ticketId: message.ticketId,
        stage: "waiting_human",
        intent: "support",
        mode: "after_hours",
      });

      return;
    }

    if (message.buttonId === "option_others" && !businessHours.isOpen) {
      await this.transfer.transfer({
        correlationId,
        number: message.phone,
        queueId: this.queues.otherQueueId,
        status: "pending",
        message: AFTER_HOURS_OTHER_CONFIRMATION_MESSAGE,
      });

      console.info("[BOT] ticket_transferred", {
        correlationId,
        ticketId: message.ticketId,
        queueId: this.queues.otherQueueId,
        intent: "other",
        mode: "after_hours",
      });

      await this.sessions.save({
        ticketId: conversationId,
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
        correlationId,
        ticketId: message.ticketId,
        stage: "waiting_human",
        intent: "other",
        mode: "after_hours",
      });

      return;
    }

    if (message.buttonId === "option_support" && businessHours.isOpen) {
      await this.transfer.transfer({
        correlationId,
        number: message.phone,
        queueId: this.queues.supportQueueId,
        status: "pending",
        message: SUPPORT_CONFIRMATION_MESSAGE,
      });

      console.info("[BOT] ticket_transferred", {
        correlationId,
        ticketId: message.ticketId,
        queueId: this.queues.supportQueueId,
        intent: "support",
      });

      await this.sessions.save({
        ticketId: conversationId,
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
        correlationId,
        ticketId: message.ticketId,
        stage: "waiting_human",
        intent: "support",
      });

      return;
    }

    if (message.buttonId === "option_others" && businessHours.isOpen) {
      await this.transfer.transfer({
        correlationId,
        number: message.phone,
        queueId: this.queues.otherQueueId,
        status: "pending",
        message: OTHER_CONFIRMATION_MESSAGE,
      });

      console.info("[BOT] ticket_transferred", {
        correlationId,
        ticketId: message.ticketId,
        queueId: this.queues.otherQueueId,
        intent: "other",
      });

      await this.sessions.save({
        ticketId: conversationId,
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
        correlationId,
        ticketId: message.ticketId,
        stage: "waiting_human",
        intent: "other",
      });

      return;
    }

    if (message.buttonId === "option_finance" && businessHours.isOpen) {
      await this.messaging.sendButtons({
        correlationId,
        phone: message.phone,
        ...(message.whatsappId ? { whatsappId: message.whatsappId } : {}),
        payload: this.resolveFinanceMenu(context),
      });

      console.info("[BOT] menu_sent", {
        correlationId,
        ticketId: message.ticketId,
        menu: "finance",
      });

      await this.sessions.save({
        ticketId: conversationId,
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
        correlationId,
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
        correlationId,
        phone: message.phone,
        ...(message.whatsappId ? { whatsappId: message.whatsappId } : {}),
        payload: this.resolveFinanceMenu(context),
      });

      console.info("[BOT] menu_sent", {
        correlationId,
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
        correlationId,
        number: message.phone,
        queueId: this.queues.financeQueueId,
        status: "pending",
        message: FINANCE_CONFIRMATION_MESSAGE,
      });

      console.info("[BOT] ticket_transferred", {
        correlationId,
        ticketId: message.ticketId,
        queueId: this.queues.financeQueueId,
        intent,
      });

      await this.sessions.save({
        ticketId: conversationId,
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
        correlationId,
        ticketId: message.ticketId,
        stage: "waiting_human",
        intent,
      });

      return;
    }

    console.info("[BOT] message_unhandled", {
      correlationId,
      ticketId: message.ticketId,
      stage: session?.stage,
      buttonId: message.buttonId,
      isOpen: businessHours.isOpen,
      reason: businessHours.reason,
    });
  }

  private resolveMainMenu(context?: BotContext): ButtonMessage {
    if (!context) {
      return mainMenu;
    }

    const menu = MenuResolver.getMenu(context, "main");

    if (!menu) {
      throw new Error('Menu "main" não encontrado no BotContext');
    }

    return MenuToButtonMessage.convert(menu);
  }

  private resolveAfterHoursMenu(context?: BotContext): ButtonMessage {
    if (!context) {
      return afterHoursMenu;
    }

    const menu = MenuResolver.getMenu(context, "after_hours");

    if (!menu) {
      throw new Error('Menu "after_hours" não encontrado no BotContext');
    }

    return MenuToButtonMessage.convert(menu);
  }

  private resolveFinanceMenu(context?: BotContext): ButtonMessage {
    if (!context) {
      return financeMenu;
    }

    const menu = MenuResolver.getMenu(context, "finance");

    if (!menu) {
      throw new Error('Menu "finance" não encontrado no BotContext');
    }

    return MenuToButtonMessage.convert(menu);
  }

  private async executeContextButtonAction(
    context: BotContext,
    message: NormalizedIncomingMessage,
    conversationId: string,
    correlationId: string,
    stage: string | undefined,
    isOpen: boolean,
    reason: string,
  ): Promise<void> {
    const button = MenuResolver.findButton(context, message.buttonId ?? "");

    if (!button) {
      console.info("[BOT] message_unhandled", {
        correlationId,
        ticketId: message.ticketId,
        stage,
        buttonId: message.buttonId,
        isOpen,
        reason,
      });

      return;
    }

    if (button.action.type === "transfer") {
      const confirmationMessage = MenuResolver.getMessage(
        context,
        button.action.messageKey,
      );

      if (!confirmationMessage) {
        throw new Error(
          `Mensagem "${button.action.messageKey}" não encontrada no BotContext`,
        );
      }

      await this.transfer.transfer({
        correlationId,
        number: message.phone,
        queueId: button.action.queueId,
        status: "pending",
        message: confirmationMessage,
      });

      console.info("[BOT] ticket_transferred", {
        correlationId,
        ticketId: message.ticketId,
        queueId: button.action.queueId,
        intent: button.action.intent,
      });

      await this.sessions.save({
        ticketId: conversationId,
        provider: message.provider,
        ...(message.companyId ? { companyId: String(message.companyId) } : {}),
        ...(message.whatsappId
          ? { whatsappId: String(message.whatsappId) }
          : {}),
        ...(message.contactId ? { contactId: String(message.contactId) } : {}),
        phone: message.phone,
        stage: "waiting_human",
        intent: button.action.intent as Intent,
      });

      console.info("[BOT] session_saved", {
        correlationId,
        ticketId: message.ticketId,
        stage: "waiting_human",
        intent: button.action.intent,
      });

      return;
    }

    const menu = MenuResolver.getMenu(context, button.action.menuId);

    if (!menu) {
      throw new Error(
        `Menu "${button.action.menuId}" não encontrado no BotContext`,
      );
    }

    await this.messaging.sendButtons({
      correlationId,
      phone: message.phone,
      ...(message.whatsappId ? { whatsappId: message.whatsappId } : {}),
      payload: MenuToButtonMessage.convert(menu),
    });

    console.info("[BOT] menu_sent", {
      correlationId,
      ticketId: message.ticketId,
      menu: button.action.menuId,
    });

    if (button.action.menuId === "finance") {
      await this.sessions.save({
        ticketId: conversationId,
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
        correlationId,
        ticketId: message.ticketId,
        stage: "awaiting_finance_menu",
        intent: "finance",
      });
    }

    return;
  }

  private async lookupLatestQChatTicket(
    message: NormalizedIncomingMessage,
    context: BotContext | undefined,
    correlationId: string,
  ) {
    const companyId = message.companyId ?? context?.companyId;
    const whatsappId = message.whatsappId ?? context?.whatsappId;

    try {
      const params = {
        phone: message.phone,
        ...(companyId !== undefined ? { companyId } : {}),
        ...(whatsappId !== undefined ? { whatsappId } : {}),
      };

      const latestTicket =
        await this.qchatTicketStatusLookup.findLatestByContact(params);

      console.info("[BOT] qchat_ticket_status_checked", {
        correlationId,
        phone: message.phone,
        companyId,
        whatsappId,
        found: Boolean(latestTicket),
        qchatTicketId: latestTicket?.ticketId,
        qchatTicketStatus: latestTicket?.status,
      });

      return latestTicket;
    } catch (error) {
      console.warn("[BOT] qchat_ticket_status_lookup_failed", {
        correlationId,
        phone: message.phone,
        companyId,
        whatsappId,
        error: error instanceof Error ? error.message : String(error),
      });

      return null;
    }
  }
}
