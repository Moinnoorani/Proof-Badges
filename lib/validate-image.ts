/**
 * Image upload validation with magic-byte sniffing.
 *
 * Validates: Requirements 5.6
 */

/** Maximum allowed file size: 2 MB */
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

/** Allowed file extensions (without dot, lowercase) */
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif"]);

/** Sniffed image type derived from magic bytes */
type SniffedType = "png" | "jpeg" | "gif" | "webp" | null;

/**
 * Sniff the image type from the first 12 bytes of a file.
 *
 * Magic byte signatures:
 * - PNG:  89 50 4E 47
 * - JPEG: FF D8 FF
 * - GIF:  47 49 46 38
 * - WEBP: 52 49 46 46 .. .. .. .. 57 45 42 50 (RIFF....WEBP)
 */
function sniffType(magicBytes: Uint8Array): SniffedType {
  if (magicBytes.length < 3) return null;

  // PNG: 89 50 4E 47
  if (
    magicBytes.length >= 4 &&
    magicBytes[0] === 0x89 &&
    magicBytes[1] === 0x50 &&
    magicBytes[2] === 0x4e &&
    magicBytes[3] === 0x47
  ) {
    return "png";
  }

  // JPEG: FF D8 FF
  if (
    magicBytes[0] === 0xff &&
    magicBytes[1] === 0xd8 &&
    magicBytes[2] === 0xff
  ) {
    return "jpeg";
  }

  // GIF: 47 49 46 38
  if (
    magicBytes.length >= 4 &&
    magicBytes[0] === 0x47 &&
    magicBytes[1] === 0x49 &&
    magicBytes[2] === 0x46 &&
    magicBytes[3] === 0x38
  ) {
    return "gif";
  }

  // WEBP: bytes 0-3 = RIFF (52 49 46 46), bytes 8-11 = WEBP (57 45 42 50)
  if (
    magicBytes.length >= 12 &&
    magicBytes[0] === 0x52 &&
    magicBytes[1] === 0x49 &&
    magicBytes[2] === 0x46 &&
    magicBytes[3] === 0x46 &&
    magicBytes[8] === 0x57 &&
    magicBytes[9] === 0x45 &&
    magicBytes[10] === 0x42 &&
    magicBytes[11] === 0x50
  ) {
    return "webp";
  }

  return null;
}

/**
 * Maps a declared file extension to the expected sniffed type.
 * Both "jpg" and "jpeg" map to the "jpeg" sniffed type.
 */
function extensionToSniffedType(ext: string): SniffedType {
  switch (ext) {
    case "png":
      return "png";
    case "jpg":
    case "jpeg":
      return "jpeg";
    case "gif":
      return "gif";
    case "webp":
      return "webp";
    default:
      return null;
  }
}

export type ValidateImageInput = {
  sizeBytes: number;
  declaredExtension: string;
  magicBytes: Uint8Array;
};

export type ValidateImageResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * Validates an image upload by checking file size, extension allowlist,
 * and magic-byte sniffing to ensure the declared extension matches the
 * actual file content.
 *
 * @param input.sizeBytes - Total file size in bytes
 * @param input.declaredExtension - File extension without the dot (e.g., "png", "jpg")
 * @param input.magicBytes - First 12 bytes of the file as a Uint8Array
 * @returns `{valid: true}` or `{valid: false, reason: string}`
 */
export function validateImageUpload(
  input: ValidateImageInput
): ValidateImageResult {
  const { sizeBytes, declaredExtension, magicBytes } = input;
  const ext = declaredExtension.toLowerCase();

  // Check file size
  if (sizeBytes > MAX_SIZE_BYTES) {
    return {
      valid: false,
      reason: `File size ${sizeBytes} bytes exceeds the 2 MB limit`,
    };
  }

  // Check extension allowlist
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      reason: `Extension "${ext}" is not allowed. Supported: png, jpg, jpeg, webp, gif`,
    };
  }

  // Sniff the actual type from magic bytes
  const sniffed = sniffType(magicBytes);
  if (sniffed === null) {
    return {
      valid: false,
      reason: "Unable to determine file type from magic bytes",
    };
  }

  // Check that sniffed type matches declared extension
  const expected = extensionToSniffedType(ext);
  if (sniffed !== expected) {
    return {
      valid: false,
      reason: `File content is ${sniffed} but declared extension is "${ext}"`,
    };
  }

  return { valid: true };
}
