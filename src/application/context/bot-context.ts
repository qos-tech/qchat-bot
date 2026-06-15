import type { BotFeatures } from "../../domain/bot/bot-config.js";

export type BotContext = {
  botId: string;
  botName: string;
  companyId?: number;
  whatsappId?: number;

  triageQueueId: string;

  menus: Record<string, BotMenu>;

  messages: Record<string, string>;

  features?: BotFeatures;
};

export type BotMenu = {
  id: string;
  title: string;
  description: string;
  buttons: BotMenuButton[];
};

export type BotMenuButton = {
  id: string;
  label: string;
  action: BotMenuAction;
};

export type BotMenuAction =
  | {
      type: "send_menu";
      menuId: string;
    }
  | {
      type: "transfer";
      queueId: string;
      intent: string;
      messageKey: string;
    };
