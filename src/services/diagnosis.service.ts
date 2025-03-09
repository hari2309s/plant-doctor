import { getDB } from "@/db/database.ts";

interface Prediction {
  confidence: string;
  description: string;
  disease: string;
}

interface Diagnosis {
  id?: string;
  plant_name: string;
  predictions: Prediction[];
  disease_name: string;
  image_path: string;
  treatment?: string;
  additional_info?: Record<string, any>;
  created_at?: Date;
}

export async function saveDiagnosis(diagnosis: Diagnosis): Promise<Diagnosis> {
  const supabase = await getDB();

  // Generate UUID if not provided
  const id = diagnosis.id || crypto.randomUUID();

  const { data, error } = await supabase
    .from("plants_diagnoses")
    .insert([
      {
        id,
        plant_name: diagnosis.plant_name,
        predictions: diagnosis.predictions || [],
        disease_name: diagnosis.disease_name,
        image_path: diagnosis.image_path,
        treatment: diagnosis.treatment,
        additional_info: diagnosis.additional_info || {},
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error saving diagnosis:", error);
    throw new Error(`Failed to save diagnosis: ${error.message}`);
  }

  return data;
}

export async function getAllDiagnoses(): Promise<Diagnosis[]> {
  const supabase = await getDB();

  const { data, error } = await supabase
    .from("plants_diagnoses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error retrieving diagnoses:", error);
    throw new Error(`Failed to retrieve diagnoses: ${error.message}`);
  }

  return data || [];
}

export async function getDiagnosisById(id: string): Promise<Diagnosis | null> {
  const supabase = await getDB();

  const { data, error } = await supabase
    .from("plants_diagnoses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    // If the error is "No rows returned" (404), return null
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error retrieving diagnosis by ID:", error);
    throw new Error(`Failed to retrieve diagnosis: ${error.message}`);
  }

  return data;
}
