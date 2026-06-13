import Fastify from "fastify";
import { createHandleIncomingMessageUseCase } from "../../bootstrap/create-handle-incoming-message-use-case.js";
import { queueConfig } from "../../application/config/queue-config.js";
import { BotContextMapper } from "../../application/context/bot-context-mapper.js";
import { maskWebhookToken } from "../../application/security/webhook-token.js";
import { DefaultBotConfigResolver } from "../../application/services/default-bot-config-resolver.js";
import type { BotConfigResolver } from "../../application/services/bot-config-resolver.js";
import { HandleIncomingMessageUseCase } from "../../application/use-cases/handle-incoming-message-use-case.js";
import type { BotConfig } from "../../domain/bot/bot-config.js";
import type { IncomingMessageNormalizer } from "../../domain/messaging/incoming-message-normalizer.js";
import { EvolutionMessagingGateway } from "../../infrastructure/gateways/evolution-messaging-gateway.js";
import { QChatTicketTransferGateway } from "../../infrastructure/gateways/qchat-ticket-transfer-gateway.js";
import { EvolutionPayloadNormalizer } from "../../infrastructure/providers/evolution/evolution-payload-normalizer.js";
import { QChatPayloadNormalizer } from "../../infrastructure/providers/qchat/qchat-payload-normalizer.js";
import { PostgresBotConfigRepository } from "../../infrastructure/repositories/postgres-bot-config-repository.js";
import { PostgresConversationSessionRepository } from "../../infrastructure/repositories/postgres-conversation-session-repository.js";
import { DefaultBusinessHoursService } from "../../infrastructure/services/default-business-hours-service.js";
import { handleWebhookError } from "./handle-webhook-error.js";

type MessageHandler = Pick<HandleIncomingMessageUseCase, "execute">;

type CreateAppDependencies = {
  qchatNormalizer?: IncomingMessageNormalizer;
  evolutionNormalizer?: IncomingMessageNormalizer;
  legacyHandleIncomingMessageUseCase?: MessageHandler;
  botConfigResolver?: BotConfigResolver;
  createDynamicHandleIncomingMessageUseCase?: (
    botConfig: BotConfig,
  ) => MessageHandler;
};

const botConfigRepository = new PostgresBotConfigRepository();
const defaultBotConfigResolver = new DefaultBotConfigResolver(botConfigRepository);

function defaultCreateDynamicHandleIncomingMessageUseCase(
  botConfig: BotConfig,
): HandleIncomingMessageUseCase {
  return new HandleIncomingMessageUseCase(
    new PostgresConversationSessionRepository(),
    new EvolutionMessagingGateway(botConfig.evolution),
    new QChatTicketTransferGateway(botConfig.qchat),
    new DefaultBusinessHoursService(),
    queueConfig,
  );
}

export function createApp(dependencies: CreateAppDependencies = {}) {
  const app = Fastify({
    logger: true,
  });

  const qchatNormalizer =
    dependencies.qchatNormalizer ?? new QChatPayloadNormalizer();
  const evolutionNormalizer =
    dependencies.evolutionNormalizer ?? new EvolutionPayloadNormalizer();
  const legacyHandleIncomingMessageUseCase =
    dependencies.legacyHandleIncomingMessageUseCase ??
    createHandleIncomingMessageUseCase();
  const botConfigResolver =
    dependencies.botConfigResolver ?? defaultBotConfigResolver;
  const createDynamicHandleIncomingMessageUseCase =
    dependencies.createDynamicHandleIncomingMessageUseCase ??
    defaultCreateDynamicHandleIncomingMessageUseCase;

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

      const normalizedMessage = qchatNormalizer.normalize(request.body);

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

      await legacyHandleIncomingMessageUseCase.execute(normalizedMessage);

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
        webhookToken: maskWebhookToken(webhookToken),
      });

      const botConfig =
        await botConfigResolver.resolveByWebhookToken(webhookToken);

      if (!botConfig) {
        request.log.warn({
          event: "bot_config_not_found",
          webhookToken: maskWebhookToken(webhookToken),
        });

        return reply.status(404).send({
          status: "error",
          message: "Bot não encontrado",
        });
      }

      const normalizedMessage = qchatNormalizer.normalize(request.body);

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
      const dynamicHandleIncomingMessageUseCase =
        createDynamicHandleIncomingMessageUseCase(botConfig);

      await dynamicHandleIncomingMessageUseCase.execute(
        normalizedMessage,
        context,
      );

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

  app.post("/webhook/evolution", async (request, reply) => {
    try {
      const payload = request.body as Record<string, unknown>;
      const event = String(payload?.event ?? "");
      const instance = String(payload?.instance ?? "");

      request.log.info({
        event: "evolution_webhook_received",
        route: "/webhook/evolution",
        provider: "evolution",
        eventName: event,
        instance,
      });

      if (event !== "messages.upsert") {
        request.log.info({
          event: "evolution_webhook_ignored",
          route: "/webhook/evolution",
          provider: "evolution",
          eventName: event,
          instance,
          reason: "unsupported_event",
        });

        return reply.status(200).send({
          status: "ignored",
          reason: "unsupported_event",
        });
      }

      const botConfig = await botConfigResolver.resolveByEvolutionInstance(
        instance,
      );

      if (!botConfig) {
        request.log.warn({
          event: "bot_config_not_found",
          provider: "evolution",
          instance,
        });

        return reply.status(404).send({
          status: "error",
          message: "Bot não encontrado",
        });
      }

      const normalizedMessage = evolutionNormalizer.normalize(payload);

      request.log.info({
        event: "bot_config_resolved",
        provider: "evolution",
        instance,
        botConfigId: botConfig.id,
        botName: botConfig.name,
        companyId: botConfig.companyId,
        whatsappId: botConfig.whatsappId,
      });

      request.log.info({
        event,
        instance,
        provider: normalizedMessage.provider,
        messageId: normalizedMessage.messageId,
        conversationId: normalizedMessage.conversationId,
        phone: normalizedMessage.phone,
        kind: normalizedMessage.kind,
        fromMe: normalizedMessage.fromMe,
      });

      const context = BotContextMapper.fromConfig(botConfig);
      const dynamicHandleIncomingMessageUseCase =
        createDynamicHandleIncomingMessageUseCase(botConfig);

      await dynamicHandleIncomingMessageUseCase.execute(
        normalizedMessage,
        context,
      );

      return reply.status(200).send({
        status: "ok",
        bot: botConfig.name,
      });
    } catch (error) {
      return handleWebhookError(error, request, reply, "/webhook/evolution");
    }
  });

  return app;
}
