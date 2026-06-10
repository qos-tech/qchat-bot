// src/application/context/menu-to-button-message.ts

import type { ButtonMessage } from "../../domain/messaging/button-message.js";
import type { BotMenu } from "./bot-context.js";

export class MenuToButtonMessage {
  static convert(menu: BotMenu): ButtonMessage {
    return {
      title: menu.title,
      description: menu.description,
      buttons: menu.buttons.map((button) => ({
        type: "reply",
        displayText: button.label,
        id: button.id,
      })),
    };
  }
}
