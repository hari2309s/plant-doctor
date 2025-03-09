import { errorMiddleware } from "@/middleware/error.middleware.ts";
import { loggerMiddleware } from "@/middleware/logger.middleware.ts";
import { router } from "@/routes/index.ts";
import { Application } from "../deps.ts";
import { openApiSpec } from "@/openapi.ts";
import { config } from "@/utils/config.utils.ts";
import { initDB } from "@/db/database.ts";

// Initialize DB connection
await initDB();

const app = new Application();
const PORT = config.PORT;

// Allow origins that will access your API
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://hari2309s.github.io/plant-doctor-frontend",
  "null",
];

// CORS middleware - apply this before any routes
app.use(async (ctx, next) => {
  const origin = ctx.request.headers.get("Origin") || "";

  // Check if the origin is allowed or use "*" during development
  // For production, use specific origins instead of "*"
  ctx.response.headers.set(
    "Access-Control-Allow-Origin",
    allowedOrigins.includes(origin) ? origin : "*"
  );

  // Essential CORS headers
  ctx.response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  ctx.response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept, X-Requested-With"
  );
  ctx.response.headers.set("Access-Control-Max-Age", "3600");

  // Handle preflight requests
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204; // No content for OPTIONS
    return;
  }

  await next();
});

// Swagger UI HTML template
const swaggerHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Swagger UI</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css">
        <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script>
          window.onload = function() {
            SwaggerUIBundle({
              url: "/swagger.json",
              dom_id: '#swagger-ui',
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.SwaggerUIStandalonePreset
              ],
              layout: "BaseLayout"
            });
          }
        </script>
      </body>
    </html>
`;

// Serve Swagger UI on `/swagger.json`
router.get("/swagger.json", (context) => {
  context.response.body = openApiSpec;
  context.response.headers.set("Content-Type", "application/json");
});

// Serve OpenAPI spec on `/docs`
router.get("/docs", (context) => {
  context.response.body = swaggerHtml;
  context.response.headers.set("Content-Type", "text/html");
});

// Apply middlewares
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
