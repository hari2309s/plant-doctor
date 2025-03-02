/**
 * Convert an image file to base64 format
 * @param filePath Path to the image file
 * @param contentType The MIME type of the image
 * @returns Base64-encoded string with data URI prefix
 */
export async function getImageBase64(
  filePath: string,
  contentType: string
): Promise<string> {
  try {
    const imageData = await Deno.readFile(filePath);
    const base64Data = btoa(new TextDecoder().decode(imageData));
    return `data:${contentType};base64,${base64Data}`;
  } catch (error: any) {
    console.error("Error reading image file:", error);
    throw new Error("Failed to process image file: " + error.message);
  }
}

/**
 * Validate if a file is an image based on its MIME type
 * @param contentType The MIME type to check
 * @returns True if the MIME type is an image type
 */
export function isImageFile(contentType: string): boolean {
  return contentType.startsWith("image/");
}
