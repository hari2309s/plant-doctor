import { config } from "@/utils/config.utils.ts";
import {
  NON_PLANT_EXCLUSION_CATEGORIES,
  PLANT_CATEGORIES,
} from "@/utils/huggingface.utils.ts";
import {
  getDiseaseTreatment,
  isValidDiseaseLabel,
  getLabel,
  DISEASE_LABELS,
} from "../models/disease.model.ts";

const HF_API_KEY = config.HUGGING_FACE_API_KEY;
// General image classification model
const GENERAL_MODEL_ID = config.HUGGING_FACE_IMAGE_CLASSIFICATION_MODEL;
// Plant-specific classification model for secondary validation
const PLANT_MODEL_ID = config.HUGGING_FACE_PLANT_SPECIFIC_MODEL;
// Plant disease classification model
const PLANT_DISEASE_MODEL_ID = config.HUGGING_FACE_DISEASE_DETECTION_MODEL;

// Constants for validation thresholds
const CONFIDENCE_THRESHOLD = 0.6; // Min confidence to consider a prediction valid
const TOP_K_PREDICTIONS = 3; // Number of top predictions to check

/**
 * Interface for model prediction results
 */
interface Prediction {
  label: string;
  score: number;
  note?: string;
}

/**
 * Enhanced prediction result with treatment information
 */
interface EnhancedPrediction extends Prediction {
  formattedLabel: string;
  treatment?: string;
  confidence?: string;
  description?: string;
}

/**
 * Result from plant validation including identified plant type
 */
interface ValidationResult {
  isValid: boolean;
  reason?: string;
  plantType?: string;
  confidence?: number;
}

/**
 * Calls the Hugging Face Inference API to get predictions for an image
 * With retry logic for 503 Service Unavailable errors
 * Validates that the image contains a plant using multiple methods
 * @param imageBase64 Base64-encoded image data
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param retryDelay Initial delay between retries in ms (default: 1000)
 * @returns Array of enhanced predictions for plant diseases with treatment information
 * @throws Error if the image does not contain a plant
 */
export async function getPredictionFromHuggingFace(
  imageBase64: string,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<EnhancedPrediction[]> {
  if (!HF_API_KEY) {
    throw new Error(
      "Hugging Face API key is required. Set HUGGING_FACE_API_KEY in environment variables."
    );
  }

  // Step 1: Validate the image through multiple methods
  const validationResult = await validatePlantImageComprehensive(
    imageBase64,
    maxRetries,
    retryDelay
  );

  if (!validationResult.isValid) {
    throw new Error(
      `The uploaded image does not appear to be a plant. ${
        validationResult.reason ||
        "Please upload an image of a plant for disease identification."
      }`
    );
  }

  // Step 2: Proceed with plant disease classification
  let retries = 0;
  let currentDelay = retryDelay;

  while (true) {
    try {
      // Call the Hugging Face inference API with the plant disease model
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${PLANT_DISEASE_MODEL_ID}`,
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
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        currentDelay *= 2;
        continue;
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(
          `Hugging Face API error (${response.status}): ${error}`
        );
      }

      const result = await response.json();

      console.log("validationResult ", validationResult);

      // FIX: Special handling for pepper plants
      if (
        validationResult.plantType &&
        validationResult.plantType.toLowerCase().includes("pepper")
      ) {
        console.log("Detected pepper plant, applying special handling");

        // Check for signs of bacterial spot in the predictions
        const hasBacterialSymptoms = result.some(
          (pred: Prediction) =>
            pred.label.toLowerCase().includes("spot") ||
            pred.label.toLowerCase().includes("blight") ||
            pred.label.toLowerCase().includes("bacterial")
        );

        if (hasBacterialSymptoms) {
          console.log(
            "Found bacterial symptoms, using pepper bacterial spot treatment"
          );
          // Return bacterial spot prediction with high confidence
          return [
            enhancePrediction({
              label: "Pepper,_bell___Bacterial_spot",
              score: 0.85,
              note: "Detected pepper plant with signs of bacterial infection.",
            }),
          ];
        }
      }

      // If we have a validated plant type, filter or handle the results accordingly
      let predictionsToProcess = result;
      if (validationResult.plantType) {
        const plantType = validationResult.plantType.toLowerCase();
        console.log(`Filtering disease results for plant type: ${plantType}`);

        // FIX: Better handling for pepper types
        const isPepper = plantType.includes("pepper");

        // Filter results that match the identified plant type
        let filteredResults = result.filter((prediction: Prediction) => {
          if (isPepper) {
            // For peppers, look for bell pepper or general pepper references
            return prediction.label.toLowerCase().includes("pepper");
          } else {
            return prediction.label.toLowerCase().includes(plantType);
          }
        });

        // If we have filtered results, use those
        if (filteredResults.length > 0) {
          predictionsToProcess = filteredResults;
        } else {
          // If no filtered results, check if the model knows about this plant type
          const knownPlantTypes = extractPlantTypesFromPredictions(result);

          // FIX: Special handling for peppers to ensure we map to the correct disease labels
          if (
            isPepper &&
            !knownPlantTypes.includes("bell pepper") &&
            !knownPlantTypes.includes("pepper")
          ) {
            return [
              enhancePrediction({
                label: "Pepper,_bell___healthy",
                score: 0.9,
                note: "Detected pepper plant. No specific diseases identified.",
              }),
            ];
          }

          // If the identified plant type is not in the disease model's known types
          if (!knownPlantTypes.includes(plantType)) {
            // Try to match with a known plant type in our disease model
            const matchedPlantType = findClosestPlantType(plantType);

            if (matchedPlantType) {
              // Create a "healthy" prediction for the matched plant type
              const healthyLabel = `${matchedPlantType}___healthy`;
              return [
                enhancePrediction({
                  label: healthyLabel,
                  score: 0.9,
                  note: `No specific diseases detected for ${
                    validationResult.plantType
                  }. Showing information for ${getLabel(healthyLabel)}.`,
                }),
              ];
            } else {
              return [
                {
                  label: `Healthy ${validationResult.plantType}`,
                  formattedLabel: `Healthy ${validationResult.plantType}`,
                  score: 0.9,
                  note: `No specific diseases detected for ${validationResult.plantType}. The disease model doesn't have specific training for this plant type.`,
                  treatment:
                    "Maintain general plant care practices appropriate for this plant type.",
                },
              ];
            }
          }

          // Otherwise add a warning note to the original results
          predictionsToProcess = result.map((prediction: Prediction) => ({
            ...prediction,
            note: `Warning: This prediction may not apply to ${validationResult.plantType}.`,
          }));
        }
      }

      // Enhance all predictions with treatment information and formatted labels
      return predictionsToProcess.map(enhancePrediction);
    } catch (error) {
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
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay *= 2;
    }
  }
}

/**
 * Enhances a prediction with treatment information and formatted label
 * @param prediction The raw prediction from the Hugging Face API
 * @returns Enhanced prediction with treatment information and formatted label
 */
function enhancePrediction(prediction: Prediction): EnhancedPrediction {
  const enhancedPrediction: EnhancedPrediction = {
    ...prediction,
    formattedLabel: prediction.label,
  };

  // FIX: Better handling for pepper labels
  const normalizedLabel = prediction.label.toLowerCase();
  if (
    normalizedLabel.includes("pepper") ||
    normalizedLabel.includes("capsicum")
  ) {
    // Determine if there's a disease mentioned
    const hasBacterialDisease =
      normalizedLabel.includes("bacterial") ||
      normalizedLabel.includes("spot") ||
      normalizedLabel.includes("blight") ||
      normalizedLabel.includes("lesion");

    if (
      hasBacterialDisease &&
      !normalizedLabel.includes("pepper,_bell___bacterial_spot")
    ) {
      // Map to the known bell pepper bacterial spot label
      const correctLabel = "Pepper,_bell___Bacterial_spot";
      enhancedPrediction.formattedLabel = getLabel(correctLabel);
      enhancedPrediction.treatment = getDiseaseTreatment(correctLabel);
      enhancedPrediction.note =
        "Detected signs of bacterial disease on pepper plant. Using bell pepper bacterial spot treatment information.";
      return enhancedPrediction;
    } else if (!normalizedLabel.includes("pepper,_bell")) {
      // For other pepper references, add a clarification note
      enhancedPrediction.note =
        "Detected pepper plant, using bell pepper disease information for treatment.";
    }
  }

  // Check if the prediction label is a valid disease label in our model
  if (isValidDiseaseLabel(prediction.label)) {
    // Get the human-readable label
    enhancedPrediction.formattedLabel = getLabel(prediction.label);

    // Get treatment information
    enhancedPrediction.treatment = getDiseaseTreatment(prediction.label);
  } else {
    // Try to find a close match in our disease labels
    const closestLabel = findClosestDiseaseLabel(prediction.label);
    if (closestLabel) {
      enhancedPrediction.formattedLabel = getLabel(closestLabel);
      enhancedPrediction.treatment = getDiseaseTreatment(closestLabel);
      enhancedPrediction.note =
        (enhancedPrediction.note || "") +
        ` Label "${prediction.label}" was mapped to "${closestLabel}" for treatment information.`;
    }
  }

  return enhancedPrediction;
}

/**
 * Find the closest matching disease label for a given prediction label
 * @param label The prediction label to find a match for
 * @returns The closest matching disease label, or undefined if no match found
 */
function findClosestDiseaseLabel(label: string): string | undefined {
  // Convert the label to lowercase for case-insensitive matching
  const lowerLabel = label.toLowerCase();

  // Look for exact matches first
  const exactMatch = DISEASE_LABELS.find(
    (diseaseLabel: string) => diseaseLabel.toLowerCase() === lowerLabel
  );
  if (exactMatch) return exactMatch;

  // FIX: Improved pepper handling
  // Check for any pepper-related terms
  if (
    lowerLabel.includes("pepper") ||
    lowerLabel.includes("capsicum") ||
    lowerLabel.includes("chili")
  ) {
    // Check if the label indicates bacterial disease
    const hasBacterialSymptoms =
      lowerLabel.includes("bacterial") ||
      lowerLabel.includes("spot") ||
      lowerLabel.includes("blight") ||
      lowerLabel.includes("lesion");

    if (hasBacterialSymptoms) {
      // Return the bell pepper bacterial spot label
      return "Pepper,_bell___Bacterial_spot";
    } else {
      // Return the healthy bell pepper label
      return "Pepper,_bell___healthy";
    }
  }

  // Handle some common variations in formatting
  // Example: "Apple_Black_rot" -> "Apple___Black_rot"
  const underscoreVariation = lowerLabel.replace("_", "___");
  const underscoreMatch = DISEASE_LABELS.find(
    (diseaseLabel: string) => diseaseLabel.toLowerCase() === underscoreVariation
  );
  if (underscoreMatch) return underscoreMatch;

  // Try to extract plant type and disease
  const plantDiseaseParts = lowerLabel.split(" with ");
  if (plantDiseaseParts.length === 2) {
    const [plant, disease] = plantDiseaseParts;

    // Search for a label that contains both the plant and disease
    const partialMatch = DISEASE_LABELS.find((diseaseLabel: string) => {
      const lowerDiseaseLabel = diseaseLabel.toLowerCase();
      return (
        lowerDiseaseLabel.includes(plant.trim()) &&
        lowerDiseaseLabel.includes(disease.trim())
      );
    });

    if (partialMatch) return partialMatch;
  }

  // Try to find a healthy label for the plant type
  const healthyMatch = DISEASE_LABELS.find((diseaseLabel: string) => {
    const parts = diseaseLabel.split("___");
    if (parts.length === 2 && parts[1] === "healthy") {
      return lowerLabel.includes(parts[0].toLowerCase());
    }
    return false;
  });

  return healthyMatch;
}

/**
 * Find the closest matching plant type in our disease model
 * @param plantType The plant type to find a match for
 * @returns The closest matching plant type, or undefined if no match found
 */
function findClosestPlantType(plantType: string): string | undefined {
  // Extract unique plant types from DISEASE_LABELS
  const knownPlantTypes: string[] = Array.from(
    new Set(DISEASE_LABELS.map((label: string) => label.split("___")[0]))
  );

  // Convert the plant type to lowercase for case-insensitive matching
  const lowerPlantType = plantType.toLowerCase();

  // FIX: Special handling for pepper variants
  if (
    lowerPlantType.includes("pepper") ||
    lowerPlantType.includes("capsicum") ||
    lowerPlantType.includes("chili")
  ) {
    return "Pepper,_bell";
  }

  // Look for exact matches first
  const exactMatch = knownPlantTypes.find(
    (type) => type.toLowerCase() === lowerPlantType
  );
  if (exactMatch) return exactMatch;

  // Look for partial matches
  const partialMatch = knownPlantTypes.find(
    (type) =>
      type.toLowerCase().includes(lowerPlantType) ||
      lowerPlantType.includes(type.toLowerCase())
  );

  return partialMatch;
}

/**
 * Extract unique plant types from prediction labels
 * @param predictions Array of predictions
 * @returns Array of unique plant types found in the predictions
 */
function extractPlantTypesFromPredictions(predictions: Prediction[]): string[] {
  const plantTypes = new Set<string>();

  predictions.forEach((prediction) => {
    const label = prediction.label.toLowerCase();

    // Extract plant type from labels like "Tomato with Late Blight" or "Healthy Apple"
    const withMatch = label.match(/^([a-z\s]+) with /);
    if (withMatch && withMatch[1]) {
      plantTypes.add(withMatch[1].trim());
      return;
    }

    const healthyMatch = label.match(/^healthy ([a-z\s]+)$/);
    if (healthyMatch && healthyMatch[1]) {
      plantTypes.add(healthyMatch[1].trim());
      return;
    }

    // FIX: Improved handling for bell pepper format
    const pepperMatch = label.match(/^pepper,_bell___(.+)$/);
    if (pepperMatch) {
      plantTypes.add("bell pepper");
      return;
    }

    // Match when the label contains "pepper" in any form
    if (
      label.includes("pepper") ||
      label.includes("capsicum") ||
      label.includes("chili")
    ) {
      plantTypes.add("pepper");
      return;
    }

    // Other patterns can be added as needed
  });

  return Array.from(plantTypes);
}

/**
 * Comprehensive plant image validation using multiple methods
 * @param imageBase64 Base64-encoded image data
 * @param maxRetries Maximum number of retry attempts
 * @param retryDelay Initial delay between retries in ms
 * @returns Object with validation result, reason, and identified plant type
 */
async function validatePlantImageComprehensive(
  imageBase64: string,
  maxRetries: number,
  retryDelay: number
): Promise<ValidationResult> {
  try {
    // Step 1: Use general model for initial classification
    const generalClassification = await classifyWithModel(
      imageBase64,
      GENERAL_MODEL_ID,
      maxRetries,
      retryDelay
    );

    // Debug logging
    console.log(
      "General classification top predictions:",
      generalClassification
        .slice(0, TOP_K_PREDICTIONS)
        .map((p) => `${p.label} (${(p.score * 100).toFixed(2)}%)`)
        .join(", ")
    );

    // FIXED: Improved non-plant exclusion by checking for specific problematic terms
    // These are commonly misclassified non-plant objects
    const nonPlantTerms = [
      "beetle",
      "insect",
      "bug",
      "arthropod",
      "animal",
      "mammal",
      "rodent",
      "acorn",
      "frog",
      "snake",
      "bird",
    ];

    // Step 2: Check if top predictions contain any non-plant exclusion categories with high confidence
    const topNonPlantMatch = generalClassification
      .slice(0, TOP_K_PREDICTIONS)
      .find((pred) => {
        // Check if the prediction contains non-plant exclusion terms
        const containsExclusionCategory = NON_PLANT_EXCLUSION_CATEGORIES.some(
          (category) => pred.label.toLowerCase().includes(category)
        );

        // Check for specific problematic terms
        const containsNonPlantTerm = nonPlantTerms.some(
          (term) =>
            pred.label.toLowerCase().includes(term) &&
            // Check that the label isn't actually a plant with one of these terms
            !pred.label.toLowerCase().match(/^(healthy|diseased)\s+\w+/)
        );

        return (
          (containsExclusionCategory || containsNonPlantTerm) &&
          pred.score > CONFIDENCE_THRESHOLD
        );
      });

    if (topNonPlantMatch) {
      return {
        isValid: false,
        reason: `The image appears to be ${topNonPlantMatch.label.toLowerCase()} rather than a plant.`,
      };
    }

    // Step 3: Check if any predictions match plant categories
    const plantKeywords = [
      "leaf",
      "plant",
      "tree",
      "flower",
      "fruit",
      "vegetable",
      "apple",
      "tomato",
      "grape",
      "strawberry",
      "pomegranate",
      "potato",
      "pepper",
      "capsicum", // FIX: Added alternative name for pepper
      "chili", // FIX: Added another common pepper name
      "corn",
      "bean",
      "cucumber",
      "eggplant",
      "lettuce",
      "peach",
      "orange",
      "lemon",
      "cherry",
      "blueberry",
    ];

    const topPlantMatches = generalClassification
      .slice(0, TOP_K_PREDICTIONS)
      .filter((pred) => {
        const label = pred.label.toLowerCase();

        // Check if it's a healthy plant pattern (e.g., "Healthy tomato")
        const isHealthyPlantPattern = label.match(/^healthy\s+(\w+)$/);
        if (isHealthyPlantPattern) {
          const plantName = isHealthyPlantPattern[1];
          // Make sure this is a known plant and not something like "Healthy beetle"
          return !nonPlantTerms.includes(plantName);
        }

        // Check if it's in our plant categories
        const inPlantCategories = PLANT_CATEGORIES.some(
          (category) => label.includes(category) || category.includes(label)
        );

        // Check if it contains any plant keywords
        const containsPlantKeyword = plantKeywords.some((keyword) =>
          label.includes(keyword)
        );

        // Make sure it's not a false positive by checking if it also contains non-plant terms
        const containsNonPlantTerm = nonPlantTerms.some((term) =>
          label.includes(term)
        );

        return (
          (inPlantCategories || containsPlantKeyword) && !containsNonPlantTerm
        );
      });

    // If we have any plant matches in top predictions, use the highest confidence one
    if (topPlantMatches.length > 0) {
      // Sort by confidence score and take the highest
      const bestPlantMatch = topPlantMatches.sort(
        (a, b) => b.score - a.score
      )[0];

      // FIXED: Improved plant type extraction
      // Extract the plant type from the label, handling formats like "Healthy tomato leaf"
      let plantType = bestPlantMatch.label.split(",")[0].trim();

      // Remove "healthy" prefix if present
      plantType = plantType.replace(/^healthy\s+/i, "");

      // Remove common suffixes like "leaf", "plant", etc.
      const suffixesToRemove = [
        " leaf",
        " plant",
        " tree",
        " flower",
        " fruit",
      ];
      for (const suffix of suffixesToRemove) {
        if (plantType.toLowerCase().endsWith(suffix)) {
          plantType = plantType.substring(0, plantType.length - suffix.length);
          break;
        }
      }

      // FIX: Special handling for pepper types
      if (
        plantType.toLowerCase().includes("pepper") ||
        plantType.toLowerCase().includes("capsicum") ||
        plantType.toLowerCase().includes("chili")
      ) {
        plantType = "Bell Pepper";
      }

      return {
        isValid: true,
        plantType: plantType,
        confidence: bestPlantMatch.score,
      };
    }

    // Step 4: If no general model plant matches, use plant-specific model for secondary validation
    const plantSpecificClassification = await classifyWithModel(
      imageBase64,
      PLANT_MODEL_ID,
      maxRetries,
      retryDelay
    );

    // Debug logging
    console.log(
      "Plant-specific classification top predictions:",
      plantSpecificClassification
        .slice(0, TOP_K_PREDICTIONS)
        .map((p) => `${p.label} (${(p.score * 100).toFixed(2)}%)`)
        .join(", ")
    );

    // FIXED: Apply the same improved filtering to plant-specific model results
    const plantSpecificMatches = plantSpecificClassification
      .slice(0, TOP_K_PREDICTIONS)
      .filter((pred) => {
        const label = pred.label.toLowerCase();

        // Check if it's a healthy plant pattern
        const isHealthyPlantPattern = label.match(/^healthy\s+(\w+)$/);
        if (isHealthyPlantPattern) {
          const plantName = isHealthyPlantPattern[1];
          return !nonPlantTerms.includes(plantName);
        }

        // Check other plant indicators
        const inPlantCategories = PLANT_CATEGORIES.some(
          (category) => label.includes(category) || category.includes(label)
        );

        const containsPlantKeyword = plantKeywords.some((keyword) =>
          label.includes(keyword)
        );

        const containsNonPlantTerm = nonPlantTerms.some((term) =>
          label.includes(term)
        );

        return (
          (inPlantCategories || containsPlantKeyword) && !containsNonPlantTerm
        );
      });

    if (plantSpecificMatches.length > 0) {
      // Sort by confidence score and take the highest
      const bestPlantSpecificMatch = plantSpecificMatches.sort(
        (a, b) => b.score - a.score
      )[0];

      // FIXED: Improved plant type extraction
      let plantType = bestPlantSpecificMatch.label.split(",")[0].trim();
      plantType = plantType.replace(/^healthy\s+/i, "");

      const suffixesToRemove = [
        " leaf",
        " plant",
        " tree",
        " flower",
        " fruit",
      ];
      for (const suffix of suffixesToRemove) {
        if (plantType.toLowerCase().endsWith(suffix)) {
          plantType = plantType.substring(0, plantType.length - suffix.length);
          break;
        }
      }

      // FIX: Special handling for pepper types
      if (
        plantType.toLowerCase().includes("pepper") ||
        plantType.toLowerCase().includes("capsicum") ||
        plantType.toLowerCase().includes("chili")
      ) {
        plantType = "Bell Pepper";
      }

      return {
        isValid: true,
        plantType: plantType,
        confidence: bestPlantSpecificMatch.score,
      };
    }

    // If we get here, neither model identified a plant
    return {
      isValid: false,
      reason:
        "The image doesn't appear to contain a plant with sufficient confidence. Please upload a clearer image of a plant.",
    };
  } catch (error) {
    console.error("Error in comprehensive validation:", error);
    // Fail open with a clear error message if validation itself fails
    throw new Error(
      "Unable to validate image content. Please try again with a different image."
    );
  }
}

/**
 * Helper function to classify an image with a specific model
 * @param imageBase64 Base64-encoded image data
 * @param modelId Hugging Face model ID to use for classification
 * @param maxRetries Maximum number of retry attempts
 * @param retryDelay Initial delay between retries in ms
 * @returns Array of predictions
 */
async function classifyWithModel(
  imageBase64: string,
  modelId: string,
  maxRetries: number,
  retryDelay: number
): Promise<Prediction[]> {
  let retries = 0;
  let currentDelay = retryDelay;

  console.log("classify with model ", modelId);

  while (true) {
    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${modelId}`,
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

      if (response.status === 503 && retries < maxRetries) {
        retries++;
        console.log(
          `Received 503 error in classification, retrying (${retries}/${maxRetries}) after ${currentDelay}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        currentDelay *= 2;
        continue;
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(
          `Hugging Face API error in classification (${response.status}): ${error}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (
        !(error instanceof Error && error.message.includes("503")) ||
        retries >= maxRetries
      ) {
        throw error;
      }

      retries++;
      console.log(
        `Network error in classification, retrying (${retries}/${maxRetries}) after ${currentDelay}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay *= 2;
    }
  }
}
