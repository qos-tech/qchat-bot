import type { FastifyReply, FastifyRequest } from "fastify";
import { ExternalApiError } from "../../domain/errors/external-api-error.js";

export function handleWebhookError(
  error: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
  route: string,
) {
  if (error instanceof ExternalApiError) {
    request.log.error({
      event: "external_api_error",
      route,
      provider: error.context.provider,
      operation: error.context.operation,
      status: error.context.status,
      statusText: error.context.statusText,
      responseBody: error.context.responseBody,
      correlationId: error.context.correlationId,
    });

    return reply.status(502).send({
      status: "error",
      message: "Falha ao comunicar com serviço externo",
      provider: error.context.provider,
    });
  }

  request.log.error({
    event: "webhook_error",
    route,
    error,
  });

  return reply.status(500).send({
    status: "error",
    message: "Erro ao processar webhook",
  });
}
