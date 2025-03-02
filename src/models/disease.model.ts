// Disease labels based on the model's training data
export const DISEASE_LABELS = [
  "Apple___Apple_scab",
  "Apple___Black_rot",
  "Apple___Cedar_apple_rust",
  "Apple___healthy",
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
  "Peach___Bacterial_spot",
  "Peach___healthy",
  "Pepper,_bell___Bacterial_spot",
  "Pepper,_bell___healthy",
  "Potato___Early_blight",
  "Potato___healthy",
  "Potato___Late_blight",
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
    "Apply fungicides early in the season. Prune and destroy infected leaves and branches.",
  Apple___Black_rot:
    "Remove mummified fruits, prune out dead wood, and apply appropriate fungicides.",
  Apple___Cedar_apple_rust:
    "Remove nearby cedar trees if possible. Apply fungicides in spring before infection occurs.",
  Apple___healthy: "Continue good cultural practices to maintain plant health.",
  Cherry___Powdery_mildew:
    "Apply sulfur-based fungicides. Improve air circulation by pruning.",
  "Corn___Cercospora_leaf_spot Gray_leaf_spot":
    "Rotate crops and apply recommended fungicides.",
  Corn___Common_rust:
    "Apply fungicides if infection is severe. Plant resistant varieties.",
  Grape___Black_rot:
    "Remove infected fruit and apply fungicides preventatively.",
  Potato___Early_blight:
    "Apply fungicides, ensure adequate plant spacing, and practice crop rotation.",
  Potato___Late_blight:
    "Apply copper-based fungicides. Remove and destroy infected plants. Avoid overhead watering.",
  Tomato___Bacterial_spot:
    "Copper-based sprays can help prevent spread. Rotate crops and maintain good sanitation.",
  Tomato___Early_blight:
    "Remove lower infected leaves, apply appropriate fungicides, and mulch around plants.",
  Tomato___Late_blight:
    "Apply fungicides preventatively. Remove infected plants to prevent spread.",
  Tomato___Leaf_Mold:
    "Improve air circulation, reduce humidity, and apply fungicides.",
  Tomato___Septoria_leaf_spot:
    "Apply fungicides, practice crop rotation, and remove infected plant debris.",
  "Tomato___Spider_mites Two-spotted_spider_mite":
    "Apply insecticidal soap or horticultural oil. Increase humidity.",
  Tomato___Target_Spot:
    "Apply fungicides and avoid overhead watering. Remove infected leaves.",
  Tomato___Tomato_mosaic_virus:
    "Remove and destroy infected plants. There is no cure, focus on prevention.",
  Tomato___Tomato_Yellow_Leaf_Curl_Virus:
    "Control whitefly vectors. Remove infected plants. Use resistant varieties.",
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
