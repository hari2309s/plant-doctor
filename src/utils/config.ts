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
    Deno.env.get("HUGGING_FACE_MODEL_ID") || "surgeonwz/plant-village",
  LOG_LEVEL: Deno.env.get("LOG_LEVEL") || "info",
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
