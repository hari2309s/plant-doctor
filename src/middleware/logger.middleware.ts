import { Context, Middleware } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { config } from "@/utils/config.ts";

/**
 * Request logging middleware
 */
export const loggerMiddleware: Middleware = async (ctx, next) => {
  const start = Date.now();
  const requestId = crypto.randomUUID();

  // Add request ID to response headers
  ctx.response.headers.set("X-Request-ID", requestId);

  // Log request
  console.log(
    `[${new Date().toISOString()}] [${requestId}] ${ctx.request.method} ${
      ctx.request.url
    }`
  );

  try {
    await next();

    // Log response
    const ms = Date.now() - start;
    const status = ctx.response.status;
    console.log(
      `[${new Date().toISOString()}] [${requestId}] ${ctx.request.method} ${
        ctx.request.url
      } ${status} ${ms}ms`
    );
  } catch (err) {
    // Error will be handled by error middleware
    throw err;
  }
};
