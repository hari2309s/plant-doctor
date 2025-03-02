import { isHttpError, Middleware } from "../../deps.ts";

/**
 * Global error handling middleware
 */
export const errorMiddleware: Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    let status = 500;
    let message = "Internal Server Error";

    if (isHttpError(err)) {
      status = err.status;
      message = err.message;
    } else if (err instanceof Error) {
      message = err.message;
    }

    ctx.response.status = status;
    ctx.response.body = {
      success: false,
      error: message,
      status,
      timestamp: new Date().toISOString(),
    };

    // Log the error
    console.error(`[ERROR] ${status} - ${message}`, err);
  }
};
