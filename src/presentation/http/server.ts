import "dotenv/config";
import Fastify from "fastify";
import { QChatPayloadNormalizer } from "../../infrastructure/providers/qchat/qchat-payload-normalizer.js";
import { createHandleIncomingMessageUseCase } from "../../bootstrap/create-handle-incoming-message-use-case.js";
import { env } from "../../config/env.js";

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
    request.log.info({
      event: "webhook_received",
      route: "/webhook/qchat",
    });

    const normalizedMessage = normalizer.normalize(request.body);

    request.log.info({
      event: "message_normalized",
      provider: normalizedMessage.provider,
      kind: normalizedMessage.kind,
      ticketId: normalizedMessage.ticketId,
      phone: normalizedMessage.phone,
      queueId: normalizedMessage.queueId,
      userId: normalizedMessage.userId,
      fromMe: normalizedMessage.fromMe,
      buttonId: normalizedMessage.buttonId,
    });

    await handleIncomingMessageUseCase.execute(normalizedMessage);

    return reply.status(200).send({
      status: "ok",
    });
  } catch (error) {
    request.log.error({
      event: "webhook_error",
      route: "/webhook/qchat",
      error,
    });

    return reply.status(500).send({
      status: "error",
      message: "Erro ao processar webhook",
    });
  }
});

const port = env.PORT;
const host = env.HOST;

await app.listen({
  port,
  host,
});
