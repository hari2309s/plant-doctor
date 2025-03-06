import { Router } from "../../deps.ts";
import { predictPlantDisease } from "@/controllers/prediction.controller.ts";

const predictionRoutes = new Router();

// Plant disease prediction endpoint
predictionRoutes.post("/predict", predictPlantDisease);

export { predictionRoutes };
