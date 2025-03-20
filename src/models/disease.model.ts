// Disease labels based on the model's training data
export const DISEASE_LABELS = [
  "Apple___Apple_scab",
  "Apple___Black_rot",
  "Apple___Cedar_apple_rust",
  "Apple___healthy",
  "Blueberry___healthy",
  "Cherry___healthy",
  "Cherry___Powdery_mildew",
  "Corn___Cercospora_leaf_spot Gray_leaf_spot",
  "Corn___Common_rust",
  "Corn___healthy",
  "Corn___Northern_Leaf_Blight",
  "Grape___Black_rot",
  "Grape___Esca_(Black_Measles)",
  "Grape___healthy",
  "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
  "Orange___Haunglongbing_(Citrus_greening)",
  "Peach___Bacterial_spot",
  "Peach___healthy",
  "Pepper,_bell___Bacterial_spot",
  "Pepper,_bell___healthy",
  "Potato___Early_blight",
  "Potato___healthy",
  "Potato___Late_blight",
  "Raspberry___healthy",
  "Soybean___healthy",
  "Squash___Powdery_mildew",
  "Strawberry___healthy",
  "Strawberry___Leaf_scorch",
  "Tomato___Bacterial_spot",
  "Tomato___Early_blight",
  "Tomato___healthy",
  "Tomato___Late_blight",
  "Tomato___Leaf_Mold",
  "Tomato___Septoria_leaf_spot",
  "Tomato___Spider_mites Two-spotted_spider_mite",
  "Tomato___Target_Spot",
  "Tomato___Tomato_mosaic_virus",
  "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
];

// Disease treatment information
const TREATMENTS: Record<string, string> = {
  Apple___Apple_scab:
    "Apply fungicides preventatively in early spring before infection occurs. Remove and destroy fallen leaves to reduce fungal inoculum. Prune trees to improve air circulation. Select resistant apple varieties when planting new trees. Apply lime sulfur during dormant season.",

  Apple___Black_rot:
    "Prune out dead or diseased wood and remove mummified fruits. Apply fungicides during bud break and early growing season. Maintain tree vigor through proper fertilization and watering. Clean up fallen fruit and leaves around the tree. Ensure proper spacing between trees for adequate air circulation.",

  Apple___Cedar_apple_rust:
    "Remove nearby juniper/cedar trees if possible (alternate hosts). Apply preventative fungicides starting at pink bud stage. Select resistant apple varieties. Continue fungicide applications every 7-10 days during spring season. Avoid overhead irrigation to reduce leaf wetness periods.",

  Apple___healthy:
    "Regular pruning to maintain tree structure and air flow. Balanced fertilization program based on soil test results. Proper watering, avoiding overwatering. Regular monitoring for early signs of pests and diseases. Mulch around trees (keeping mulch away from trunk).",

  Blueberry___healthy:
    "Maintain soil pH between 4.5-5.5. Apply acidic mulch like pine needles or sawdust. Provide adequate spacing between plants. Prune annually to remove old canes and maintain productivity. Follow recommended fertilization schedule for blueberries.",

  Cherry___Powdery_mildew:
    "Apply fungicides at first sign of infection. Prune to improve air circulation. Apply potassium bicarbonate or sulfur-based products. Avoid excessive nitrogen fertilization. Remove and destroy infected plant parts.",

  Cherry___healthy:
    "Regular pruning during dormant season. Balanced fertilization program. Adequate irrigation, particularly during fruit development. Monitor for signs of pests and diseases. Apply dormant oil spray to control overwintering pests.",

  "Corn___Cercospora_leaf_spot Gray_leaf_spot":
    "Plant resistant hybrids. Crop rotation with non-host crops. Fungicide applications at early tasseling stage. Tillage to reduce crop residue when appropriate. Avoid late planting dates.",

  Corn___Common_rust:
    "Plant resistant corn varieties. Early planting to avoid peak rust season. Apply foliar fungicides when disease pressure is high. Monitor fields regularly during growing season. Balanced fertilization to promote plant health.",

  Corn___Northern_Leaf_Blight:
    "Plant resistant hybrids. Crop rotation with non-host crops. Apply fungicides when disease first appears. Proper field drainage. Avoid excessive nitrogen application.",

  Corn___healthy:
    "Proper seed spacing and planting depth. Regular soil testing and balanced fertilization. Timely irrigation during critical growth stages. Weed management to reduce competition. Scout regularly for early detection of issues.",

  Grape___Black_rot:
    "Apply fungicides starting at bud break. Remove mummified berries and infected leaves. Prune to improve air circulation. Control weeds around vines. Clean up fallen debris after harvest.",

  "Grape___Esca_(Black_Measles)":
    "No effective chemical treatments for established infections. Remove and destroy infected vines. Protect pruning cuts with fungicide paste. Avoid pruning during wet weather. Maintain vine vigor with proper nutrition.",

  "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)":
    "Apply protective fungicides early in the growing season. Improve air circulation through canopy management. Avoid overhead irrigation. Remove infected leaves. Maintain balanced nutrition.",

  Grape___healthy:
    "Regular pruning for proper canopy management. Balanced fertilization based on soil tests. Water management to avoid drought stress. Weed control around vines. Regular monitoring for early disease detection.",

  "Orange___Haunglongbing_(Citrus_greening)":
    "No cure currently available; management practices focus on prevention. Control Asian citrus psyllid (vector) with approved insecticides. Remove and destroy infected trees to prevent spread. Plant disease-free certified nursery stock. Maintain tree vigor through proper nutrition and irrigation.",

  Peach___Bacterial_spot:
    "Apply copper-based bactericides during dormant season. Continue applications during early growing season. Plant resistant varieties. Prune during dry weather to reduce spread. Avoid overhead irrigation.",

  Peach___healthy:
    "Annual pruning to maintain open canopy. Regular fertilization program based on soil tests. Thin fruit to improve size and quality. Apply dormant sprays for pest control. Monitor for signs of disease and pest issues.",

  "Pepper,_bell___Bacterial_spot":
    "Apply copper-based bactericides early in the season. Crop rotation (3-4 year cycle). Use disease-free seed and transplants. Avoid working in fields when plants are wet. Remove and destroy infected plants.",

  "Pepper,_bell___healthy":
    "Regular balanced fertilization. Consistent watering, avoiding leaf wetness. Mulch to maintain soil moisture and reduce weeds. Support plants with stakes or cages. Monitor for pests and diseases regularly.",

  Potato___Early_blight:
    "Apply fungicides preventatively before disease appears. Practice crop rotation (3-4 year cycle). Plant certified disease-free seed potatoes. Proper hilling to cover tubers adequately. Avoid overhead irrigation.",

  Potato___Late_blight:
    "Apply protective fungicides before disease appears. Monitor weather conditions for blight-favorable periods. Destroy volunteer potatoes and nightshade weeds. Plant certified disease-free seed potatoes. Increase plant spacing to improve air circulation.",

  Potato___healthy:
    "Plant certified seed potatoes. Proper hilling during growth. Regular balanced fertilization. Adequate irrigation, especially during tuber formation. Harvest when mature and store properly.",

  Raspberry___healthy:
    "Prune out old canes after fruiting. Thin new canes to improve air circulation. Apply balanced fertilization in spring. Proper trellising to keep fruit off ground. Mulch to maintain soil moisture and reduce weeds.",

  Soybean___healthy:
    "Crop rotation with non-legume crops. Plant high-quality seeds at proper depth and spacing. Scout fields regularly for early disease detection. Apply appropriate fertilization based on soil tests. Consider seed treatments for early season protection.",

  Squash___Powdery_mildew:
    "Apply fungicides at first signs of disease. Plant resistant varieties when available. Space plants properly for good air circulation. Apply potassium bicarbonate or neem oil as organic options. Avoid overhead irrigation.",

  Strawberry___Leaf_scorch:
    "Remove infected leaves. Apply fungicides during early growth stage. Practice crop rotation. Use drip irrigation instead of overhead watering. Plant resistant varieties when available.",

  Strawberry___healthy:
    "Renew plantings every 3-4 years. Apply balanced fertilization. Mulch around plants to reduce soil splashing. Provide proper spacing between plants. Remove runners as needed to maintain plant vigor.",

  Tomato___Bacterial_spot:
    "Apply copper-based bactericides early in the season. Practice crop rotation (3-4 year cycle). Avoid working with plants when wet. Use disease-free seed and transplants. Remove and destroy infected plants.",

  Tomato___Early_blight:
    "Apply fungicides preventatively. Mulch around plants to prevent soil splash. Remove lower leaves showing infection. Stake or cage plants to improve air circulation. Practice crop rotation.",

  Tomato___Late_blight:
    "Apply protective fungicides before disease appears. Remove and destroy infected plants immediately. Avoid overhead irrigation and working with wet plants. Increase spacing between plants. Plant resistant varieties when available.",

  Tomato___Leaf_Mold:
    "Improve greenhouse ventilation. Reduce humidity levels. Apply fungicides when disease pressure is high. Space plants adequately. Remove and destroy infected leaves.",

  Tomato___Septoria_leaf_spot:
    "Apply fungicides at first sign of disease. Practice crop rotation. Mulch around plants. Remove infected leaves. Avoid overhead irrigation.",

  "Tomato___Spider_mites Two-spotted_spider_mite":
    "Apply miticides or insecticidal soap. Increase humidity (mites prefer dry conditions). Introduce predatory mites as biological control. Strong water spray to knock mites off plants. Remove heavily infested plants.",

  Tomato___Target_Spot:
    "Apply fungicides preventatively. Prune to improve air circulation. Stake plants to keep foliage off ground. Mulch around plants. Remove infected leaves.",

  Tomato___Tomato_mosaic_virus:
    "No cure available; prevention is key. Remove and destroy infected plants. Disinfect tools between plants. Control aphids that can spread the virus. Plant resistant varieties. Wash hands after handling tobacco products before working with tomatoes.",

  Tomato___Tomato_Yellow_Leaf_Curl_Virus:
    "Control whitefly vectors with appropriate insecticides. Use reflective mulch to repel whiteflies. Remove and destroy infected plants. Plant resistant varieties. Use insect netting in small gardens.",

  Tomato___healthy:
    "Regular balanced fertilization. Consistent watering at soil level. Proper staking or caging. Mulch around plants. Regular monitoring for early disease detection. Proper pruning to improve air circulation.",
};

/**
 * Get treatment information for a specific plant disease
 * @param disease The disease label
 * @returns Treatment information as a string
 */
export function getDiseaseTreatment(disease: string): string {
  return (
    TREATMENTS[disease] ||
    "Consult with a local agricultural extension for treatment recommendations."
  );
}

/**
 * Check if a disease label is valid
 * @param disease The disease label to check
 * @returns True if the disease label is valid
 */
export function isValidDiseaseLabel(disease: string): boolean {
  return DISEASE_LABELS.includes(disease);
}

/**
 * Convert disease label to human-readable format
 * @param diseaseLabel The raw disease label from the model
 * @returns A formatted, human-readable string
 */
export function getLabel(diseaseLabel: string): string {
  if (!diseaseLabel) return "";

  // Split the label by the separator
  const parts = diseaseLabel.split("___");
  if (parts.length !== 2) return diseaseLabel;

  // Extract plant and condition
  let plant = parts[0].replace(/_/g, " ");
  let condition = parts[1].replace(/_/g, " ");

  // Handle special cases
  if (plant === "Pepper, bell") plant = "Bell Pepper";

  // Format "healthy" condition differently
  if (condition.toLowerCase() === "healthy") {
    return `Healthy ${plant}`;
  }

  // Handle special case for Spider mites
  if (condition.includes("Spider mites")) {
    condition = condition.replace("Spider mites ", "Spider Mites - ");
  }

  // Handle parentheses in condition names
  condition = condition.replace(/\(([^)]+)\)/g, "- $1");

  // Capitalize each word
  const capitalize = (str: string): string => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  plant = capitalize(plant);
  condition = capitalize(condition);

  return `${plant} - ${condition}`;
}

/**
 * Group disease labels by plant type
 * @returns An object with plant types as keys and arrays of disease labels as values
 */
export function getDiseasesByPlant(): Record<string, string[]> {
  const diseasesByPlant: Record<string, string[]> = {};

  DISEASE_LABELS.forEach((label) => {
    const parts = label.split("___");
    if (parts.length !== 2) return;

    const plant = parts[0];

    if (!diseasesByPlant[plant]) {
      diseasesByPlant[plant] = [];
    }

    diseasesByPlant[plant].push(label);
  });

  return diseasesByPlant;
}
