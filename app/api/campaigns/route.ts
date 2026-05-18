import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";
import { campaignSchema } from "@/lib/validate-campaign";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { BADGE_CONTRACT_ADDRESS, BASE_SEPOLIA_RPC } from "@/lib/public-env";
import { ilike, or, desc } from "drizzle-orm";

const badgeContractAbi = [
  {
    type: "function",
    name: "campaigns",
    inputs: [{ type: "uint256" }],
    outputs: [
      { type: "address", name: "creator" },
      { type: "uint256", name: "maxSupply" },
      { type: "uint256", name: "mintedCount" },
      { type: "uint256", name: "startTime" },
      { type: "uint256", name: "endTime" },
      { type: "bool", name: "soulbound" },
      { type: "bool", name: "exists" },
    ],
    stateMutability: "view",
  },
] as const;

export async function POST(request: Request) {
  const body = await request.json();
  const { campaignId, creator, ...formFields } = body;

  if (!campaignId || typeof campaignId !== "string") {
    return Response.json({ error: "Invalid campaignId" }, { status: 400 });
  }

  if (!creator || typeof creator !== "string" || !creator.startsWith("0x")) {
    return Response.json({ error: "Invalid creator address" }, { status: 400 });
  }

  const parsed = campaignSchema.safeParse(formFields);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
  }

  try {
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(BASE_SEPOLIA_RPC),
    });

    const [onChainCreator] = await publicClient.readContract({
      address: BADGE_CONTRACT_ADDRESS,
      abi: badgeContractAbi,
      functionName: "campaigns",
      args: [BigInt(campaignId)],
    });

    if (onChainCreator.toLowerCase() !== creator.toLowerCase()) {
      return Response.json({ error: "Creator does not match on-chain data" }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "On-chain verification failed" }, { status: 502 });
  }

  const [record] = await db.insert(campaigns).values({
    campaignId,
    name: parsed.data.name,
    description: parsed.data.description,
    imageUrl: parsed.data.imageUrl,
    maxSupply: parsed.data.maxSupply,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    soulbound: parsed.data.soulbound,
    creator,
  }).returning();

  return Response.json(record, { status: 201 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const query = db.select().from(campaigns);

  let filtered: any = query;
  if (q) {
    filtered = query.where(
      or(
        ilike(campaigns.name, `%${q}%`),
        ilike(campaigns.creator, `%${q}%`)
      )
    );
  }

  const records = await filtered.orderBy(desc(campaigns.createdAt)).limit(60);
  return Response.json(records);
}
