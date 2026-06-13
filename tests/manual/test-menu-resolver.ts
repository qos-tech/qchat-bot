import { DefaultBotConfigResolver } from "../../src/application/services/default-bot-config-resolver.js";
import { BotContextMapper } from "../../src/application/context/bot-context-mapper.js";
import { MenuResolver } from "../../src/application/context/menu-resolver.js";
import { MenuToButtonMessage } from "../../src/application/context/menu-to-button-message.js";
import { PostgresBotConfigRepository } from "../../src/infrastructure/repositories/postgres-bot-config-repository.js";

const repository = new PostgresBotConfigRepository();

const resolver = new DefaultBotConfigResolver(repository);

const config = await resolver.resolveByMessage({
  companyId: 1,
  whatsappId: 127,
});

if (!config) {
  throw new Error("Bot não encontrado");
}

const context = BotContextMapper.fromConfig(config);

const menu = MenuResolver.getMenu(context, "main");

console.log("MENU:");
console.log(JSON.stringify(menu, null, 2));

const button = MenuResolver.findButton(context, "option_support");

console.log("BUTTON:");
console.log(JSON.stringify(button, null, 2));

const message = MenuResolver.getMessage(context, "support_confirmation");

console.log("MESSAGE:");
console.log(message);

if (menu) {
  const payload = MenuToButtonMessage.convert(menu);

  console.log("BUTTON PAYLOAD:");
  console.log(JSON.stringify(payload, null, 2));
}

process.exit(0);
