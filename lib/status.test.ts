import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { deriveStatus } from "./status";

/**
 * Property 2: Campaign status derivation
 * Validates: Requirements 1.6
 *
 * For any tuple (startTime, endTime, maxSupply, mintedCount, now) with
 * endTime > startTime and 0 ≤ mintedCount ≤ maxSupply, deriveStatus returns
 * the correct status following strict precedence:
 *   1. sold_out (mintedCount >= maxSupply) — regardless of time
 *   2. upcoming (now < startTime)
 *   3. ended (now >= endTime)
 *   4. active (otherwise)
 */
describe("deriveStatus — Property 2: Campaign status derivation", () => {
  const campaignArb = fc
    .record({
      startTime: fc.integer(),
      delta: fc.integer({ min: 1 }), // ensures endTime > startTime
      maxSupply: fc.integer({ min: 1 }),
      mintedFraction: fc.integer({ min: 0, max: 1_000_000 }),
      now: fc.integer(),
    })
    .map(({ startTime, delta, maxSupply, mintedFraction, now }) => ({
      startTime,
      endTime: startTime + delta,
      maxSupply,
      // mintedCount in [0, maxSupply]
      mintedCount: mintedFraction % (maxSupply + 1),
      now,
    }));

  it("returns sold_out when mintedCount >= maxSupply regardless of time", () => {
    fc.assert(
      fc.property(
        fc.record({
          startTime: fc.integer(),
          delta: fc.integer({ min: 1 }),
          maxSupply: fc.integer({ min: 1 }),
          now: fc.integer(),
        }),
        ({ startTime, delta, maxSupply, now }) => {
          const endTime = startTime + delta;
          // mintedCount == maxSupply (sold out)
          const result = deriveStatus(
            { startTime, endTime, maxSupply, mintedCount: maxSupply },
            now
          );
          expect(result).toBe("sold_out");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns upcoming when mintedCount < maxSupply and now < startTime", () => {
    fc.assert(
      fc.property(
        fc.record({
          startTime: fc.integer(),
          delta: fc.integer({ min: 1 }),
          maxSupply: fc.integer({ min: 2 }),
          now: fc.integer(),
        }),
        ({ startTime, delta, maxSupply, now }) => {
          const endTime = startTime + delta;
          const mintedCount = maxSupply - 1; // not sold out
          // Only test when now < startTime
          fc.pre(now < startTime);
          const result = deriveStatus(
            { startTime, endTime, maxSupply, mintedCount },
            now
          );
          expect(result).toBe("upcoming");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns ended when mintedCount < maxSupply and now >= endTime", () => {
    fc.assert(
      fc.property(
        fc.record({
          startTime: fc.integer(),
          delta: fc.integer({ min: 1 }),
          maxSupply: fc.integer({ min: 2 }),
          now: fc.integer(),
        }),
        ({ startTime, delta, maxSupply, now }) => {
          const endTime = startTime + delta;
          const mintedCount = maxSupply - 1; // not sold out
          // Only test when now >= endTime (which also means now >= startTime since endTime > startTime)
          fc.pre(now >= endTime);
          const result = deriveStatus(
            { startTime, endTime, maxSupply, mintedCount },
            now
          );
          expect(result).toBe("ended");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("returns active when mintedCount < maxSupply and startTime <= now < endTime", () => {
    fc.assert(
      fc.property(
        fc.record({
          startTime: fc.integer(),
          delta: fc.integer({ min: 2 }), // need room between start and end
          maxSupply: fc.integer({ min: 2 }),
          nowOffset: fc.integer({ min: 0 }),
        }),
        ({ startTime, delta, maxSupply, nowOffset }) => {
          const endTime = startTime + delta;
          const mintedCount = maxSupply - 1; // not sold out
          // now in [startTime, endTime)
          const now = startTime + (nowOffset % delta);
          // Ensure now is actually in range (modulo can be negative for negative nowOffset)
          fc.pre(now >= startTime && now < endTime);
          const result = deriveStatus(
            { startTime, endTime, maxSupply, mintedCount },
            now
          );
          expect(result).toBe("active");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("exhaustive precedence: result is always one of the four statuses and cases are mutually exclusive", () => {
    fc.assert(
      fc.property(campaignArb, ({ startTime, endTime, maxSupply, mintedCount, now }) => {
        const result = deriveStatus(
          { startTime, endTime, maxSupply, mintedCount },
          now
        );

        // Result must be one of the four valid statuses
        expect(["upcoming", "active", "ended", "sold_out"]).toContain(result);

        // Verify precedence-ordered case mapping
        if (mintedCount >= maxSupply) {
          expect(result).toBe("sold_out");
        } else if (now < startTime) {
          expect(result).toBe("upcoming");
        } else if (now >= endTime) {
          expect(result).toBe("ended");
        } else {
          expect(result).toBe("active");
        }
      }),
      { numRuns: 200 }
    );
  });
});
