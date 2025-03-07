import { dotenvConfig } from "../../deps.ts";

// Load environment variables
await dotenvConfig({ export: true });

/**
 * Application configuration
 */
export const config = {
  PORT: parseInt(Deno.env.get("PORT") || "8000"),
  HUGGING_FACE_API_KEY: Deno.env.get("HUGGING_FACE_API_KEY") || "",
  HUGGING_FACE_MODEL_ID:
    Deno.env.get("HUGGING_FACE_MODEL_ID") || "microsoft/resnet-50",
  LOG_LEVEL: Deno.env.get("LOG_LEVEL") || "info",
  SUPABASE_URL:
    Deno.env.get("SUPABASE_URL") || "https://tztqrwfrxgdnghfvdluj.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "key",
};

/**
 * Validate required configuration
 */
export function validateConfig(): void {
  if (!config.HUGGING_FACE_API_KEY) {
    console.error("HUGGING_FACE_API_KEY is required but not set");
    Deno.exit(1);
  }
}

// Validate configuration on startup
validateConfig();
