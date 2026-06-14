import type { BotContext, BotMenu, BotMenuButton } from "./bot-context.js";

export class MenuResolver {
  static getMenu(context: BotContext, menuId: string): BotMenu | null {
    return context.menus[menuId] ?? null;
  }

  static findButtonInMenu(
    context: BotContext,
    menuId: string,
    buttonId: string,
  ): BotMenuButton | null {
    const menu = this.getMenu(context, menuId);

    if (!menu) {
      return null;
    }

    return menu.buttons.find((item) => item.id === buttonId) ?? null;
  }

  static findButton(
    context: BotContext,
    buttonId: string,
  ): BotMenuButton | null {
    for (const menu of Object.values(context.menus)) {
      const button = menu.buttons.find((item) => item.id === buttonId);

      if (button) {
        return button;
      }
    }

    return null;
  }

  static getMessage(context: BotContext, key: string): string | null {
    return context.messages[key] ?? null;
  }
}
