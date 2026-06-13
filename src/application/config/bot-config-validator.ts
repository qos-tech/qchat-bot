import type { BotConfig } from "../../domain/bot/bot-config.js";

type BotMenuAction =
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

type BotMenuButton = {
  id: string;
  label: string;
  action: BotMenuAction;
};

type BotMenu = {
  id: string;
  title: string;
  buttons: BotMenuButton[];
};

export class BotConfigValidator {
  static validate(config: BotConfig): void {
    this.requiredString(config.id, "Bot.id obrigatório");
    this.requiredString(config.name, "Bot.name obrigatório");
    this.requiredString(config.webhookToken, "Bot.webhookToken obrigatório");

    if (typeof config.active !== "boolean") {
      throw new Error("Bot.active obrigatório");
    }

    this.validateEvolution(config);
    this.validateQChat(config);
    this.validateMenusAndMessages(config);
  }

  private static validateEvolution(config: BotConfig): void {
    if (!this.isRecord(config.evolution)) {
      throw new Error("Evolution obrigatório");
    }

    this.requiredUrl(config.evolution.apiUrl, "Evolution.apiUrl inválido");
    this.requiredString(config.evolution.apiKey, "Evolution.apiKey obrigatório");
    this.requiredString(
      config.evolution.instance,
      "Evolution.instance obrigatório",
    );
  }

  private static validateQChat(config: BotConfig): void {
    if (!this.isRecord(config.qchat)) {
      throw new Error("QChat obrigatório");
    }

    this.requiredUrl(config.qchat.apiUrl, "QChat.apiUrl inválido");
    this.requiredString(config.qchat.apiToken, "QChat.apiToken obrigatório");
  }

  private static validateMenusAndMessages(config: BotConfig): void {
    const menus = this.parseMenus(config);
    const messages = this.parseMessages(config);

    for (const menu of Object.values(menus)) {
      for (const button of menu.buttons) {
        if (button.action.type === "send_menu") {
          if (!menus[button.action.menuId]) {
            throw new Error(`Menu "${button.action.menuId}" não encontrado`);
          }

          continue;
        }

        if (!messages[button.action.messageKey]) {
          throw new Error(
            `Message "${button.action.messageKey}" não encontrada`,
          );
        }
      }
    }
  }

  private static parseMenus(config: BotConfig): Record<string, BotMenu> {
    if (!this.isRecord(config.menus)) {
      throw new Error("Bot.menus obrigatório");
    }

    const menus: Record<string, BotMenu> = {};

    if (Object.keys(config.menus).length === 0) {
      throw new Error("Bot.menus obrigatório");
    }

    for (const [menuKey, menuValue] of Object.entries(config.menus)) {
      if (!this.isRecord(menuValue)) {
        throw new Error(`Menu "${menuKey}" inválido`);
      }

      this.requiredString(menuValue.id, `Menu "${menuKey}".id obrigatório`);
      this.requiredString(
        menuValue.title,
        `Menu "${menuKey}".title obrigatório`,
      );

      if (!Array.isArray(menuValue.buttons)) {
        throw new Error(`Menu "${menuKey}".buttons obrigatório`);
      }

      menus[menuKey] = {
        id: menuValue.id,
        title: menuValue.title,
        buttons: menuValue.buttons.map((buttonValue, index) =>
          this.parseButton(menuKey, buttonValue, index),
        ),
      };
    }

    return menus;
  }

  private static parseButton(
    menuKey: string,
    buttonValue: unknown,
    index: number,
  ): BotMenuButton {
    if (!this.isRecord(buttonValue)) {
      throw new Error(`Botão "${menuKey}.${index}" inválido`);
    }

    this.requiredString(
      buttonValue.id,
      `Botão "${menuKey}.${index}".id obrigatório`,
    );
    this.requiredString(
      buttonValue.label,
      `Botão "${buttonValue.id}".label obrigatório`,
    );

    if (!this.isRecord(buttonValue.action)) {
      throw new Error(`Botão "${buttonValue.id}" inválido`);
    }

    return {
      id: buttonValue.id,
      label: buttonValue.label,
      action: this.parseAction(buttonValue.id, buttonValue.action),
    };
  }

  private static parseAction(
    buttonId: string,
    actionValue: Record<string, unknown>,
  ): BotMenuAction {
    if (actionValue.type === "send_menu") {
      this.requiredString(
        actionValue.menuId,
        `Botão "${buttonId}".action.menuId obrigatório`,
      );

      return {
        type: "send_menu",
        menuId: actionValue.menuId,
      };
    }

    if (actionValue.type === "transfer") {
      this.requiredString(
        actionValue.queueId,
        `Botão "${buttonId}".action.queueId obrigatório`,
      );
      this.requiredString(
        actionValue.intent,
        `Botão "${buttonId}".action.intent obrigatório`,
      );
      this.requiredString(
        actionValue.messageKey,
        `Botão "${buttonId}".action.messageKey obrigatório`,
      );

      return {
        type: "transfer",
        queueId: actionValue.queueId,
        intent: actionValue.intent,
        messageKey: actionValue.messageKey,
      };
    }

    throw new Error(`Botão "${buttonId}" inválido`);
  }

  private static parseMessages(config: BotConfig): Record<string, string> {
    if (!this.isRecord(config.messages)) {
      throw new Error("Bot.messages obrigatório");
    }

    const messages: Record<string, string> = {};

    for (const [key, value] of Object.entries(config.messages)) {
      this.requiredString(value, `Message "${key}" inválida`);
      messages[key] = value;
    }

    return messages;
  }

  private static requiredString(
    value: unknown,
    message: string,
  ): asserts value is string {
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(message);
    }
  }

  private static requiredUrl(value: unknown, message: string): void {
    this.requiredString(value, message);

    try {
      new URL(value);
    } catch {
      throw new Error(message);
    }
  }

  private static isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }
}
