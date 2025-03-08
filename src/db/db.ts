import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "@/utils/config.utils.ts";

// Get the Supabase URL and key from environment variables
const SUPABASE_URL = config.SUPABASE_URL;
const SUPABASE_KEY = config.SUPABASE_ANON_KEY;

// Validate environment variables
if (!SUPABASE_URL) {
  console.error("SUPABASE_URL environment variable is not set");
}

if (!SUPABASE_KEY) {
  console.error("SUPABASE_KEY environment variable is not set");
}

// Create a singleton Supabase client
let supabase: SupabaseClient<any, "public", any> | null = null;
let isInitialized = false;
let connectionAttempts = 0;
const MAX_ATTEMPTS = config.DB_CONNECTION_RETRIES || 5;
const RETRY_DELAY = config.DB_CONNECTION_RETRY_DELAY || 2000;

// Initialize Supabase client
export async function initDB() {
  if (isInitialized && supabase) return supabase;

  if (connectionAttempts >= MAX_ATTEMPTS) {
    console.error(
      "Maximum connection attempts reached, database initialization failed"
    );
    return null;
  }

  connectionAttempts++;

  try {
    console.log(
      `Supabase connection attempt ${connectionAttempts}/${MAX_ATTEMPTS}`
    );

    // Validate Supabase URL and key are provided
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error(
        "Supabase URL or key is not set in environment variables"
      );
    }

    console.log(`Connecting to Supabase at ${SUPABASE_URL}`);

    // Create the Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Test the connection with a simple query
    const { data, error } = await supabase
      .from("plants_diagnoses")
      .select("id")
      .limit(1);

    if (error) throw error;

    console.log("Successfully connected to Supabase");

    // Ensure the plants_diagnoses table exists
    await ensureDiagnosesTableExists();

    // Reset connection attempts on success
    connectionAttempts = 0;
    isInitialized = true;

    return supabase;
  } catch (error: any) {
    console.error("Supabase connection error:", error);

    // Handle "table doesn't exist" error separately
    if (
      error.message &&
      error.message.includes("does not exist") &&
      error.message.includes("plants_diagnoses")
    ) {
      console.log(
        "The plants_diagnoses table doesn't exist yet, will create it"
      );
      await ensureDiagnosesTableExists();
      isInitialized = true;
      return supabase;
    }

    supabase = null;
    isInitialized = false;

    // Implement retry with delay
    if (connectionAttempts < MAX_ATTEMPTS) {
      console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return initDB(); // Recursive call to retry
    }

    return null;
  }
}

// Ensure the diagnoses table exists using SQL via Supabase's REST API
async function ensureDiagnosesTableExists() {
  try {
    if (!supabase) {
      supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }

    const { error } = await supabase.rpc(
      "create_plants_diagnoses_if_not_exists",
      {}
    );

    if (error && !error.message.includes("function does not exist")) {
      throw error;
    }

    if (error && error.message.includes("function does not exist")) {
      // Create the function first
      const { error: functionError } = await supabase.rpc(
        "create_rpc_function",
        {}
      );
      if (
        functionError &&
        !functionError.message.includes("function does not exist")
      ) {
        throw functionError;
      }

      // Now try creating the table again
      const { error: secondAttemptError } = await supabase.rpc(
        "create_plants_diagnoses_if_not_exists",
        {}
      );
      if (secondAttemptError) {
        console.warn(
          "Could not create table automatically:",
          secondAttemptError
        );
        console.log(
          "Proceeding anyway, assuming table exists or will be created by migrations"
        );
      }
    }

    console.log("Ensured plants_diagnoses table exists");
  } catch (error) {
    console.warn("Error ensuring plants_diagnoses table exists:", error);
    console.log(
      "Proceeding anyway, assuming table exists or will be created by migrations"
    );
  }
}

// Get DB client
export async function getDB() {
  try {
    if (!supabase) {
      supabase = await initDB();
      if (!supabase) {
        throw new Error("Failed to initialize Supabase connection");
      }
    }

    return supabase;
  } catch (error: any) {
    console.error("Error getting Supabase client:", error);
    supabase = null;
    isInitialized = false;
    throw new Error("Supabase connection unavailable: " + error.message);
  }
}

// Health check function
export async function checkDBConnection() {
  try {
    const db = await getDB();
    const { data, error } = await db
      .from("plants_diagnoses")
      .select("id")
      .limit(1);

    if (error) throw error;

    console.log("Supabase health check passed");
    return true;
  } catch (error) {
    console.error("Supabase health check failed:", error);
    supabase = null;
    isInitialized = false;
    return false;
  }
}

// Function to close connections (for clean shutdowns)
export async function closeDBConnections() {
  try {
    console.log("Supabase doesn't require explicit connection closing");
    supabase = null;
    isInitialized = false;
    return true;
  } catch (error) {
    console.error("Error resetting Supabase client:", error);
    return false;
  }
}

// Sample functions for working with the plants_diagnoses table

// Store plant diagnosis
export async function storePlantDiagnosis(diagnosis: any) {
  const db = await getDB();
  const { data, error } = await db
    .from("plants_diagnoses")
    .insert([diagnosis])
    .select();

  if (error) throw error;
  return data[0];
}

// Get diagnosis by ID
export async function getDiagnosisById(id: string) {
  const db = await getDB();
  const { data, error } = await db
    .from("plants_diagnoses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

// Get all diagnoses
export async function getAllDiagnoses() {
  const db = await getDB();
  const { data, error } = await db
    .from("plants_diagnoses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
