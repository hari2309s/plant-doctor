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

// Replace the existing getImageBase64 function with this one
export function getImageBase64(
  filename: string,
  contentType: string,
  fileContent: Uint8Array
): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(fileContent)));
  return `data:${contentType};base64,${base64}`;
}

export async function encodeBase64FromBuffer(
  buffer: Uint8Array
): Promise<string> {
  // Convert Uint8Array to base64
  return await btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

/**
 * Validate if a file is an image based on its MIME type
 * @param contentType The MIME type to check
 * @returns True if the MIME type is an image type
 */
export function isImageFile(contentType: string): boolean {
  return contentType.startsWith("image/");
}
