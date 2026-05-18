import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateCampaignForm } from "./validate-campaign";

/**
 * Property 4: Campaign form validation
 * Validates: Requirements 5.1, 5.2, 5.3
 *
 * For any generated form input {name, description, imageUrl, maxSupply, startTime, endTime, soulbound},
 * validateCampaignForm(input) returns valid: true iff ALL of the following hold:
 * - name.length between 1 and 80
 * - description.length between 0 and 500
 * - imageUrl is a non-empty string
 * - 1 ≤ maxSupply ≤ 10000
 * - endTime > startTime
 * - soulbound is a boolean
 *
 * If any condition fails, the result is valid: false and the failing field is reported in errors.
 */
describe("validateCampaignForm — Property 4: Campaign form validation", () => {
  // Arbitrary for valid campaign inputs
  const validCampaignArb = fc
    .record({
      name: fc.string({ minLength: 1, maxLength: 80 }),
      description: fc.string({ minLength: 0, maxLength: 500 }),
      imageUrl: fc.string({ minLength: 1 }),
      maxSupply: fc.integer({ min: 1, max: 10000 }),
      startTime: fc.integer(),
      delta: fc.integer({ min: 1, max: 1_000_000 }),
      soulbound: fc.boolean(),
    })
    .map(({ startTime, delta, ...rest }) => ({
      ...rest,
      startTime,
      endTime: startTime + delta, // ensures endTime > startTime
    }));

  // Arbitrary for random campaign-like inputs (may be valid or invalid)
  const campaignInputArb = fc.record({
    name: fc.oneof(
      fc.string({ minLength: 0, maxLength: 100 }),
      fc.constant(""),
      fc.string({ minLength: 81, maxLength: 120 })
    ),
    description: fc.oneof(
      fc.string({ minLength: 0, maxLength: 600 }),
      fc.string({ minLength: 501, maxLength: 600 })
    ),
    imageUrl: fc.oneof(
      fc.string({ minLength: 0, maxLength: 50 }),
      fc.constant("")
    ),
    maxSupply: fc.oneof(
      fc.integer({ min: -100, max: 20000 }),
      fc.double({ min: 0.1, max: 10000, noNaN: true }),
      fc.constant(0),
      fc.constant(1),
      fc.constant(9999),
      fc.constant(10000),
      fc.constant(10001)
    ),
    startTime: fc.integer(),
    endTime: fc.integer(),
    soulbound: fc.boolean(),
  });

  it("valid inputs always return {valid: true}", () => {
    fc.assert(
      fc.property(validCampaignArb, (input) => {
        const result = validateCampaignForm(input);
        expect(result).toEqual({ valid: true });
      }),
      { numRuns: 100 }
    );
  });

  it("invalid inputs always return {valid: false, errors} with the correct field", () => {
    fc.assert(
      fc.property(campaignInputArb, (input) => {
        const result = validateCampaignForm(input);

        const nameValid =
          typeof input.name === "string" &&
          input.name.length >= 1 &&
          input.name.length <= 80;
        const descriptionValid =
          typeof input.description === "string" &&
          input.description.length <= 500;
        const imageUrlValid =
          typeof input.imageUrl === "string" && input.imageUrl.length >= 1;
        const maxSupplyValid =
          Number.isInteger(input.maxSupply) &&
          input.maxSupply >= 1 &&
          input.maxSupply <= 10000;
        const timeValid = input.endTime > input.startTime;
        const soulboundValid = typeof input.soulbound === "boolean";

        const allValid =
          nameValid &&
          descriptionValid &&
          imageUrlValid &&
          maxSupplyValid &&
          timeValid &&
          soulboundValid;

        if (allValid) {
          expect(result).toEqual({ valid: true });
        } else {
          expect(result.valid).toBe(false);
          if (!result.valid) {
            // Check that the correct fields are reported
            if (!nameValid) {
              expect(result.errors).toHaveProperty("name");
            }
            if (!descriptionValid) {
              expect(result.errors).toHaveProperty("description");
            }
            if (!imageUrlValid) {
              expect(result.errors).toHaveProperty("imageUrl");
            }
            if (!maxSupplyValid) {
              expect(result.errors).toHaveProperty("maxSupply");
            }
            // endTime error only reported when other fields pass their individual validation
            // because zod refine runs after object parsing
            if (!timeValid && nameValid && descriptionValid && imageUrlValid && maxSupplyValid && soulboundValid) {
              expect(result.errors).toHaveProperty("endTime");
            }
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  // Boundary cases
  describe("boundary cases", () => {
    const baseValid = {
      name: "Test Campaign",
      description: "",
      imageUrl: "https://example.com/img.png",
      maxSupply: 100,
      startTime: 1000,
      endTime: 2000,
      soulbound: false,
    };

    it("maxSupply at 0 is invalid", () => {
      const result = validateCampaignForm({ ...baseValid, maxSupply: 0 });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toHaveProperty("maxSupply");
      }
    });

    it("maxSupply at 1 is valid", () => {
      const result = validateCampaignForm({ ...baseValid, maxSupply: 1 });
      expect(result).toEqual({ valid: true });
    });

    it("maxSupply at 10000 is valid", () => {
      const result = validateCampaignForm({ ...baseValid, maxSupply: 10000 });
      expect(result).toEqual({ valid: true });
    });

    it("maxSupply at 10001 is invalid", () => {
      const result = validateCampaignForm({ ...baseValid, maxSupply: 10001 });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toHaveProperty("maxSupply");
      }
    });

    it("equal timestamps (endTime === startTime) is invalid", () => {
      const result = validateCampaignForm({
        ...baseValid,
        startTime: 1000,
        endTime: 1000,
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toHaveProperty("endTime");
      }
    });

    it("inverted timestamps (endTime < startTime) is invalid", () => {
      const result = validateCampaignForm({
        ...baseValid,
        startTime: 2000,
        endTime: 1000,
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toHaveProperty("endTime");
      }
    });

    it("empty name is invalid", () => {
      const result = validateCampaignForm({ ...baseValid, name: "" });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toHaveProperty("name");
      }
    });

    it("81-char name is invalid", () => {
      const result = validateCampaignForm({
        ...baseValid,
        name: "a".repeat(81),
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toHaveProperty("name");
      }
    });

    it("80-char name is valid", () => {
      const result = validateCampaignForm({
        ...baseValid,
        name: "a".repeat(80),
      });
      expect(result).toEqual({ valid: true });
    });

    it("501-char description is invalid", () => {
      const result = validateCampaignForm({
        ...baseValid,
        description: "a".repeat(501),
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toHaveProperty("description");
      }
    });

    it("500-char description is valid", () => {
      const result = validateCampaignForm({
        ...baseValid,
        description: "a".repeat(500),
      });
      expect(result).toEqual({ valid: true });
    });

    it("empty imageUrl is invalid", () => {
      const result = validateCampaignForm({ ...baseValid, imageUrl: "" });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toHaveProperty("imageUrl");
      }
    });
  });

  it("property: supply boundary values (0, 1, 9999, 10000, 10001) are correctly classified", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(0, 1, 9999, 10000, 10001),
        fc.integer({ min: 1, max: 1_000_000 }),
        (supply, delta) => {
          const input = {
            name: "Valid Name",
            description: "Valid description",
            imageUrl: "https://example.com/img.png",
            maxSupply: supply,
            startTime: 1000,
            endTime: 1000 + delta,
            soulbound: true,
          };
          const result = validateCampaignForm(input);
          if (supply >= 1 && supply <= 10000) {
            expect(result).toEqual({ valid: true });
          } else {
            expect(result.valid).toBe(false);
            if (!result.valid) {
              expect(result.errors).toHaveProperty("maxSupply");
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("property: equal or inverted timestamps always produce endTime error", () => {
    fc.assert(
      fc.property(
        fc.integer(),
        fc.integer({ min: 0 }), // offset to subtract (0 = equal, >0 = inverted)
        (startTime, offset) => {
          const endTime = startTime - offset; // endTime <= startTime
          const input = {
            name: "Valid Name",
            description: "",
            imageUrl: "https://example.com/img.png",
            maxSupply: 100,
            startTime,
            endTime,
            soulbound: false,
          };
          const result = validateCampaignForm(input);
          expect(result.valid).toBe(false);
          if (!result.valid) {
            expect(result.errors).toHaveProperty("endTime");
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
