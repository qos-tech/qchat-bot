export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    attempts: number;
    baseDelayMs: number;
    shouldRetry: (error: unknown) => boolean;
    onRetry?: (params: {
      attempt: number;
      delayMs: number;
      error: unknown;
    }) => void;
  },
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const canRetry = attempt < options.attempts && options.shouldRetry(error);

      if (!canRetry) {
        throw error;
      }

      const delayMs = options.baseDelayMs * attempt;

      options.onRetry?.({
        attempt,
        delayMs,
        error,
      });

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
