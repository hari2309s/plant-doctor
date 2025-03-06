import { Client } from "../../deps.ts";

// Configure DB connection
const POSTGRES_URL =
  Deno.env.get("DATABASE_URL") ||
  "postgres://postgres:postgres@localhost:5432/plant_doctor";

// Create a client pool
const client = new Client(POSTGRES_URL);

// Initialize database connection
export async function initDB() {
  try {
    await client.connect();
    console.log("Database connection established");

    // Create plants_diagnoses table if it doesn't exist
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS plants_diagnoses (
        id VARCHAR(255) PRIMARY KEY,
        plant_name VARCHAR(255) NOT NULL,
        predictions JSONB NOT NULL, -- Array of diagnosis objects,
        disease_name VARCHAR(255) NOT NULL,
        image_path VARCHAR(255) NOT NULL,
        treatment TEXT,
        additional_info JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Diagnosis table created or already exists");
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
}

// Get DB client
export function getDB() {
  return client;
}
