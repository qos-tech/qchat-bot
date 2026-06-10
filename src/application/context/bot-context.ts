export type BotContext = {
  botId: string;
  botName: string;

  triageQueueId: string;

  menus: Record<string, BotMenu>;

  messages: Record<string, string>;
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
