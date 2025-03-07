/**
 * Encodes a buffer to base64
 * @param buffer The image buffer to encode
 * @returns Base64 encoded string with data URI
 */
export function encodeBase64FromBuffer(
  buffer: Uint8Array | null | undefined
): string {
  try {
    // Check if buffer is valid
    if (!buffer) {
      throw new Error("Buffer is null or undefined");
    }

    // Ensure buffer is a Uint8Array
    if (!(buffer instanceof Uint8Array)) {
      console.error("Buffer type:", typeof buffer);
      console.error("Buffer value:", buffer);
      throw new Error(`Buffer is not a Uint8Array, got ${typeof buffer}`);
    }

    // Convert buffer to base64 using Deno's btoa and TextDecoder
    // This approach avoids iteration issues
    const binary = Array.from(new Uint8Array(buffer))
      .map((byte) => String.fromCharCode(byte))
      .join("");

    const base64Encoded = btoa(binary);

    // Determine mime type from buffer magic numbers
    let mimeType = "image/jpeg"; // Default

    if (buffer.length > 4) {
      // Check for PNG signature
      if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      ) {
        mimeType = "image/png";
      }
      // Check for JPEG signature
      else if (buffer[0] === 0xff && buffer[1] === 0xd8) {
        mimeType = "image/jpeg";
      }
      // Check for GIF signature
      else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        mimeType = "image/gif";
      }
    }

    return `data:${mimeType};base64,${base64Encoded}`;
  } catch (error) {
    console.error("Error details in encodeBase64FromBuffer:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to encode image: ${error.message}`);
    } else {
      throw new Error(`Failed to encode image: Unknown error`);
    }
  }
}

// Helper function to extract a shorter identifier from the image URL
export function extractImageIdentifier(imageUrl: string): string {
  try {
    // Option 1: Extract just the filename from the URL
    const urlParts = imageUrl.split("/");
    const filename = urlParts[urlParts.length - 1];

    // If the filename is still too long, you could truncate it
    if (filename.length > 200) {
      return filename.substring(0, 200);
    }

    return filename;
  } catch (e) {
    // Fallback: If parsing fails, just truncate the original URL
    return imageUrl.substring(0, 200);
  }
}
