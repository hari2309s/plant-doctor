import { getDB } from "@/db/database.ts";

interface Prediction {
  confidence: string;
  description: string;
  disease: string;
}

interface Diagnosis {
  id?: number;
  plant_name: string;
  predictions: Prediction[];
  disease_name: string;
  image_path: string;
  treatment?: string;
  additional_info?: Record<string, unknown>;
  created_at?: Date;
}

export async function saveDiagnosis(diagnosis: Diagnosis): Promise<Diagnosis> {
  const client = await getDB();

  const uuid = crypto.randomUUID();

  const result = await client.queryObject<Diagnosis>(
    `INSERT INTO plants_diagnoses (id, plant_name, predictions, disease_name, image_path, treatment, additional_info)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      uuid,
      diagnosis.plant_name,
      diagnosis.predictions ? JSON.stringify(diagnosis.predictions) : "[]",
      diagnosis.disease_name,
      diagnosis.image_path,
      diagnosis.treatment,
      diagnosis.additional_info
        ? JSON.stringify(diagnosis.additional_info)
        : "{}",
    ]
  );

  return result.rows[0];
}

export async function getAllDiagnoses(): Promise<Diagnosis[]> {
  const client = await getDB();
  const result = await client.queryObject<Diagnosis>(
    `SELECT * FROM plants_diagnoses ORDER BY created_at DESC`
  );

  return result.rows;
}

export async function getDiagnosisById(id: number): Promise<Diagnosis | null> {
  const client = await getDB();
  const result = await client.queryObject<Diagnosis>(
    `SELECT * FROM plants_diagnoses WHERE id = $1`,
    [id]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}
