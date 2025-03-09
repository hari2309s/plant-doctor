import { dotenvConfig } from "../../deps.ts";

// Load environment variables
await dotenvConfig({ export: true });

/**
 * Application configuration
 */
export const config = {
  // Server configuration
  PORT: parseInt(Deno.env.get("PORT") || "8000"),

  // Hugging Face configuration
  HUGGING_FACE_API_KEY: Deno.env.get("HUGGING_FACE_API_KEY") || "",
  HUGGING_FACE_MODEL_ID:
    Deno.env.get("HUGGING_FACE_MODEL_ID") || "microsoft/resnet-50",
  HUGGING_FACE_PLANT_DETECTION_MODEL:
    Deno.env.get("HUGGING_FACE_PLANT_DETECTION_MODEL") ||
    "google/vit-base-patch16-224",
  HUGGING_FACE_SPECIES_IDENTIFICATION_MODEL:
    Deno.env.get("HUGGING_FACE_SPECIES_IDENTIFICATION_MODEL") ||
    "plantnet/plantnet_2_7",
  HUGGING_FACE_CHARACTERISTICS_MODEL:
    Deno.env.get("HUGGING_FACE_CHARACTERISTICS_MODEL") ||
    "google/vit-large-patch16-224-in21k",
  HUGGING_FACE_DISEASE_DETECTION_MODEL:
    Deno.env.get("HUGGING_FACE_CHARACTERISTICS_MODEL") ||
    "merve/plant-disease-mobilenetv2",

  // Logging configuration
  LOG_LEVEL: Deno.env.get("LOG_LEVEL") || "info",

  // Supabase configuration
  SUPABASE_URL:
    Deno.env.get("SUPABASE_URL") || "https://tztqrwfrxgdnghfvdluj.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "key",
  SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY") || "key",

  // Database configuration - explicitly add these for clarity
  DATABASE_URL:
    Deno.env.get("DATABASE_URL") ||
    "postgresql://postgres:vaqzap-hajru0-peCdom@db.tztqrwfrxgdnghfvdluj.supabase.co:5432/postgres",

  // CORS configuration
  ALLOWED_ORIGINS: Deno.env.get("ALLOWED_ORIGINS")
    ? Deno.env.get("ALLOWED_ORIGINS")?.split(",")
    : ["*"], // Default to allowing all origins

  // Connection retry configuration
  DB_CONNECTION_RETRIES: parseInt(Deno.env.get("DB_CONNECTION_RETRIES") || "5"),
  DB_CONNECTION_RETRY_DELAY: parseInt(
    Deno.env.get("DB_CONNECTION_RETRY_DELAY") || "5000"
  ),

  // Performance configuration
  DB_POOL_SIZE: parseInt(Deno.env.get("DB_POOL_SIZE") || "2"),

  // API rate limiting
  RATE_LIMIT_MAX: parseInt(Deno.env.get("RATE_LIMIT_MAX") || "100"),
  RATE_LIMIT_WINDOW: parseInt(Deno.env.get("RATE_LIMIT_WINDOW") || "60000"), // 1 minute in ms
};

/**
 * Validate required configuration
 */
export function validateConfig(): void {
  const requiredVars = [
    "HUGGING_FACE_API_KEY",
    "DATABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  const missingVars = requiredVars.filter(
    (varName) =>
      !Deno.env.get(varName) && !config[varName as keyof typeof config]
  );

  if (missingVars.length > 0) {
    console.error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
    Deno.exit(1);
  }

  // Validate URL formats
  try {
    if (config.SUPABASE_URL) new URL(config.SUPABASE_URL);
    if (config.DATABASE_URL) new URL(config.DATABASE_URL);
  } catch (error: any) {
    console.error(`Invalid URL in configuration: ${error.message}`);
    Deno.exit(1);
  }

  console.log("Configuration validated successfully");
}

// Validate configuration on startup
validateConfig();

// Helper function to get database configuration from connection string
export function getDatabaseConfig() {
  try {
    const dbUrl = new URL(config.DATABASE_URL);
    return {
      user: dbUrl.username,
      password: dbUrl.password,
      hostname: dbUrl.hostname,
      port: Number(dbUrl.port) || 5432,
      database: dbUrl.pathname.substring(1),
      tls: {
        enabled: true,
        enforce: true,
      },
    };
  } catch (error) {
    console.error("Failed to parse DATABASE_URL:", error);
    throw new Error("Invalid DATABASE_URL format");
  }
}
