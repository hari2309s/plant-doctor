import { Pool, Client } from "../../deps.ts";

// Configure DB connection
const POSTGRES_URL =
  Deno.env.get("DATABASE_URL") ||
  "postgresql://postgres:vaqzap-hajru0-peCdom@db.tztqrwfrxgdnghfvdluj.supabase.co:5432/postgres?sslmode=require";

let pool: Pool | null = null;
let isConnecting = false;
let connectionAttempts = 0;
const MAX_ATTEMPTS = 5; // Increased max attempts
const RETRY_DELAY = 2000; // 2 seconds between retries

// Parse connection info from URL
function getConnectionConfig(url: string) {
  const dbUrl = new URL(url);
  return {
    user: dbUrl.username,
    password: dbUrl.password,
    hostname: dbUrl.hostname,
    port: Number(dbUrl.port) || 5432,
    database: dbUrl.pathname.substring(1),
    tls: {
      enabled: true,
      enforce: false,
    },
  };
}

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

    const connectionConfig = getConnectionConfig(POSTGRES_URL);
    console.log(
      `Attempting to connect to ${connectionConfig.hostname}:${connectionConfig.port}`
    );

    // Try a simple client connection first
    const client = new Client(connectionConfig);

    await client.connect();
    console.log("Single client connection successful!");

    // Now try a pool with more robust configuration
    pool = new Pool(
      {
        ...connectionConfig,
      },
      3 // Increased to 3 connections but still conservative
    );

    // Test the pool by getting a client
    const poolClient = await pool.connect();
    console.log("Database pool successfully initialized");

    // Create plants_diagnoses table if it doesn't exist
    // IMPORTANT: Changed VARCHAR(255) to TEXT for image_path to prevent "value too long" errors
    await poolClient.queryObject(`
      CREATE TABLE IF NOT EXISTS plants_diagnoses (
        id VARCHAR(255) PRIMARY KEY,
        plant_name VARCHAR(255) NOT NULL,
        predictions JSONB NOT NULL, -- Array of diagnosis objects
        disease_name VARCHAR(255) NOT NULL,
        image_path TEXT NOT NULL,  -- Changed from VARCHAR(255) to TEXT
        treatment TEXT,
        additional_info JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Diagnosis table created or already exists");

    poolClient.release();
    await client.end();

    // Reset connection attempts on success
    connectionAttempts = 0;
    isConnecting = false;

    return pool;
  } catch (error) {
    console.error("Database connection error:", error);
    isConnecting = false;
    pool = null;

    // Implement retry with delay
    if (connectionAttempts < MAX_ATTEMPTS) {
      console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
      setTimeout(() => {
        // Reset the isConnecting flag for next attempt
        isConnecting = false;
      }, RETRY_DELAY);
    }

    return null;
  }
}

// Get DB client with retry logic
export async function getDB() {
  // If pool exists, try to get a client
  if (pool) {
    try {
      return await pool.connect();
    } catch (err) {
      console.warn("Error getting client from existing pool:", err);
      // Fall through to re-initialization
      pool = null;
    }
  }

  // Initialize or re-initialize the pool
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await initDB();
    if (pool) {
      try {
        return await (pool as Pool).connect();
      } catch (err) {
        console.warn(
          `Failed to get client after initialization (attempt ${i + 1}):`,
          err
        );
        // Only retry initialization if we still have attempts left
        if (i < MAX_ATTEMPTS - 1) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          pool = null;
        }
      }
    } else if (i < MAX_ATTEMPTS - 1) {
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }

  throw new Error("Database connection unavailable after multiple attempts");
}

// Health check function that can be called periodically
export async function checkDBConnection() {
  let client = null;
  try {
    client = await getDB();
    await client.queryObject("SELECT 1");
    return true;
  } catch (err) {
    console.error("Database health check failed:", err);
    // Force pool to be re-initialized on next getDB() call
    pool = null;
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}
