import Fastify from "fastify";
import { QChatPayloadNormalizer } from "../../infrastructure/providers/qchat/qchat-payload-normalizer.js";
import { createHandleIncomingMessageUseCase } from "../../bootstrap/create-handle-incoming-message-use-case.js";
import { env } from "../../config/env.js";

import { BotContextMapper } from "../../application/context/bot-context-mapper.js";
import { DefaultBotConfigResolver } from "../../application/services/default-bot-config-resolver.js";
import { PostgresBotConfigRepository } from "../../infrastructure/repositories/postgres-bot-config-repository.js";
import { handleWebhookError } from "./handle-webhook-error.js";

const app = Fastify({
  logger: true,
});

const normalizer = new QChatPayloadNormalizer();
const handleIncomingMessageUseCase = createHandleIncomingMessageUseCase();

const botConfigRepository = new PostgresBotConfigRepository();
const botConfigResolver = new DefaultBotConfigResolver(botConfigRepository);

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
    return handleWebhookError(error, request, reply, "/webhook/qchat");
  }
});

app.post("/webhook/qchat/:webhookToken", async (request, reply) => {
  try {
    const { webhookToken } = request.params as {
      webhookToken: string;
    };

    request.log.info({
      event: "dynamic_webhook_received",
      route: "/webhook/qchat/:webhookToken",
      webhookToken,
    });

    const botConfig =
      await botConfigResolver.resolveByWebhookToken(webhookToken);

    if (!botConfig) {
      request.log.warn({
        event: "bot_config_not_found",
        webhookToken,
      });

      return reply.status(404).send({
        status: "error",
        message: "Bot não encontrado",
      });
    }

    const normalizedMessage = normalizer.normalize(request.body);

    request.log.info({
      event: "bot_config_resolved",
      botConfigId: botConfig.id,
      botName: botConfig.name,
      companyId: botConfig.companyId,
      whatsappId: botConfig.whatsappId,
    });

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

    const context = BotContextMapper.fromConfig(botConfig);

    await handleIncomingMessageUseCase.execute(normalizedMessage, context);

    return reply.status(200).send({
      status: "ok",
      bot: botConfig.name,
    });
  } catch (error) {
    return handleWebhookError(
      error,
      request,
      reply,
      "/webhook/qchat/:webhookToken",
    );
  }
});

const port = env.PORT;
const host = env.HOST;

await app.listen({
  port,
  host,
});
