import {
  encodeBase64FromBuffer,
  extractImageIdentifier,
} from "@/utils/image.utils.ts";
import { getPredictionFromHuggingFace } from "@/services/huggingface.service.ts";
import { getDiseaseTreatment } from "@/models/disease.model.ts";
import { PredictionResult } from "@/models/prediction.model.ts";
import { Context } from "../../deps.ts";
import { saveDiagnosis } from "@/services/diagnosis.service.ts";
import { config } from "@/utils/config.utils.ts";

const HF_MODEL_ID = config.HUGGING_FACE_MODEL_ID;

export async function predictPlantDisease(ctx: Context) {
  try {
    const body = await ctx.request.body().value;
    const { plant_name, image_url } = body;

    if (!plant_name || !image_url) {
      ctx.response.status = 400;
      ctx.response.body = {
        status: "error",
        message: "Plant name or image URL missing",
      };
      return;
    }

    // Fetch the image from Supabase storage
    const imageResponse = await fetch(image_url);

    if (!imageResponse.ok) {
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to fetch image from Supabase " };
      return;
    }

    // Step 2: Convert image to buffer (Uint8Array)
    const imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());

    // Process the image directly from memory for prediction
    let imageBase64;
    try {
      imageBase64 = await encodeBase64FromBuffer(imageBuffer);
    } catch (encodeError: any) {
      console.error("Base64 encoding error:", encodeError);
      ctx.response.status = 500;
      ctx.response.body = {
        error: "Failed to encode image: " + encodeError.message,
      };
      return;
    }

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

    const disease = [...predictions].sort(
      (a, b) => parseFloat(b.confidence) - parseFloat(a.confidence)
    )[0];

    // Extract just the filename or a shortened version of the URL to avoid exceeding database column limits
    const imagePathShortened = extractImageIdentifier(image_url);

    // Save diagnosis to database
    const diagnosis = await saveDiagnosis({
      plant_name: plant_name,
      predictions: formattedPredictions,
      disease_name: disease.label || "Unknown",
      treatment: disease.description || "No treatment information available",
      image_path: imagePathShortened,
    });

    const result: PredictionResult = {
      success: true,
      timestamp: new Date().toISOString(),
      model: HF_MODEL_ID,
      ...diagnosis,
    };

    ctx.response.body = result;
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to process image: " + error.message };
  }
}
