import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { config } from "@/utils/config.ts";
import { errorMiddleware } from "@/middleware/error.middleware.ts";
import { loggerMiddleware } from "@/middleware/logger.middleware.ts";
import { router } from "./routes/index.ts";

const app = new Application();
const PORT = config.PORT;

// Apply middlewares
app.use(oakCors());
app.use(loggerMiddleware);
app.use(errorMiddleware);

// Apply routes
app.use(router.routes());
app.use(router.allowedMethods());

// Start server
console.log(
  `🌱 Plant Disease Detection API running on http://localhost:${PORT}`
);
await app.listen({ port: PORT });
