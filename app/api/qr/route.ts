import { NextRequest } from "next/server";
import qrcode from "qrcode";

export async function GET(request: NextRequest) {
  const campaignId = request.nextUrl.searchParams.get("campaignId");

  if (!campaignId) {
    return Response.json({ error: "campaignId query parameter is required" }, { status: 400 });
  }

  const url = `${request.nextUrl.origin}/claim/${campaignId}`;

  const buffer = await qrcode.toBuffer(url);
  const body = new Uint8Array(buffer);

  return new Response(body, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="claim-${campaignId}.png"`,
    },
  });
}
