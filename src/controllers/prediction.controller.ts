import { encodeBase64FromBuffer } from "@/utils/image.utils.ts";
import { getPredictionFromHuggingFace } from "@/services/huggingface.service.ts";
import { getDiseaseTreatment } from "@/models/disease.model.ts";
import { PredictionResult } from "@/models/prediction.model.ts";
import { Context } from "../../deps.ts";
import { config } from "@/utils/config.ts";
import { saveDiagnosis } from "@/services/diagnosis.service.ts";

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

    if (
      !formData.files ||
      formData.files.length === 0 ||
      !formData.fields.plant_name
    ) {
      ctx.response.status = 400;
      ctx.response.body = {
        status: "error",
        message: "No file uploaded",
      };
      return;
    }

    const file = formData.files[0];
    const plantName = formData.fields.plant_name;

    if (!file) {
      ctx.response.status = 400;
      ctx.response.body = {
        status: "error",
        message: "No file uploaded",
      };
      return;
    }

    // Save the uploaded file
    const fileExt = file.filename?.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    /*try {
      await Deno.writeFile(filePath, file.content!, { create: true });
    } catch (error) {
      console.log("error ", error);
    }*/

    // Convert the file directly to base64 from the in-memory content
    const imageBase64 = await encodeBase64FromBuffer(file.content!);

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

    // Save diagnosis to database
    const diagnosis = await saveDiagnosis({
      plant_name: plantName,
      predictions: formattedPredictions,
      disease_name: disease.label,
      treatment: disease.description,
      image_path: filePath,
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
