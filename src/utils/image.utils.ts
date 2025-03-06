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

export function encodeBase64FromBuffer(buffer: Uint8Array): string {
  // A more robust way to convert Uint8Array to base64
  const chunks: string[] = [];
  const chunkSize = 8192; // Process in smaller chunks to avoid memory issues

  for (let i = 0; i < buffer.length; i += chunkSize) {
    const chunk = buffer.subarray(i, i + chunkSize);
    chunks.push(String.fromCharCode(...chunk));
  }

  return btoa(chunks.join(""));
}

/**
 * Validate if a file is an image based on its MIME type
 * @param contentType The MIME type to check
 * @returns True if the MIME type is an image type
 */
export function isImageFile(contentType: string): boolean {
  return contentType.startsWith("image/");
}
