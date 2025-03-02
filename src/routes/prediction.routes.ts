import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { predictPlantDisease } from "../controllers/prediction.controller.ts";

const predictionRoutes = new Router();

// Plant disease prediction endpoint
predictionRoutes.post("/predict", predictPlantDisease);

export { predictionRoutes };
