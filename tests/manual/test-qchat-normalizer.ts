import { readFileSync } from "node:fs";
import { join } from "node:path";
import { QChatPayloadNormalizer } from "../../src/infrastructure/providers/qchat/qchat-payload-normalizer.js";

const normalizer = new QChatPayloadNormalizer();

const files = [
  "text.json",
  "button.json",
  "image.json",
  "audio.json",
  "document.json",
  "video.json",
];

for (const file of files) {
  const path = join(process.cwd(), "tests", "fixtures", "qchat", file);
  const payload = JSON.parse(readFileSync(path, "utf-8"));

  const result = normalizer.normalize(payload);

  console.log("\n==============================");
  console.log(file);
  console.log("==============================");
  console.log({
    provider: result.provider,
    kind: result.kind,
    phone: result.phone,
    text: result.text,
    buttonId: result.buttonId,
    buttonText: result.buttonText,
    isButtonReply: result.isButtonReply,
    media: result.media,
    ticketId: result.ticketId,
    companyId: result.companyId,
    whatsappId: result.whatsappId,
    status: result.status,
    queueId: result.queueId,
    userId: result.userId,
  });
}
