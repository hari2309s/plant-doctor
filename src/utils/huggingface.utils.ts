import {
  getDiseaseTreatment,
  isValidDiseaseLabel,
  getLabel,
  DISEASE_LABELS,
} from "../models/disease.model.ts";
import {
  Prediction,
  EnhancedPrediction,
  ValidationResult,
} from "../services/huggingface.service.ts";

// Constants for validation thresholds
const CONFIDENCE_THRESHOLD = 0.6; // Min confidence to consider a prediction valid
const TOP_K_PREDICTIONS = 3; // Number of top predictions to check

// Consolidated pepper-related terms for consistent handling
const PEPPER_TERMS = ["pepper", "capsicum", "chili"];

// Consolidated non-plant terms
const NON_PLANT_TERMS = [
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
  "pot",
  "flowerpot",
  "person",
  "human",
];

/**
 * Helper function to classify an image with a specific model
 * @param imageBase64 Base64-encoded image data
 * @param modelId Hugging Face model ID to use for classification
 * @param maxRetries Maximum number of retry attempts
 * @param retryDelay Initial delay between retries in ms
 * @returns Array of predictions
 */
export async function classifyWithModel(
  imageBase64: string,
  modelId: string,
  apiKey: string,
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
            Authorization: `Bearer ${apiKey}`,
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

/**
 * Comprehensive plant image validation using multiple methods
 * @param imageBase64 Base64-encoded image data
 * @param generalModelId ID of the general image classification model
 * @param plantModelId ID of the plant-specific classification model
 * @param maxRetries Maximum number of retry attempts
 * @param retryDelay Initial delay between retries in ms
 * @returns Object with validation result, reason, and identified plant type
 */
export async function validatePlantImageComprehensive(
  imageBase64: string,
  generalModelId: string,
  plantModelId: string,
  apiKey: string,
  maxRetries: number,
  retryDelay: number
): Promise<ValidationResult> {
  try {
    // Step 1: Use general model for initial classification
    const generalClassification = await classifyWithModel(
      imageBase64,
      generalModelId,
      apiKey,
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

    // Check general classification for non-plant objects
    const generalValidationResult = validateGeneralClassification(
      generalClassification
    );
    if (!generalValidationResult.isValid) {
      return generalValidationResult;
    }

    // Get plant type from general classification if available
    const plantFromGeneralClassification = getPlantTypeFromClassification(
      generalClassification
    );
    if (plantFromGeneralClassification) {
      return plantFromGeneralClassification;
    }

    // Step 4: If no general model plant matches, use plant-specific model for secondary validation
    const plantSpecificClassification = await classifyWithModel(
      imageBase64,
      plantModelId,
      apiKey,
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

    // Get plant type from plant-specific classification
    const plantFromSpecificClassification = getPlantTypeFromClassification(
      plantSpecificClassification
    );
    if (plantFromSpecificClassification) {
      return plantFromSpecificClassification;
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
 * Validates general classification results to check for non-plant objects
 * @param generalClassification The classification results to validate
 * @returns Validation result indicating if a non-plant was detected
 */
function validateGeneralClassification(
  generalClassification: Prediction[]
): ValidationResult {
  // Check if top predictions contain any non-plant exclusion categories with high confidence
  const topNonPlantMatch = generalClassification
    .slice(0, TOP_K_PREDICTIONS)
    .find((pred) => {
      const label = pred.label.toLowerCase();

      // Check if the prediction contains non-plant exclusion terms
      const containsExclusionCategory = NON_PLANT_EXCLUSION_CATEGORIES.some(
        (category) => label.includes(category)
      );

      // Check for specific problematic terms
      const containsNonPlantTerm = NON_PLANT_TERMS.some(
        (term) =>
          label.includes(term) &&
          // Check that the label isn't actually a plant with one of these terms
          !label.match(/^(healthy|diseased)\s+\w+/)
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

  return { isValid: true };
}

/**
 * Tries to extract a plant type from classification results
 * @param classification The classification results to extract plant type from
 * @returns Validation result with plant type if found, null otherwise
 */
function getPlantTypeFromClassification(
  classification: Prediction[]
): ValidationResult | null {
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
    "capsicum",
    "chili",
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

  const topPlantMatches = classification
    .slice(0, TOP_K_PREDICTIONS)
    .filter((pred) => {
      const label = pred.label.toLowerCase();

      // Check if it's a healthy plant pattern (e.g., "Healthy tomato")
      const isHealthyPlantPattern = label.match(/^healthy\s+(\w+)$/);
      if (isHealthyPlantPattern) {
        const plantName = isHealthyPlantPattern[1];
        // Make sure this is a known plant and not something like "Healthy beetle"
        return !NON_PLANT_TERMS.includes(plantName);
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
      const containsNonPlantTerm = NON_PLANT_TERMS.some((term) =>
        label.includes(term)
      );

      return (
        (inPlantCategories || containsPlantKeyword) && !containsNonPlantTerm
      );
    });

  // If we have any plant matches in top predictions, use the highest confidence one
  if (topPlantMatches.length > 0) {
    // Sort by confidence score and take the highest
    const bestPlantMatch = topPlantMatches.sort((a, b) => b.score - a.score)[0];

    // Extract and clean the plant type
    const plantType = extractPlantTypeFromLabel(bestPlantMatch.label);

    return {
      isValid: true,
      plantType: plantType,
      confidence: bestPlantMatch.score,
    };
  }

  return null;
}

/**
 * Extracts a clean plant type from a prediction label
 * @param label The prediction label to extract plant type from
 * @returns Cleaned plant type string
 */
function extractPlantTypeFromLabel(label: string): string {
  // Extract the plant type from the label, handling formats like "Healthy tomato leaf"
  let plantType = label.split(",")[0].trim();

  // Remove "healthy" prefix if present
  plantType = plantType.replace(/^healthy\s+/i, "");

  // Remove common suffixes like "leaf", "plant", etc.
  const suffixesToRemove = [" leaf", " plant", " tree", " flower", " fruit"];

  for (const suffix of suffixesToRemove) {
    if (plantType.toLowerCase().endsWith(suffix)) {
      plantType = plantType.substring(0, plantType.length - suffix.length);
      break;
    }
  }

  // Special handling for pepper types
  if (isPepperType(plantType)) {
    plantType = "Bell Pepper";
  }

  return plantType;
}

/**
 * Helper function to check if a label refers to any pepper type
 * @param label The label to check
 * @returns True if the label refers to any pepper type
 */
function isPepperType(label: string): boolean {
  const normalizedLabel = label.toLowerCase();
  return PEPPER_TERMS.some((term) => normalizedLabel.includes(term));
}

/**
 * Checks if a label indicates a bacterial disease
 * @param label The label to check
 * @returns True if the label indicates bacterial disease
 */
function hasBacterialDisease(label: string): boolean {
  const normalizedLabel = label.toLowerCase();
  return (
    normalizedLabel.includes("bacterial") ||
    normalizedLabel.includes("spot") ||
    normalizedLabel.includes("blight") ||
    normalizedLabel.includes("lesion")
  );
}

/**
 * Enhances a prediction with treatment information and formatted label
 * @param prediction The raw prediction from the Hugging Face API
 * @returns Enhanced prediction with treatment information and formatted label
 */
export function enhancePrediction(prediction: Prediction): EnhancedPrediction {
  const enhancedPrediction: EnhancedPrediction = {
    ...prediction,
    formattedLabel: prediction.label,
  };

  // Special handling for pepper labels
  const normalizedLabel = prediction.label.toLowerCase();
  if (isPepperType(normalizedLabel)) {
    // Determine if there's a disease mentioned
    if (
      hasBacterialDisease(normalizedLabel) &&
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
export function findClosestDiseaseLabel(label: string): string | undefined {
  // Convert the label to lowercase for case-insensitive matching
  const lowerLabel = label.toLowerCase();

  // Look for exact matches first
  const exactMatch = DISEASE_LABELS.find(
    (diseaseLabel: string) => diseaseLabel.toLowerCase() === lowerLabel
  );
  if (exactMatch) return exactMatch;

  // Improved pepper handling
  // Check for any pepper-related terms
  if (isPepperType(lowerLabel)) {
    // Check if the label indicates bacterial disease
    if (hasBacterialDisease(lowerLabel)) {
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
export function findClosestPlantType(plantType: string): string | undefined {
  // Extract unique plant types from DISEASE_LABELS
  const knownPlantTypes: string[] = Array.from(
    new Set(DISEASE_LABELS.map((label: string) => label.split("___")[0]))
  );

  // Convert the plant type to lowercase for case-insensitive matching
  const lowerPlantType = plantType.toLowerCase();

  // Special handling for pepper variants
  if (isPepperType(lowerPlantType)) {
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
export function extractPlantTypesFromPredictions(
  predictions: Prediction[]
): string[] {
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

    // Improved handling for bell pepper format
    const pepperMatch = label.match(/^pepper,_bell___(.+)$/);
    if (pepperMatch) {
      plantTypes.add("bell pepper");
      return;
    }

    // Match when the label contains "pepper" in any form
    if (isPepperType(label)) {
      plantTypes.add("pepper");
      return;
    }

    // Other patterns can be added as needed
  });

  return Array.from(plantTypes);
}

// Expanded list of plant-related categories
const PLANT_CATEGORIES = [
  // General plant terms
  "plant",
  "flower",
  "tree",
  "leaf",
  "vegetable",
  "fruit",
  "grass",
  "herb",
  "bush",
  "forest",
  "garden",
  "crop",
  "seedling",
  "sprout",
  "blossom",
  "branch",
  "stem",
  "root",
  "bud",
  "petal",
  "flora",
  "foliage",
  "greenery",
  "vegetation",
  "botany",
  "horticulture",
  "agricultural",
  "vine",
  "shrub",
  "succulent",

  // Tree types
  "pine",
  "oak",
  "maple",
  "birch",
  "willow",
  "cedar",
  "cypress",
  "elm",
  "fir",
  "palm",
  "spruce",
  "aspen",
  "beech",
  "ash",
  "hickory",
  "poplar",
  "redwood",
  "sequoia",
  "chestnut",
  "walnut",
  "olive",
  "mahogany",
  "cherry",
  "juniper",
  "eucalyptus",
  "sycamore",
  "baobab",
  "yew",
  "hemlock",
  "larch",
  "bamboo",

  // Flowers
  "rose",
  "tulip",
  "daisy",
  "sunflower",
  "orchid",
  "lily",
  "daffodil",
  "iris",
  "peony",
  "chrysanthemum",
  "carnation",
  "pansy",
  "violet",
  "dahlia",
  "marigold",
  "poppy",
  "hibiscus",
  "geranium",
  "magnolia",
  "lavender",
  "jasmine",
  "primrose",
  "begonia",
  "gardenia",
  "azalea",
  "hydrangea",
  "zinnia",
  "snapdragon",
  "aster",

  // Fruits
  "apple",
  "orange",
  "banana",
  "strawberry",
  "blueberry",
  "raspberry",
  "blackberry",
  "grape",
  "watermelon",
  "pineapple",
  "mango",
  "peach",
  "pear",
  "plum",
  "cherry",
  "kiwi",
  "lemon",
  "lime",
  "avocado",
  "fig",
  "pomegranate",
  "apricot",
  "papaya",
  "guava",
  "coconut",
  "cranberry",
  "grapefruit",
  "lychee",
  "passion fruit",

  // Vegetables
  "lettuce",
  "cabbage",
  "broccoli",
  "cauliflower",
  "carrot",
  "potato",
  "tomato",
  "cucumber",
  "eggplant",
  "onion",
  "garlic",
  "radish",
  "spinach",
  "kale",
  "celery",
  "bell pepper",
  "pea",
  "bean",
  "corn",
  "squash",
  "zucchini",
  "pumpkin",
  "asparagus",
  "sweet potato",
  "artichoke",
  "beet",
  "turnip",
  "brussels sprout",
  "leek",

  // Herbs and spices
  "basil",
  "oregano",
  "thyme",
  "rosemary",
  "mint",
  "sage",
  "cilantro",
  "parsley",
  "dill",
  "chive",
  "coriander",
  "tarragon",
  "marjoram",
  "fennel",
  "turmeric",
  "ginger",
  "cinnamon",
  "cumin",
  "cardamom",
  "saffron",
  "vanilla",
  "peppermint",

  // Cacti and succulents
  "cactus",
  "aloe",
  "agave",
  "jade plant",
  "echeveria",
  "haworthia",
  "sedum",
  "sempervivum",
  "euphorbia",
  "kalanchoe",
  "aeonium",
  "opuntia",
  "prickly pear",
  "barrel cactus",
  "saguaro",
  "christmas cactus",
  "snake plant",
  "zebra plant",

  // Ferns and mosses
  "fern",
  "moss",
  "algae",
  "lichen",
  "liverwort",
  "hornwort",
  "maidenhair fern",
  "staghorn fern",
  "bracken",
  "ostrich fern",
  "lady fern",
  "sphagnum",
  "peat moss",

  // Grains and cereals
  "wheat",
  "rice",
  "barley",
  "oat",
  "rye",
  "corn",
  "millet",
  "sorghum",
  "quinoa",
  "buckwheat",
  "amaranth",
  "spelt",
  "maize",
  "bulgur",
  "couscous",
  "cereal",

  // Legumes
  "lentil",
  "chickpea",
  "soybean",
  "peanut",
  "bean",
  "pea",
  "alfalfa",
  "clover",
  "lupin",
  "vetch",
  "fava bean",
  "lima bean",
  "green bean",
  "kidney bean",

  // Ornamental plants
  "philodendron",
  "monstera",
  "pothos",
  "fiddle leaf fig",
  "peace lily",
  "ficus",
  "spider plant",
  "rubber plant",
  "boston fern",
  "dieffenbachia",
  "anthurium",
  "schefflera",
  "areca palm",
  "dracaena",
  "calathea",
  "zz plant",
  "prayer plant",
  "croton",
  "ivy",
  "wandering jew",
  "snake plant",
  "ponytail palm",
  "african violet",

  // Plant parts
  "stamen",
  "pistil",
  "pollen",
  "nectar",
  "sepal",
  "stigma",
  "style",
  "ovary",
  "anther",
  "filament",
  "pedicel",
  "peduncle",
  "inflorescence",
  "rhizome",
  "tuber",
  "bulb",
  "corm",
  "tendril",
  "thorn",
  "stolon",
  "runner",
  "offshoot",
  "frond",

  // Plant families
  "rosaceae",
  "fabaceae",
  "asteraceae",
  "poaceae",
  "orchidaceae",
  "brassicaceae",
  "lamiaceae",
  "solanaceae",
  "apiaceae",
  "cucurbitaceae",
  "rutaceae",
  "malvaceae",
  "pinaceae",
  "arecaceae",
  "lauraceae",
  "euphorbiaceae",
  "araceae",
  "cactaceae",

  // Aquatic plants
  "seaweed",
  "water lily",
  "lotus",
  "duckweed",
  "water hyacinth",
  "cattail",
  "reed",
  "bulrush",
  "mangrove",
  "kelp",
  "pondweed",
  "water fern",
  "eelgrass",
  "hydrilla",
  "water lettuce",
  "bladderwort",
  "hornwort",
];

// Non-plant categories that should be rejected
const NON_PLANT_EXCLUSION_CATEGORIES = [
  "person",
  "human",
  "man",
  "woman",
  "child",
  "boy",
  "girl",
  "animal",
  "dog",
  "cat",
  "bird",
  "horse",
  "cow",
  "sheep",
  "goat",
  "pig",
  "elephant",
  "bear",
  "zebra",
  "giraffe",
  "building",
  "vehicle",
  "car",
  "truck",
  "boat",
  "airplane",
  "furniture",
  "table",
  "chair",
  "bed",
  "couch",
  "electronic",
  "computer",
  "phone",
  "food",
  "drink",
  "clothing",
  "accessory",
  "pot",
  "flowerpot",
];
