import { readFileSync } from "node:fs";
import { join } from "node:path";
import { EvolutionPayloadNormalizer } from "../../src/infrastructure/providers/evolution/evolution-payload-normalizer.js";

const normalizer = new EvolutionPayloadNormalizer();

const files = [
  "text.json",
  "button.json",
  "button-real.json",
  "list.json",
  "image.json",
  "audio.json",
  "document.json",
];

for (const file of files) {
  const path = join(process.cwd(), "tests", "fixtures", "evolution", file);
  const payload = JSON.parse(readFileSync(path, "utf-8"));

  const result = normalizer.normalize(payload);

  console.log("\n==============================");
  console.log(file);
  console.log("==============================");
  console.log({
    provider: result.provider,
    kind: result.kind,
    conversationId: result.conversationId,
    ticketId: result.ticketId,
    phone: result.phone,
    text: result.text,
    buttonId: result.buttonId,
    buttonText: result.buttonText,
    isButtonReply: result.isButtonReply,
    media: result.media,
  });

  if (file === "button-real.json") {
    if (result.kind !== "button") {
      throw new Error("buttonsResponseMessage deveria ser normalizado como button");
    }

    if (result.buttonId !== "option_support") {
      throw new Error("buttonsResponseMessage deveria extrair buttonId");
    }

    if (result.buttonText !== "Suporte Técnico") {
      throw new Error("buttonsResponseMessage deveria extrair buttonText");
    }

    if (result.text !== "Suporte Técnico") {
      throw new Error("buttonsResponseMessage deveria preencher text");
    }

    if (result.isButtonReply !== true) {
      throw new Error("buttonsResponseMessage deveria marcar isButtonReply");
    }

    if (result.phone !== "554197035511") {
      throw new Error("buttonsResponseMessage deveria preservar phone");
    }

    if (result.conversationId !== "4140637066:554197035511") {
      throw new Error("buttonsResponseMessage deveria preservar conversationId");
    }

    if (result.messageId !== "3EB057D78E134D4EB7AEE9") {
      throw new Error("buttonsResponseMessage deveria preservar messageId");
    }

    if (result.provider !== "evolution") {
      throw new Error("buttonsResponseMessage deveria preservar provider");
    }
  }
}

process.exit(0);
