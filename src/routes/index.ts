import { healthRoutes } from "@/routes/health.routes.ts";
import { predictionRoutes } from "@/routes/prediction.routes.ts";
import { Router } from "../../deps.ts";
import { historyRoutes } from "@/routes/history.routes.ts";

const router = new Router();

// Base documentation endpoint
router.get("/", (ctx) => {
  ctx.response.body = {
    name: "Plant Disease Detection API",
    version: "1.0.0",
    description: "API for detecting plant diseases using machine learning",
    endpoints: [
      { path: "/", method: "GET", description: "API documentation" },
      { path: "/health", method: "GET", description: "Health check endpoint" },
      {
        path: "/api/v1/predict",
        method: "POST",
        description: "Predict plant disease from image",
      },
    ],
    repository: "https://github.com/hari2309s/plant-doctor",
    usage: {
      predict: {
        method: "POST",
        path: "/api/v1/predict",
        contentType: "multipart/form-data",
        parameters: {
          file: "Plant leaf image file",
          plant_name: "Name of the plant",
        },
        response: {
          success: true,
          timestamp: "2025-03-06T04:59:35.251Z",
          model: "microsoft/res-net-50",
          predictions: "Array of predictions with label and confidence score",
        },
      },
    },
  };
});

// Apply route modules
router.use("/health", healthRoutes.routes(), healthRoutes.allowedMethods());
router.use(
  "/api/v1",
  predictionRoutes.routes(),
  predictionRoutes.allowedMethods()
);
router.use("/api/v1", historyRoutes.routes(), historyRoutes.allowedMethods());

export { router };
