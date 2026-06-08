export class ExternalApiError extends Error {
  constructor(
    message: string,
    public readonly context: {
      provider: "evolution" | "qchat";
      status?: number;
      statusText?: string;
      responseBody?: string;
      operation?: string;
    },
  ) {
    super(message);
    this.name = "ExternalApiError";
  }
}
