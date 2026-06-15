import type { IncomingMessageNormalizer } from "../../../domain/messaging/incoming-message-normalizer.js";
import type { MessageKind } from "../../../domain/messaging/message-kind.js";
import type { NormalizedIncomingMessage } from "../../../domain/messaging/normalized-incoming-message.js";
import type { NormalizedMedia } from "../../../domain/messaging/normalized-media.js";

export class EvolutionPayloadNormalizer implements IncomingMessageNormalizer {
  normalize(payload: any): NormalizedIncomingMessage {
    const data = payload?.data ?? payload;
    const key = data?.key;
    const message = data?.message;
    const messageType = data?.messageType;
    const instance = String(payload?.instance ?? "");
    const phone = this.extractPhone(key?.remoteJid);
    const kind = this.detectKind(message, messageType);
    const media = this.extractMedia(message, kind);
    const text = this.extractText(message, kind);
    const buttonId = this.extractButtonId(message);
    const buttonText = this.extractButtonText(message, kind);
    const conversationId = `${instance}:${phone}`;

    return {
      provider: "evolution",
      messageId: String(key?.id ?? ""),
      conversationId,
      ticketId: conversationId,
      phone,
      ...(data?.pushName ? { name: data.pushName } : {}),
      kind,
      text,
      fromMe: Boolean(key?.fromMe),
      ...(buttonId ? { buttonId } : {}),
      ...(buttonText ? { buttonText } : {}),
      isButtonReply: kind === "button",
      ...(media ? { media } : {}),
      ...(data?.messageTimestamp
        ? { timestamp: new Date(Number(data.messageTimestamp) * 1000) }
        : {}),
      raw: payload,
    };
  }

  private extractPhone(remoteJid: unknown): string {
    const value = String(remoteJid ?? "");
    return value.split("@")[0] ?? "";
  }

  private detectKind(message: any, messageType?: string): MessageKind {
    if (
      message?.buttonsResponseMessage ||
      messageType === "buttonsResponseMessage"
    ) {
      return "button";
    }
    if (message?.templateButtonReplyMessage || message?.listResponseMessage) {
      return "button";
    }
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

  private extractText(message: any, kind: MessageKind): string {
    if (kind === "button") {
      return (
        message?.buttonsResponseMessage?.selectedDisplayText ||
        message?.templateButtonReplyMessage?.selectedDisplayText ||
        message?.listResponseMessage?.title ||
        message?.listResponseMessage?.description ||
        ""
      );
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
      return message?.conversation || message?.extendedTextMessage?.text || "";
    }

    return "";
  }

  private extractButtonId(message: any): string | null {
    return (
      message?.buttonsResponseMessage?.selectedButtonId ||
      message?.templateButtonReplyMessage?.selectedId ||
      message?.templateButtonReplyMessage?.selectedID ||
      message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      null
    );
  }

  private extractButtonText(message: any, kind: MessageKind): string | null {
    if (kind !== "button") {
      return null;
    }

    return (
      message?.buttonsResponseMessage?.selectedDisplayText ||
      message?.templateButtonReplyMessage?.selectedDisplayText ||
      message?.listResponseMessage?.title ||
      null
    );
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

    const size =
      typeof media.fileLength === "number"
        ? media.fileLength
        : media.fileLength?.low;

    return {
      ...(media.mimetype ? { mimeType: media.mimetype } : {}),
      ...(media.fileName ? { fileName: media.fileName } : {}),
      ...(media.title ? { title: media.title } : {}),
      ...(media.URL ? { url: media.URL } : {}),
      ...(media.url ? { url: media.url } : {}),
      ...(media.caption ? { caption: media.caption } : {}),
      ...(size !== undefined ? { size: Number(size) } : {}),
      ...(media.seconds ? { durationSeconds: Number(media.seconds) } : {}),
      ...(media.pageCount ? { pageCount: Number(media.pageCount) } : {}),
    };
  }
}
