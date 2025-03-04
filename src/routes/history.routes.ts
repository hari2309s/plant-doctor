import { Router } from "../../deps.ts";
import { getHistory } from "@/controllers/history.controller.ts";

const historyRoutes = new Router();

// Plant diagnoses history endpoint
historyRoutes.get("/history", getHistory);

export { historyRoutes };
