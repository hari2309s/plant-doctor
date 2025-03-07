import { Pool, Client } from "../../deps.ts";

// Configure DB connection
const POSTGRES_URL =
  Deno.env.get("DATABASE_URL") ||
  "postgresql://postgres:vaqzap-hajru0-peCdom@db.tztqrwfrxgdnghfvdluj.supabase.co:5432/postgres?sslmode=require";

let pool: Pool | null = null;
let isConnecting = false;
let connectionAttempts = 0;
const MAX_ATTEMPTS = 3;

// Initialize database connection
export async function initDB() {
  if (isConnecting) {
    console.log("Database connection already in progress");
    return null;
  }

  if (connectionAttempts >= MAX_ATTEMPTS) {
    console.log(
      "Maximum connection attempts reached, skipping database initialization"
    );
    return null;
  }

  isConnecting = true;
  connectionAttempts++;

  try {
    console.log(
      `Database connection attempt ${connectionAttempts}/${MAX_ATTEMPTS}`
    );

    const dbUrl = new URL(POSTGRES_URL);
    // Try a simple client connection first
    const client = new Client({
      user: dbUrl.username,
      password: dbUrl.password,
      hostname: dbUrl.hostname,
      port: Number(dbUrl.port) || 5432,
      database: dbUrl.pathname.substring(1),
      tls: {
        enabled: true,
        enforce: false,
      },
    });

    console.log(
      `Attempting to connect to ${dbUrl.hostname}:${dbUrl.port || 5432}`
    );

    await client.connect();

    console.log("Single client connection successful!");

    // Now try a pool
    pool = new Pool(
      {
        user: dbUrl.username,
        password: dbUrl.password,
        hostname: dbUrl.hostname,
        port: Number(dbUrl.port) || 5432,
        database: dbUrl.pathname.substring(1),
        tls: {
          enabled: true,
        },
      },
      2
    ); // Reduce max connections to 2

    const poolClient = await pool.connect();

    console.log("Database pool successfully initialized");

    // Create plants_diagnoses table if it doesn't exist
    await poolClient.queryObject(`
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

    poolClient.release();
    await client.end();
    isConnecting = false;

    return pool;
  } catch (error) {
    console.error("Database connection error:", error);
    isConnecting = false;
    pool = null;
    return null;
  }
}

// Get DB client
export async function getDB() {
  if (!pool) {
    await initDB();
    if (!pool) {
      throw new Error("Database connection unavailable");
    }
  }
  return await pool.connect();
}
