import { healthRoutes } from "@/routes/health.routes.ts";
import { predictionRoutes } from "@/routes/prediction.routes.ts";
import { Router } from "../../deps.ts";

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
          image: "Plant leaf image file",
        },
        response: {
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

export { router };
