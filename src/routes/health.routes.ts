import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

const healthRoutes = new Router();

// Health check endpoint
healthRoutes.get("/", (ctx) => {
  ctx.response.body = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: performance.now() / 1000,
  };
});

export { healthRoutes };
