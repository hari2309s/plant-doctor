import { config } from "@/utils/config.utils.ts";

const SUPABASE_URL = config.SUPABASE_URL;
const SUPABASE_KEY = config.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = "plant-doctor-plants-images";

/**
 * Uploads an image to Supabase Storage
 * @param imageBuffer The image buffer to upload
 * @param fileName The name to give the file
 * @returns The public URL of the uploaded image
 */
export async function uploadImageToSupabase(
  imageBuffer: Uint8Array,
  fileName: string
): Promise<string> {
  try {
    // Make sure the file name is URL-safe
    const safeFileName = encodeURIComponent(
      fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
    );

    // Create a unique file path with timestamp to avoid duplicates
    const timestamp = new Date().getTime();
    const filePath = `${timestamp}_${safeFileName}`;

    // Construct the API URL for Supabase Storage
    const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`;

    // Upload the image to Supabase Storage
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/octet-stream",
        "x-upsert": "true", // Enable upsert (overwrite if exists)
      },
      body: imageBuffer,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to upload image: ${JSON.stringify(error)}`);
    }

    // Get the public URL for the uploaded image
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;

    console.log(`Image uploaded successfully to ${publicUrl}`);
    return publicUrl;
  } catch (error: any) {
    console.error("Error uploading image to Supabase:", error);
    throw new Error(`Failed to upload image to storage: ${error.message}`);
  }
}

/**
 * Deletes an image from Supabase Storage
 * @param imageUrl The URL of the image to delete
 */
export async function deleteImageFromSupabase(imageUrl: string): Promise<void> {
  try {
    // Extract the file path from the URL
    const urlObj = new URL(imageUrl);
    const pathSegments = urlObj.pathname.split("/");
    const filePath = pathSegments
      .slice(pathSegments.indexOf("public") + 1)
      .join("/");

    // Construct the API URL for deletion
    const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`;

    // Delete the image
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to delete image: ${JSON.stringify(error)}`);
    }

    console.log(`Image deleted successfully: ${imageUrl}`);
  } catch (error: any) {
    console.error("Error deleting image from Supabase:", error);
    throw new Error(`Failed to delete image from storage: ${error.message}`);
  }
}
