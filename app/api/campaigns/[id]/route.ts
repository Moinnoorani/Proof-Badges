import { db } from "@/lib/db";
import { campaigns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const [record] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.campaignId, id))
    .limit(1);

  if (!record) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }

  return Response.json({
    ...record,
    id: record.campaignId,
  });
}
