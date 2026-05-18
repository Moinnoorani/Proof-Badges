import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateImageUpload } from "./validate-image";

/**
 * Property 5: Image upload validation
 * Validates: Requirements 5.6
 *
 * For any generated upload {sizeBytes, declaredExtension, magicBytes},
 * validateImageUpload(...) returns valid: true iff ALL of:
 * - sizeBytes <= 2 * 1024 * 1024
 * - declaredExtension in {png, jpg, jpeg, webp, gif}
 * - The sniffed type from magicBytes matches declaredExtension
 *   (with jpg/jpeg both treated as JPEG; webp requires RIFF + WEBP markers)
 *
 * In particular, an upload with valid PNG magic bytes but a .jpg extension
 * MUST be rejected, and vice versa.
 */

const MAX_SIZE = 2 * 1024 * 1024;

// Known magic byte headers for each image type
const MAGIC_BYTES = {
  png: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  jpeg: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]),
  gif: new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]),
  webp: new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  ]),
} as const;

// Map from extension to the sniffed type it should match
type SniffedType = "png" | "jpeg" | "gif" | "webp";

function extensionToType(ext: string): SniffedType | null {
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

// Arbitrary for valid extensions
const validExtensionArb = fc.constantFrom("png", "jpg", "jpeg", "webp", "gif");

// Arbitrary for magic bytes matching a given type
function magicBytesForType(type: SniffedType): fc.Arbitrary<Uint8Array> {
  const base = MAGIC_BYTES[type];
  // Append random trailing bytes to simulate real file content
  return fc.uint8Array({ minLength: 0, maxLength: 20 }).map((trailing) => {
    const result = new Uint8Array(base.length + trailing.length);
    result.set(base);
    result.set(trailing, base.length);
    return result;
  });
}

// Arbitrary for a fully valid input (correct magic + matching extension + valid size)
const validInputArb = validExtensionArb.chain((ext) => {
  const type = extensionToType(ext)!;
  return fc.record({
    sizeBytes: fc.integer({ min: 0, max: MAX_SIZE }),
    declaredExtension: fc.constant(ext),
    magicBytes: magicBytesForType(type),
  });
});

describe("validate-image — Property 5: Image upload validation", () => {
  it("valid inputs (correct magic bytes + matching extension + size <= 2MB) return valid: true", () => {
    fc.assert(
      fc.property(validInputArb, (input) => {
        const result = validateImageUpload(input);
        expect(result).toEqual({ valid: true });
      }),
      { numRuns: 100 }
    );
  });

  it("oversize files are always rejected", () => {
    // Generate valid magic/extension combos but with size > 2MB
    const oversizeArb = validExtensionArb.chain((ext) => {
      const type = extensionToType(ext)!;
      return fc.record({
        sizeBytes: fc.integer({ min: MAX_SIZE + 1, max: MAX_SIZE * 10 }),
        declaredExtension: fc.constant(ext),
        magicBytes: magicBytesForType(type),
      });
    });

    fc.assert(
      fc.property(oversizeArb, (input) => {
        const result = validateImageUpload(input);
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.reason).toContain("2 MB");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("mismatched magic bytes and extension are rejected", () => {
    // Generate inputs where magic bytes don't match the declared extension
    const allTypes: SniffedType[] = ["png", "jpeg", "gif", "webp"];
    const allExtensions = ["png", "jpg", "jpeg", "webp", "gif"];

    const mismatchArb = fc
      .record({
        typeIndex: fc.integer({ min: 0, max: allTypes.length - 1 }),
        extIndex: fc.integer({ min: 0, max: allExtensions.length - 1 }),
        sizeBytes: fc.integer({ min: 0, max: MAX_SIZE }),
      })
      .filter(({ typeIndex, extIndex }) => {
        // Ensure the magic type doesn't match the extension
        const magicType = allTypes[typeIndex];
        const ext = allExtensions[extIndex];
        const expectedType = extensionToType(ext);
        return magicType !== expectedType;
      })
      .chain(({ typeIndex, extIndex, sizeBytes }) => {
        const magicType = allTypes[typeIndex];
        const ext = allExtensions[extIndex];
        return magicBytesForType(magicType).map((magicBytes) => ({
          sizeBytes,
          declaredExtension: ext,
          magicBytes,
        }));
      });

    fc.assert(
      fc.property(mismatchArb, (input) => {
        const result = validateImageUpload(input);
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.reason).toContain("content is");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("unknown extensions are rejected", () => {
    // Generate extensions NOT in the allowed set
    const unknownExtArb = fc
      .string({ minLength: 1, maxLength: 10 })
      .filter(
        (s) => !["png", "jpg", "jpeg", "webp", "gif"].includes(s.toLowerCase())
      );

    const unknownExtInputArb = fc.record({
      sizeBytes: fc.integer({ min: 0, max: MAX_SIZE }),
      declaredExtension: unknownExtArb,
      magicBytes: fc.uint8Array({ minLength: 12, maxLength: 20 }),
    });

    fc.assert(
      fc.property(unknownExtInputArb, (input) => {
        const result = validateImageUpload(input);
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.reason).toContain("not allowed");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("adversarial: random magic bytes that don't match any known type are rejected", () => {
    // Generate random bytes that don't start with any known magic signature
    const adversarialMagicArb = fc
      .uint8Array({ minLength: 12, maxLength: 30 })
      .filter((bytes) => {
        // Exclude PNG signature
        if (
          bytes.length >= 4 &&
          bytes[0] === 0x89 &&
          bytes[1] === 0x50 &&
          bytes[2] === 0x4e &&
          bytes[3] === 0x47
        ) {
          return false;
        }
        // Exclude JPEG signature
        if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
          return false;
        }
        // Exclude GIF signature
        if (
          bytes.length >= 4 &&
          bytes[0] === 0x47 &&
          bytes[1] === 0x49 &&
          bytes[2] === 0x46 &&
          bytes[3] === 0x38
        ) {
          return false;
        }
        // Exclude WEBP signature (RIFF....WEBP)
        if (
          bytes.length >= 12 &&
          bytes[0] === 0x52 &&
          bytes[1] === 0x49 &&
          bytes[2] === 0x46 &&
          bytes[3] === 0x46 &&
          bytes[8] === 0x57 &&
          bytes[9] === 0x45 &&
          bytes[10] === 0x42 &&
          bytes[11] === 0x50
        ) {
          return false;
        }
        return true;
      });

    const adversarialInputArb = fc.record({
      sizeBytes: fc.integer({ min: 0, max: MAX_SIZE }),
      declaredExtension: validExtensionArb,
      magicBytes: adversarialMagicArb,
    });

    fc.assert(
      fc.property(adversarialInputArb, (input) => {
        const result = validateImageUpload(input);
        expect(result.valid).toBe(false);
        if (!result.valid) {
          // Should fail either because magic bytes are unrecognized or because they mismatch
          expect(
            result.reason.includes("Unable to determine") ||
              result.reason.includes("content is")
          ).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });
});
