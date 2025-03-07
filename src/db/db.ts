import { Pool, Client } from "../../deps.ts";
import { config } from "@/utils/config.utils.ts";

// Get the PostgreSQL connection string from environment variables
const POSTGRES_URL = config.DATABASE_URL;

let pool: Pool | null = null;
let isConnecting = false;
let connectionAttempts = 0;
const MAX_ATTEMPTS = config.DB_CONNECTION_RETRIES || 5;
const RETRY_DELAY = config.DB_CONNECTION_RETRY_DELAY || 2000;

// Parse connection info from URL
function getConnectionConfig(url: string) {
  const dbUrl = new URL(url);

  // Supabase-specific configuration
  return {
    user: dbUrl.username,
    password: dbUrl.password,
    hostname: dbUrl.hostname,
    port: Number(dbUrl.port) || 5432,
    database: dbUrl.pathname.substring(1),
    tls: {
      enabled: true, // Always use TLS with Supabase
      enforce: true, // Enforce TLS for Supabase
    },
    max: 20, // Set maximum number of clients
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    application_name: "plant-doctor-app", // Help identify your connection in Supabase logs
    connection_timeout: 30, // 30 seconds timeout for Supabase
    idle_timeout: 60, // 60 seconds idle timeout
    options: `--search_path=public`, // Ensure we're using the public schema
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
      `Attempting to connect to Supabase PostgreSQL at ${connectionConfig.hostname}`
    );

    // Try a simple client connection first to verify credentials
    const client = new Client(connectionConfig);

    await client.connect();
    console.log("Single client connection to Supabase successful!");

    // Now create the connection pool
    // Supabase recommends a smaller connection pool size
    const poolSize = config.DB_POOL_SIZE || 3; // Small default pool size for Supabase

    pool = new Pool(connectionConfig, poolSize);

    // Test the pool by getting a client
    const poolClient = await pool.connect();
    console.log(
      `Database pool successfully initialized with ${poolSize} connections`
    );

    // Create plants_diagnoses table if it doesn't exist
    // Using TEXT for image_path instead of VARCHAR(255) to avoid length issues
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
    console.log("Diagnosis table created or already exists");

    // Set up RLS policy for the table if using Supabase Auth
    // This is optional but recommended for Supabase projects
    try {
      await poolClient.queryObject(`
        ALTER TABLE plants_diagnoses ENABLE ROW LEVEL SECURITY;
      `);
      console.log("Row Level Security enabled for diagnoses table");
    } catch (err) {
      // It's okay if this fails, it might mean we don't have privileges
      console.log(
        "Note: Could not enable RLS (may require superuser privileges)"
      );
    }

    poolClient.release();
    await client.end();

    // Reset connection attempts on success
    connectionAttempts = 0;
    isConnecting = false;

    return pool;
  } catch (error) {
    console.error("Supabase database connection error:", error);
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
  if (pool) {
    try {
      return await pool.connect();
    } catch (err) {
      console.warn("Error getting client from existing Supabase pool:", err);
      pool = null;
    }
  }

  // Try to initialize again if needed
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await initDB();
    if (pool) {
      try {
        return await (pool as Pool).connect();
      } catch (err) {
        console.warn(
          `Failed to get Supabase client after initialization (attempt ${
            i + 1
          }):`,
          err
        );
        if (i < MAX_ATTEMPTS - 1) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          pool = null;
        }
      }
    } else if (i < MAX_ATTEMPTS - 1) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }

  throw new Error(
    "Supabase database connection unavailable after multiple attempts"
  );
}

// Health check function specifically for Supabase
export async function checkDBConnection() {
  let client = null;
  try {
    client = await getDB();
    console.log(`Connected to Supabase PostgreSQL`);
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

// Function to gracefully close all database connections
export async function closeDBConnections() {
  if (pool) {
    try {
      await pool.end();
      console.log("All Supabase database connections closed");
    } catch (err) {
      console.error("Error closing Supabase database connections:", err);
    } finally {
      pool = null;
    }
  }
}
