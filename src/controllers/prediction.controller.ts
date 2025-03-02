import { getImageBase64 } from "@/utils/image.utils.ts";
import { getPredictionFromHuggingFace } from "@/services/huggingface.service.ts";
import { getDiseaseTreatment } from "@/models/disease.model.ts";
import { PredictionResult } from "@/models/prediction.model.ts";
import { Context } from "../../deps.ts";
import { config } from "@/utils/config.ts";

const HF_MODEL_ID = config.HUGGING_FACE_MODEL_ID;

export async function predictPlantDisease(ctx: Context) {
  try {
    // Parse multipart form data to get the uploaded image
    const body = ctx.request.body();

    // Check if the request has the form data type
    if (body.type !== "form-data") {
      ctx.response.status = 400;
      ctx.response.body = {
        status: "error",
        message: "Content-Type must be multipart/form-data",
      };
      return;
    }

    // Get the form data value
    const formData = await body.value.read({
      maxFileSize: 10_000_000, // 10MB limit
    });

    if (!formData.files || formData.files.length === 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        status: "error",
        message: "No file uploaded",
      };
      return;
    }

    const file = formData.files[0];

    if (!file) {
      ctx.response.status = 400;
      ctx.response.body = {
        status: "error",
        message: "No file uploaded",
      };
      return;
    }

    const imageBase64 = await getImageBase64(file.filename!, file.contentType);

    // Call Hugging Face API to predict plant disease using the model from the repo
    const predictions = await getPredictionFromHuggingFace(imageBase64);

    // Format and return the predictions
    // Structure is based on the microsoft/resnet-50 model output
    const formattedPredictions = Array.isArray(predictions)
      ? predictions.map((prediction: { label: string; score: number }) => ({
          disease: prediction.label,
          confidence: (prediction.score * 100).toFixed(2) + "%",
          description: getDiseaseTreatment(prediction.label),
        }))
      : [];

    const result: PredictionResult = {
      success: true,
      timestamp: new Date().toISOString(),
      model: HF_MODEL_ID,
      predictions: formattedPredictions,
    };

    ctx.response.body = result;
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to process image: " + error.message };
  }
}
