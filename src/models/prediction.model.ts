/**
 * Interface for an individual disease prediction
 */
export interface DiseasePrediction {
  disease: string;
  confidence: string;
  description: string;
}

/**
 * Interface for the prediction result returned to the client
 */
export interface PredictionResult {
  success: boolean;
  timestamp: string;
  model: string;
  predictions: DiseasePrediction[];
  error?: string;
}

/**
 * Interface for raw prediction data from Hugging Face
 */
export interface HuggingFacePrediction {
  label: string;
  score: number;
}
