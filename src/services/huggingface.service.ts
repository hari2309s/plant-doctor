import { config } from "@/utils/config.ts";

const HF_API_KEY = config.HUGGING_FACE_API_KEY;
const HF_MODEL_ID = config.HUGGING_FACE_MODEL_ID;

/**
 * Calls the Hugging Face Inference API to get predictions for a plant disease image
 * @param imageBase64 Base64-encoded image data
 * @returns Array of predictions
 */
export async function getPredictionFromHuggingFace(imageBase64: string) {
  if (!HF_API_KEY) {
    throw new Error(
      "Hugging Face API key is required. Set HUGGING_FACE_API_KEY in environment variables."
    );
  }

  try {
    // Call the Hugging Face inference API directly with the model ID from the specified repository
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL_ID}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Hugging Face API error (${response.status}): ${error}`);
    }

    // Process the response from the model
    const result = await response.json();

    // Format the response based on the model's output structure
    // The microsoft/resnet-50 model returns an array of predictions
    return result;
  } catch (error) {
    console.error("Error predicting plant disease:", error);
    throw error;
  }
}
