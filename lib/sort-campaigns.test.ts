import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { sortCampaignsByRecency } from "./sort-campaigns";

/**
 * Property 12: Discovery sort order
 * Validates: Requirements 12.1
 *
 * For any list of campaigns with random createdAt values,
 * sortCampaignsByRecency returns a permutation of the input
 * sorted in descending order by createdAt.
 */
describe("sort-campaigns — Property 12: Discovery sort order", () => {
  const campaignArb = fc.record({
    createdAt: fc.integer(),
    name: fc.string(),
    creator: fc.string(),
  });

  const campaignListArb = fc.array(campaignArb);

  it("output is a permutation of the input (same length, same elements)", () => {
    fc.assert(
      fc.property(campaignListArb, (campaigns) => {
        const sorted = sortCampaignsByRecency(campaigns);

        // Same length
        expect(sorted.length).toBe(campaigns.length);

        // Same elements (permutation check): sort both by a stable key and compare
        const normalize = (list: typeof campaigns) =>
          [...list].sort((a, b) => {
            if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
            if (a.name !== b.name) return a.name < b.name ? -1 : 1;
            return a.creator < b.creator ? -1 : a.creator > b.creator ? 1 : 0;
          });

        expect(normalize(sorted)).toEqual(normalize(campaigns));
      }),
      { numRuns: 100 }
    );
  });

  it("adjacent pairs satisfy output[i].createdAt >= output[i+1].createdAt (descending order)", () => {
    fc.assert(
      fc.property(campaignListArb, (campaigns) => {
        const sorted = sortCampaignsByRecency(campaigns);

        for (let i = 0; i < sorted.length - 1; i++) {
          expect(sorted[i].createdAt).toBeGreaterThanOrEqual(
            sorted[i + 1].createdAt
          );
        }
      }),
      { numRuns: 100 }
    );
  });
});
