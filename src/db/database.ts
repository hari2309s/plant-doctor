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

    // Try a simple client connection first
    const dbUrl = new URL(POSTGRES_URL);
    const client = new Client({
      user: dbUrl.username,
      password: dbUrl.password,
      hostname: dbUrl.hostname,
      port: Number(dbUrl.port) || 5432,
      database: dbUrl.pathname.substring(1),
      tls: {
        enabled: true,
      },
    });

    console.log(
      `Attempting to connect to ${dbUrl.hostname}:${dbUrl.port || 5432}`
    );
    await client.connect();
    console.log("Single client connection successful!");
    await client.end();

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
    poolClient.release();

    console.log("Database pool successfully initialized");
    isConnecting = false;
    return pool;
  } catch (error) {
    console.error("Database connection error:", error);
    isConnecting = false;
    pool = null;

    return null;
  }
  /*try {
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
  }*/
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
