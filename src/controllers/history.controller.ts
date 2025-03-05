import {
  getAllDiagnoses,
  getDiagnosisById,
} from "@/services/diagnosis.service.ts";
import { Context } from "../../deps.ts";

export async function getHistory(ctx: Context) {
  try {
    const diagnoses = await getAllDiagnoses();

    // Transform data to include image URLs
    const results = diagnoses.map((diagnosis) => ({
      id: diagnosis.id,
      plant_name: diagnosis.plant_name,
      disease_name: diagnosis.disease_name,
      image_url: `/${diagnosis.image_path}`,
      predictions: diagnosis.predictions,
      additional_info: diagnosis.additional_info,
      created_at: diagnosis.created_at,
    }));

    ctx.response.body = { history: results };
  } catch (error) {
    console.error("Error fetching history:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
}

export async function getHistoryById(ctx: any) {
  try {
    const id = ctx.params.id;
    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Diagnosis ID is required" };
      return;
    }

    const diagnosis = await getDiagnosisById(parseInt(id));
    if (!diagnosis) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Diagnosis not found" };
      return;
    }

    ctx.response.body = {
      ...diagnosis,
      image_url: `/${diagnosis.image_path}`,
    };
  } catch (error) {
    console.error("Error fetching diagnosis:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
}
