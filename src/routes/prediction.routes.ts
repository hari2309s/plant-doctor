import { oakCors, Router } from "../../deps.ts";
import { predictPlantDisease } from "@/controllers/prediction.controller.ts";

const predictionRoutes = new Router();

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Plant disease prediction endpoint
predictionRoutes
  .options("/predict", oakCors(corsOptions))
  .post("/predict", predictPlantDisease);

export { predictionRoutes };
