import "dotenv/config";
import Fastify from "fastify";
import { QChatPayloadNormalizer } from "../../infrastructure/providers/qchat/qchat-payload-normalizer.js";
import { createHandleIncomingMessageUseCase } from "../../bootstrap/create-handle-incoming-message-use-case.js";

const app = Fastify({
  logger: true,
});

const normalizer = new QChatPayloadNormalizer();
const handleIncomingMessageUseCase = createHandleIncomingMessageUseCase();

app.get("/health", async () => {
  return {
    status: "ok",
    service: "qchat-bot",
  };
});

app.post("/webhook/qchat", async (request, reply) => {
  try {
    const normalizedMessage = normalizer.normalize(request.body);

    await handleIncomingMessageUseCase.execute(normalizedMessage);

    return reply.status(200).send({
      status: "ok",
    });
  } catch (error) {
    request.log.error({
      error,
      route: "/webhook/qchat",
    });

    return reply.status(500).send({
      status: "error",
      message: "Erro ao processar webhook",
    });
  }
});

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

await app.listen({
  port,
  host,
});
