import { Pool } from "../../deps.ts";

// Configure DB connection
const POSTGRES_URL =
  Deno.env.get("DATABASE_URL") ||
  "postgres://postgres:postgres@localhost:5432/plant_doctor";

// Create a pool
let pool: Pool;

// Initialize database connection
export async function initDB() {
  try {
    // Parse the connection string into separate components
    const dbUrl = new URL(POSTGRES_URL);
    const username = dbUrl.username;
    const password = dbUrl.password;
    const hostname = dbUrl.hostname;
    const port = Number(dbUrl.port) || 5432;
    const database = dbUrl.pathname.substring(1); // Remove the leading '/'

    // Use a connection pool instead of a single client
    pool = new Pool(
      {
        user: username,
        password: password,
        hostname: hostname,
        port: port,
        database: database,
        tls: {
          enabled: true,
          enforce: false,
        },
      },
      3, // Maximum connections in the pool
      true
    ); // Connect immediately to verify

    // Connect to the pool and get a client
    const client = await pool.connect();

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

    client.release();
    return pool;
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
}

// Get DB client
export async function getDB() {
  if (!pool) {
    await initDB();
  }
  return await pool.connect();
}
