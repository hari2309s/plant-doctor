import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { multiParser } from "https://deno.land/x/multiparser@v2.1.0/mod.ts";
import { getImageBase64 } from "@/utils/image.utils.ts";
import { getPredictionFromHuggingFace } from "@/services/huggingface.service.ts";
import { getDiseaseTreatment } from "@/models/disease.model.ts";
import { PredictionResult } from "@/models/prediction.model.ts";

export async function predictPlantDisease(ctx: Context) {
  try {
    // Parse multipart form data to get the uploaded image
    const body = await ctx.request.body({ type: "form-data" }).value;
    const formData = await multiParser(body);

    if (!formData?.files || !formData.files.image) {
      ctx.response.status = 400;
      ctx.response.body = {
        error:
          "No image file provided. Please upload an image with the field name 'image'.",
      };
      return;
    }

    // Get the image file and convert to base64
    const imageFile = formData.files.image;

    const imageBase64 = await getImageBase64(
      imageFile.filename,
      imageFile.contentType
    );

    // Call Hugging Face API to predict plant disease using the model from the repo
    const predictions = await getPredictionFromHuggingFace(imageBase64);

    // Format and return the predictions
    // Structure is based on the luanvenancio/plant-disease-detection model output
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
      model: "luanvenancio/plant-disease-detection",
      predictions: formattedPredictions,
    };

    ctx.response.body = result;
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to process image: " + error.message };
  }
}
