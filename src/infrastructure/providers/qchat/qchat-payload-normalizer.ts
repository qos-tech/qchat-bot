import type { IncomingMessageNormalizer } from "../../../domain/messaging/incoming-message-normalizer.js";
import type { MessageKind } from "../../../domain/messaging/message-kind.js";
import type { NormalizedIncomingMessage } from "../../../domain/messaging/normalized-incoming-message.js";
import type { NormalizedMedia } from "../../../domain/messaging/normalized-media.js";

export class QChatPayloadNormalizer implements IncomingMessageNormalizer {
  normalize(payload: any): NormalizedIncomingMessage {
    const body = payload.body;

    const msg = body?.msg;
    const ticket = body?.ticket;
    const message = msg?.message;

    const buttonReply = message?.templateButtonReplyMessage;

    const kind = this.detectKind(message);

    const media = this.extractMedia(message, kind);

    const text = this.extractText(msg, message, kind);

    return {
      provider: "qchat",

      messageId: msg?.key?.id,

      ...(ticket?.id ? { ticketId: ticket.id } : {}),
      ...(ticket?.contactId ? { contactId: ticket.contactId } : {}),
      ...(ticket?.companyId ? { companyId: ticket.companyId } : {}),
      ...(ticket?.whatsappId ? { whatsappId: ticket.whatsappId } : {}),

      phone: ticket?.contact?.number,
      ...(ticket?.contact?.name ? { name: ticket.contact.name } : {}),

      kind,
      text,

      fromMe: Boolean(msg?.key?.fromMe),

      ...(buttonReply?.selectedID ? { buttonId: buttonReply.selectedID } : {}),
      ...(buttonReply?.selectedDisplayText
        ? { buttonText: buttonReply.selectedDisplayText }
        : {}),

      isButtonReply: Boolean(buttonReply?.selectedID),

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
    if (message?.contactMessage || message?.contactsArrayMessage)
      return "contact";
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

    return (
      msg?.body ||
      message?.conversation ||
      message?.extendedTextMessage?.text ||
      ""
    );
  }

  private extractMedia(
    message: any,
    kind: MessageKind,
  ): NormalizedMedia | null {
    if (kind === "image") {
      const image = message?.imageMessage;

      return {
        ...(image?.mimetype ? { mimeType: image.mimetype } : {}),
        ...(image?.URL ? { url: image.URL } : {}),
        ...(image?.caption ? { caption: image.caption } : {}),
        ...(image?.fileLength ? { size: Number(image.fileLength) } : {}),
      };
    }

    if (kind === "audio") {
      const audio = message?.audioMessage;

      return {
        ...(audio?.mimetype ? { mimeType: audio.mimetype } : {}),
        ...(audio?.URL ? { url: audio.URL } : {}),
        ...(audio?.fileLength ? { size: Number(audio.fileLength) } : {}),
        ...(audio?.seconds ? { durationSeconds: Number(audio.seconds) } : {}),
      };
    }

    if (kind === "video") {
      const video = message?.videoMessage;

      return {
        ...(video?.mimetype ? { mimeType: video.mimetype } : {}),
        ...(video?.URL ? { url: video.URL } : {}),
        ...(video?.caption ? { caption: video.caption } : {}),
        ...(video?.fileLength ? { size: Number(video.fileLength) } : {}),
        ...(video?.seconds ? { durationSeconds: Number(video.seconds) } : {}),
      };
    }

    if (kind === "document") {
      const document = message?.documentMessage;

      return {
        ...(document?.mimetype ? { mimeType: document.mimetype } : {}),
        ...(document?.fileName ? { fileName: document.fileName } : {}),
        ...(document?.title ? { title: document.title } : {}),
        ...(document?.URL ? { url: document.URL } : {}),
        ...(document?.caption ? { caption: document.caption } : {}),
        ...(document?.fileLength ? { size: Number(document.fileLength) } : {}),
        ...(document?.pageCount
          ? { pageCount: Number(document.pageCount) }
          : {}),
      };
    }

    return null;
  }
}
