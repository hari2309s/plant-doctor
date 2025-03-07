import { encode } from "../../deps.ts";

/**
 * Convert an image file to base64 format
 * @param filePath Path to the image file
 * @param contentType The MIME type of the image
 * @returns Base64-encoded string with data URI prefix
 */
/*export async function getImageBase64(
  filename: string,
  contentType: string
): Promise<string> {
  try {
    // Read file as binary data
    const imageData = await Deno.readFile(filename);
    const base64Data = encode(imageData);

    return `data:${contentType};base64,${base64Data}`;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw error;
  }
}*/

/**
 * Validate if a file is an image based on its MIME type
 * @param contentType The MIME type to check
 * @returns True if the MIME type is an image type
 */
export function isImageFile(contentType: string): boolean {
  return contentType.startsWith("image/");
}

/**
 * Encodes a Uint8Array buffer to a base64 string
 * @param buffer The binary data as Uint8Array
 * @returns A Promise that resolves to the base64-encoded string
 */
/*export function encodeBase64FromBuffer(buffer: Uint8Array): string {
  // Convert Uint8Array to base64 string
  // In Deno, we can use the built-in btoa function with TextDecoder
  const uint8Array = new Uint8Array(buffer);
  const binary = Array.from(uint8Array)
    .map((byte) => String.fromCharCode(byte))
    .join("");

  const base64 = btoa(binary);
  console.log("base 46", base64);
  return base64;
}*/

/**
 * Encodes a buffer directly to base64 using Deno's encoding APIs
 * @param buffer The image buffer to encode
 * @returns Promise with base64 encoded string
 */
export function encodeBase64FromBuffer(buffer: Uint8Array): string {
  try {
    // Use Deno's built-in encode function
    const base64Encoded = btoa(
      Array.from(buffer)
        .map((byte) => String.fromCharCode(byte))
        .join("")
    );

    // Determine mime type from buffer (simple implementation - you might need to enhance this)
    let mimeType = "image/jpeg"; // Default

    // Very basic mime type detection from magic numbers
    if (buffer.length > 4) {
      // Check for PNG
      if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      ) {
        mimeType = "image/png";
      }
      // Check for JPEG
      else if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        mimeType = "image/jpeg";
      }
      // Check for GIF
      else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        mimeType = "image/gif";
      }
    }

    return `data:${mimeType};base64,${base64Encoded}`;
  } catch (error: any) {
    console.error("Error encoding image to base64:", error);
    throw new Error(`Failed to encode image: ${error.message}`);
  }
}
