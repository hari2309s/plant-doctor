import { encodeBase64FromBuffer } from "@/utils/image.utils.ts";
import { getPredictionFromHuggingFace } from "@/services/huggingface.service.ts";
import { getDiseaseTreatment } from "@/models/disease.model.ts";
import { PredictionResult } from "@/models/prediction.model.ts";
import { Context } from "../../deps.ts";
import { config } from "@/utils/config.ts";
import { saveDiagnosis } from "@/services/diagnosis.service.ts";
import { uploadImageToSupabase } from "@/services/storage.service.ts";

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

    try {
      // Read the file content from the temporary file path
      const fileContent = await Deno.readFile(file?.filename!);

      // Attach the content back to the file object
      file.content = fileContent;

      // Proceed with further processing (e.g., uploading to storage, making predictions, etc.)
      ctx.response.status = 200;
      ctx.response.body = { message: "File processed successfully" };
    } catch (error) {
      console.error("Error reading file:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to read uploaded file" };
    }

    // Generate a unique filename for the image
    const timestamp = new Date().getTime();
    const fileExtension = file.filename?.split(".").pop() || "jpg";
    const uniqueFileName = `${plantName.replace(
      /\s+/g,
      "_"
    )}_${timestamp}.${fileExtension}`;

    // Ensure file.content is defined
    if (!file.content) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "File content is missing",
      };
      return;
    }

    // Check if file.content is actually a Uint8Array
    if (!(file.content instanceof Uint8Array)) {
      console.error("File content is not a Uint8Array:", typeof file.content);

      // Try to convert to Uint8Array if possible
      let contentBuffer: Uint8Array;
      if (typeof file.content === "string") {
        // Convert string to Uint8Array using TextEncoder
        contentBuffer = new TextEncoder().encode(file.content);
      } else if (file.content && file.content instanceof ArrayBuffer) {
        // Convert ArrayBuffer to Uint8Array
        contentBuffer = new Uint8Array(file.content);
      } else {
        ctx.response.status = 500;
        ctx.response.body = {
          error: "File content is in an unsupported format",
        };
        return;
      }

      file.content = contentBuffer;
    }

    // Upload the image to Supabase Storage
    const imageUrl = await uploadImageToSupabase(file.content!, uniqueFileName);

    // Process the image directly from memory for prediction
    let imageBase64;
    try {
      imageBase64 = await encodeBase64FromBuffer(file.content!);
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

    // Save diagnosis to database
    const diagnosis = await saveDiagnosis({
      plant_name: plantName,
      predictions: formattedPredictions,
      disease_name: disease.label || "Unknown",
      treatment: disease.description || "No treatment information available",
      image_path: imageUrl,
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
