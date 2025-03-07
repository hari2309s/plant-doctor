import { Pool } from "../../deps.ts";
import { config } from "@/utils/config.utils.ts";

// Get the PostgreSQL connection string from environment variables
const POSTGRES_URL = config.DATABASE_URL;

let pool: Pool | null = null;
let isConnecting = false;
let connectionAttempts = 0;
const MAX_ATTEMPTS = config.DB_CONNECTION_RETRIES || 5;
const RETRY_DELAY = config.DB_CONNECTION_RETRY_DELAY || 2000;

// Simplified connection config for Supabase
function getConnectionConfig(url: string) {
  try {
    const dbUrl = new URL(url);

    return {
      user: dbUrl.username,
      password: dbUrl.password,
      hostname: dbUrl.hostname,
      port: Number(dbUrl.port) || 5432,
      database: dbUrl.pathname.substring(1),
      tls: {
        enabled: true,
      },
      application_name: "plant-doctor-app",
    };
  } catch (error) {
    console.error("Invalid database URL format:", error);
    throw new Error("Invalid database connection string format");
  }
}

// Initialize database connection
export async function initDB() {
  if (pool) return pool;
  if (isConnecting) {
    console.log("Database connection already in progress");
    return null;
  }

  if (connectionAttempts >= MAX_ATTEMPTS) {
    console.error(
      "Maximum connection attempts reached, database initialization failed"
    );
    return null;
  }

  isConnecting = true;
  connectionAttempts++;

  try {
    console.log(
      `Database connection attempt ${connectionAttempts}/${MAX_ATTEMPTS}`
    );

    // Validate DATABASE_URL is provided
    if (!POSTGRES_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    const connectionConfig = getConnectionConfig(POSTGRES_URL);
    console.log(
      `Connecting to Supabase PostgreSQL at ${connectionConfig.hostname}`
    );

    // Simplified: create pool directly without testing a client first
    const poolSize = config.DB_POOL_SIZE || 3;
    pool = new Pool(connectionConfig, poolSize);

    // Test the pool connection
    const poolClient = await pool.connect();
    await poolClient.queryObject("SELECT 1");
    console.log(
      `Successfully connected to Supabase with pool size ${poolSize}`
    );

    // Create plants_diagnoses table if needed
    await poolClient.queryObject(`
      CREATE TABLE IF NOT EXISTS plants_diagnoses (
        id VARCHAR(255) PRIMARY KEY,
        plant_name VARCHAR(255) NOT NULL,
        predictions JSONB NOT NULL,
        disease_name VARCHAR(255) NOT NULL,
        image_path TEXT NOT NULL,
        treatment TEXT,
        additional_info JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    poolClient.release();

    // Reset connection attempts on success
    connectionAttempts = 0;
    isConnecting = false;

    return pool;
  } catch (error: any) {
    console.error("Supabase database connection error:", error);
    console.error("Details:", error.message);
    if (error.code) console.error("Error code:", error.code);

    isConnecting = false;
    pool = null;

    // Implement retry with delay
    if (connectionAttempts < MAX_ATTEMPTS) {
      console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return initDB(); // Recursive call to retry
    }

    return null;
  }
}

// Get DB client (simplified with clearer error handling)
export async function getDB() {
  try {
    if (!pool) {
      pool = await initDB();
      if (!pool) {
        throw new Error("Failed to initialize database connection");
      }
    }

    return await pool.connect();
  } catch (error: any) {
    console.error("Error getting database client:", error);
    pool = null; // Reset pool so next attempt will re-initialize
    throw new Error(
      "Supabase database connection unavailable: " + error.message
    );
  }
}

// Health check function
export async function checkDBConnection() {
  let client = null;
  try {
    client = await getDB();
    await client.queryObject("SELECT 1");
    console.log("Supabase database health check passed");
    return true;
  } catch (err) {
    console.error("Supabase database health check failed:", err);
    pool = null;
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Function to close connections
export async function closeDBConnections() {
  if (pool) {
    try {
      await pool.end();
      console.log("All Supabase database connections closed");
    } catch (err) {
      console.error("Error closing database connections:", err);
    } finally {
      pool = null;
    }
  }
}
