import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { Badge, groupBadgesByCampaign } from "./group-badges";

/**
 * Property 7: Badge grouping by campaign
 * Validates: Requirements 7.2
 *
 * For any list of badges, groupBadgesByCampaign returns a map such that:
 * - Every input badge appears in exactly one group keyed by its own campaignId.
 * - The multiset union of all group values equals the input list.
 * - No group is empty.
 */
describe("group-badges — Property 7: Badge grouping", () => {
  // Use a small set of campaign IDs to ensure grouping is exercised
  const campaignIdArb = fc.constantFrom("c1", "c2", "c3", "c4", "c5");
  const tokenIdArb = fc.string({ minLength: 1, maxLength: 10 });

  const badgeArb: fc.Arbitrary<Badge> = fc.record({
    campaignId: campaignIdArb,
    tokenId: tokenIdArb,
    imageUrl: fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
      nil: undefined,
    }),
    name: fc.option(fc.string({ minLength: 1, maxLength: 30 }), {
      nil: undefined,
    }),
    mintTimestamp: fc.option(fc.nat(), { nil: undefined }),
    soulbound: fc.option(fc.boolean(), { nil: undefined }),
  });

  const badgeListArb = fc.array(badgeArb, { minLength: 0, maxLength: 50 });

  it("every badge appears in exactly one group keyed by its own campaignId", () => {
    fc.assert(
      fc.property(badgeListArb, (badges) => {
        const groups = groupBadgesByCampaign(badges);

        for (const badge of badges) {
          // Badge must be in the group keyed by its campaignId
          const group = groups[badge.campaignId];
          expect(group).toBeDefined();
          expect(group).toContain(badge);

          // Badge must NOT appear in any other group
          for (const [key, groupBadges] of Object.entries(groups)) {
            if (key !== badge.campaignId) {
              expect(groupBadges).not.toContain(badge);
            }
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("multiset union of all groups equals the input (same total count, same elements)", () => {
    fc.assert(
      fc.property(badgeListArb, (badges) => {
        const groups = groupBadgesByCampaign(badges);

        // Collect all badges from all groups
        const allGrouped: Badge[] = Object.values(groups).flat();

        // Same total count
        expect(allGrouped.length).toBe(badges.length);

        // Same elements (by reference, preserving duplicates)
        // Sort both arrays by a stable key to compare multisets
        const toKey = (b: Badge) => JSON.stringify(b);
        const sortedInput = [...badges].sort((a, b) =>
          toKey(a).localeCompare(toKey(b))
        );
        const sortedGrouped = [...allGrouped].sort((a, b) =>
          toKey(a).localeCompare(toKey(b))
        );
        expect(sortedGrouped).toEqual(sortedInput);
      }),
      { numRuns: 100 }
    );
  });

  it("no group is empty", () => {
    fc.assert(
      fc.property(badgeListArb, (badges) => {
        const groups = groupBadgesByCampaign(badges);

        for (const [, groupBadges] of Object.entries(groups)) {
          expect(groupBadges.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });
});
