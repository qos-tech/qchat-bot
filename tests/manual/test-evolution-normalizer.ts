import { readFileSync } from "node:fs";
import { join } from "node:path";
import { EvolutionPayloadNormalizer } from "../../src/infrastructure/providers/evolution/evolution-payload-normalizer.js";

const normalizer = new EvolutionPayloadNormalizer();

const files = [
  "text.json",
  "button.json",
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
}

process.exit(0);
