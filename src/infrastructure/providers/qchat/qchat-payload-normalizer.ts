import type { IncomingMessageNormalizer } from "../../../domain/messaging/incoming-message-normalizer.js";
import type { MessageKind } from "../../../domain/messaging/message-kind.js";
import type { NormalizedIncomingMessage } from "../../../domain/messaging/normalized-incoming-message.js";
import type { NormalizedMedia } from "../../../domain/messaging/normalized-media.js";

export class QChatPayloadNormalizer implements IncomingMessageNormalizer {
  normalize(payload: any): NormalizedIncomingMessage {
    const body = payload?.body ?? payload;
    const msg = body?.msg;
    const ticket = body?.ticket;
    const message = msg?.message;

    const kind = this.detectKind(message);
    const media = this.extractMedia(message, kind);
    const text = this.extractText(msg, message, kind);
    const conversationId = String(ticket?.id ?? "");

    return {
      provider: "qchat",
      messageId: String(msg?.key?.id ?? ""),
      conversationId,

      ...(ticket?.id ? { ticketId: ticket.id } : {}),
      ...(ticket?.contactId ? { contactId: ticket.contactId } : {}),
      ...(ticket?.companyId ? { companyId: ticket.companyId } : {}),
      ...(ticket?.whatsappId ? { whatsappId: ticket.whatsappId } : {}),

      phone: String(ticket?.contact?.number ?? msg?.key?.remoteJid ?? ""),
      ...(ticket?.contact?.name ? { name: ticket.contact.name } : {}),

      kind,
      text,

      fromMe: Boolean(msg?.key?.fromMe ?? ticket?.fromMe),

      ...(message?.templateButtonReplyMessage?.selectedID
        ? { buttonId: message.templateButtonReplyMessage.selectedID }
        : {}),
      ...(message?.templateButtonReplyMessage?.selectedDisplayText
        ? { buttonText: message.templateButtonReplyMessage.selectedDisplayText }
        : {}),

      isButtonReply: kind === "button",

      ...(media ? { media } : {}),

      ...(ticket?.status ? { status: ticket.status } : {}),
      ...(ticket?.queueId !== undefined ? { queueId: ticket.queueId } : {}),
      ...(ticket?.userId !== undefined ? { userId: ticket.userId } : {}),

      ...(msg?.messageTimestamp
        ? { timestamp: new Date(Number(msg.messageTimestamp) * 1000) }
        : {}),

      raw: payload,
    };
  }

  private detectKind(message: any): MessageKind {
    if (message?.templateButtonReplyMessage) return "button";
    if (message?.imageMessage) return "image";
    if (message?.audioMessage) return "audio";
    if (message?.videoMessage) return "video";
    if (message?.documentMessage) return "document";
    if (message?.stickerMessage) return "sticker";
    if (message?.locationMessage) return "location";
    if (message?.contactMessage || message?.contactsArrayMessage) {
      return "contact";
    }
    if (message?.reactionMessage) return "reaction";
    if (message?.conversation || message?.extendedTextMessage?.text) {
      return "text";
    }

    return "unknown";
  }

  private extractText(msg: any, message: any, kind: MessageKind): string {
    if (kind === "button") {
      return message?.templateButtonReplyMessage?.selectedDisplayText || "";
    }

    if (kind === "image") {
      return message?.imageMessage?.caption || "";
    }

    if (kind === "video") {
      return message?.videoMessage?.caption || "";
    }

    if (kind === "document") {
      return message?.documentMessage?.caption || "";
    }

    if (kind === "text") {
      return (
        message?.conversation ||
        message?.extendedTextMessage?.text ||
        msg?.body ||
        ""
      );
    }

    return "";
  }

  private extractMedia(
    message: any,
    kind: MessageKind,
  ): NormalizedMedia | null {
    const mediaByKind: Record<string, any> = {
      image: message?.imageMessage,
      audio: message?.audioMessage,
      video: message?.videoMessage,
      document: message?.documentMessage,
    };

    const media = mediaByKind[kind];

    if (!media) return null;

    return {
      ...(media.mimetype ? { mimeType: media.mimetype } : {}),
      ...(media.fileName ? { fileName: media.fileName } : {}),
      ...(media.title ? { title: media.title } : {}),
      ...(media.URL ? { url: media.URL } : {}),
      ...(media.url ? { url: media.url } : {}),
      ...(media.caption ? { caption: media.caption } : {}),
      ...(media.fileLength ? { size: Number(media.fileLength) } : {}),
      ...(media.seconds ? { durationSeconds: Number(media.seconds) } : {}),
      ...(media.pageCount ? { pageCount: Number(media.pageCount) } : {}),
    };
  }
}
