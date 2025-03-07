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
export function encodeBase64FromBuffer(buffer: Uint8Array): string {
  // Convert Uint8Array to base64 string
  // In Deno, we can use the built-in btoa function with TextDecoder
  const uint8Array = new Uint8Array(buffer);
  const binary = Array.from(uint8Array)
    .map((byte) => String.fromCharCode(byte))
    .join("");

  const base64 = btoa(binary);
  console.log("base 46", base64);
  return base64;
}
