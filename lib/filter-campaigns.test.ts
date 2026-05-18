import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { filterCampaigns } from "./filter-campaigns";

/**
 * Property 13: Discovery search filter
 * Validates: Requirements 12.3
 *
 * For any list of campaigns and query string q:
 * 1. Soundness: every item in the result contains q (case-insensitive) in name or creator
 * 2. Completeness: every item in the input that matches appears in the result
 * 3. Empty-query identity: when q === "", the result is the same reference as the input
 */
describe("filter-campaigns — Property 13: Discovery search filter", () => {
  const campaignArb = fc.record({
    createdAt: fc.integer(),
    name: fc.string(),
    creator: fc.string(),
  });

  const campaignListArb = fc.array(campaignArb);
  const queryArb = fc.string();

  function matches(item: { name: string; creator: string }, q: string): boolean {
    const lower = q.toLowerCase();
    return (
      item.name.toLowerCase().includes(lower) ||
      item.creator.toLowerCase().includes(lower)
    );
  }

  it("soundness: every item in the result contains q in name or creator (case-insensitive)", () => {
    fc.assert(
      fc.property(campaignListArb, queryArb, (list, q) => {
        const result = filterCampaigns(list, q);

        for (const item of result) {
          expect(matches(item, q)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("completeness: every input item matching q appears in the result", () => {
    fc.assert(
      fc.property(campaignListArb, queryArb, (list, q) => {
        const result = filterCampaigns(list, q);

        for (const item of list) {
          if (matches(item, q)) {
            expect(result).toContain(item);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("empty-query identity: when q is empty, result is the same reference as input", () => {
    fc.assert(
      fc.property(campaignListArb, (list) => {
        const result = filterCampaigns(list, "");
        expect(result).toBe(list);
      }),
      { numRuns: 100 }
    );
  });
});
