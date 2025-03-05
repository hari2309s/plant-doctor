import { config } from "@/utils/config.ts";
import { errorMiddleware } from "@/middleware/error.middleware.ts";
import { loggerMiddleware } from "@/middleware/logger.middleware.ts";
import { router } from "./routes/index.ts";
import { Application, oakCors } from "../deps.ts";
import { initDB } from "@/db/database.ts";
import { openApiSpec } from "@/openapi.ts";

// Initialize DB connection
await initDB();

const app = new Application();
const PORT = config.PORT;

// Configure CORS
app.use(
  oakCors({
    origin: ["http://localhost:3000", "http://localhost:8000"],
    optionsSuccessStatus: 200,
  })
);

// Serve static files from the uploads directory
app.use(async (ctx, next) => {
  const path = ctx.request.url.pathname;
  if (path.startsWith("/uploads/")) {
    const filePath = path.replace("/uploads/", "uploads/");
    try {
      await ctx.send({
        root: Deno.cwd(),
        path: filePath,
      });
    } catch {
      await next();
    }
  } else {
    await next();
  }
});

// Create uploads directory if it doesn't exist
try {
  await Deno.mkdir("uploads", { recursive: true });
} catch (error) {
  if (!(error instanceof Deno.errors.AlreadyExists)) {
    console.error("Failed to create uploads directory:", error);
  }
}

// Swagger UI HTML template
const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Plant Doctor API Docs</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: "/swagger.json", // Load OpenAPI Spec from swagger.ts
        dom_id: "#swagger-ui"
      });
    };
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
