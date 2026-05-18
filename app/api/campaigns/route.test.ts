import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { POST, GET } from "./route";

const { mockStore, mockCreatorRef } = vi.hoisted(() => {
  const store: any[] = [];
  const creatorRef = { current: "0x" + "a".repeat(40) as string };
  return { mockStore: store, mockCreatorRef: creatorRef };
});

vi.mock("viem", () => ({
  createPublicClient: () => ({
    readContract: async () => [mockCreatorRef.current],
  }),
  http: () => ({}),
}));

vi.mock("viem/chains", () => ({
  baseSepolia: {},
}));

vi.mock("@/lib/db", () => {
  const queryHandler: any = {
    where: () => queryHandler,
    orderBy: () => queryHandler,
    limit: () => Promise.resolve([...mockStore]),
  };

  return {
    db: {
      insert: () => ({
        values: (data: any) => ({
          returning: () => {
            const record = { ...data, createdAt: new Date().toISOString() };
            mockStore.push(record);
            return [record];
          },
        }),
      }),
      select: () => ({
        from: () => queryHandler,
      }),
    },
  };
});

const validCampaignPayloadArb = fc
  .record({
    campaignId: fc.bigInt({ min: BigInt(1) }).map(String),
    creator: fc.constant("0x" + "a".repeat(40) as `0x${string}`),
    name: fc.string({ minLength: 1, maxLength: 80 }),
    description: fc.string({ minLength: 0, maxLength: 500 }),
    imageUrl: fc.string({ minLength: 1 }),
    maxSupply: fc.integer({ min: 1, max: 10000 }),
    startTime: fc.integer(),
    delta: fc.integer({ min: 1, max: 1_000_000 }),
    soulbound: fc.boolean(),
  })
  .map(({ delta, startTime, ...rest }) => ({
    ...rest,
    startTime,
    endTime: startTime + delta,
  }));

describe("Campaign API — Property 10: Metadata round-trip via API", () => {
  beforeEach(() => {
    mockStore.length = 0;
  });

  it("POST then GET returns the same campaign data", async () => {
    await fc.assert(
      fc.asyncProperty(validCampaignPayloadArb, async (payload) => {
        mockStore.length = 0;
        mockCreatorRef.current = payload.creator;

        const postRes = await POST(
          new Request("http://localhost:3000/api/campaigns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        );
        expect(postRes.status).toBe(201);
        const created = await postRes.json();
        expect(created.campaignId).toBe(payload.campaignId);

        const getRes = await GET(
          new Request("http://localhost:3000/api/campaigns")
        );
        expect(getRes.status).toBe(200);
        const list = await getRes.json();
        expect(Array.isArray(list)).toBe(true);

        const found = list.find(
          (c: any) => c.campaignId === payload.campaignId
        );
        expect(found).toBeDefined();

        for (const [key, value] of Object.entries(payload)) {
          expect(found[key]).toEqual(value);
        }
        expect(found.createdAt).toBeDefined();
      }),
      { numRuns: 50 }
    );
  });
});
