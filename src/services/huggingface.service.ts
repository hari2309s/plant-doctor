import { config } from "@/utils/config.utils.ts";
const HF_API_KEY = config.HUGGING_FACE_API_KEY;
const HF_MODEL_ID = config.HUGGING_FACE_MODEL_ID;

/**
 * Calls the Hugging Face Inference API to get predictions for a plant disease image
 * With retry logic for 503 Service Unavailable errors
 * @param imageBase64 Base64-encoded image data
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param retryDelay Initial delay between retries in ms (default: 1000)
 * @returns Array of predictions
 */
export async function getPredictionFromHuggingFace(
  imageBase64: string,
  maxRetries: number = 3,
  retryDelay: number = 1000
) {
  if (!HF_API_KEY) {
    throw new Error(
      "Hugging Face API key is required. Set HUGGING_FACE_API_KEY in environment variables."
    );
  }

  let retries = 0;
  let currentDelay = retryDelay;

  while (true) {
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

      // Check specifically for 503 error to implement retry logic
      if (response.status === 503 && retries < maxRetries) {
        retries++;
        console.log(
          `Received 503 error, retrying (${retries}/${maxRetries}) after ${currentDelay}ms`
        );

        // Wait before retrying (with exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, currentDelay));

        // Implement exponential backoff by doubling the delay for next attempt
        currentDelay *= 2;

        // Continue to the next iteration of the loop
        continue;
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(
          `Hugging Face API error (${response.status}): ${error}`
        );
      }

      // Process the response from the model
      const result = await response.json();

      // Format the response based on the model's output structure
      // The microsoft/resnet-50 model returns an array of predictions
      return result;
    } catch (error) {
      // If we've already tried the maximum number of times or this isn't a 503 error
      // then throw the error
      if (
        !(error instanceof Error && error.message.includes("503")) ||
        retries >= maxRetries
      ) {
        console.error("Error predicting plant disease:", error);
        throw error;
      }

      retries++;
      console.log(
        `Network error, retrying (${retries}/${maxRetries}) after ${currentDelay}ms`
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, currentDelay));

      // Implement exponential backoff
      currentDelay *= 2;
    }
  }
}
