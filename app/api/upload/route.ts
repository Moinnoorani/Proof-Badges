import { validateImageUpload } from "@/lib/validate-image";
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.length > 2 * 1024 * 1024) {
    return Response.json({ error: "File size exceeds 2 MB limit" }, { status: 400 });
  }

  const name = file.name;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const magicBytes = new Uint8Array(buffer.slice(0, 12));

  const validation = validateImageUpload({
    sizeBytes: buffer.length,
    declaredExtension: ext,
    magicBytes,
  });

  if (!validation.valid) {
    return Response.json({ error: validation.reason }, { status: 400 });
  }

  const filename = `${randomUUID()}.${ext}`;

  try {
    const blob = await put(`campaigns/${filename}`, buffer, { access: "public" });
    return Response.json({ url: blob.url }, { status: 201 });
  } catch {
    const localDir = join(process.cwd(), "public", "uploads");
    await mkdir(localDir, { recursive: true });
    await writeFile(join(localDir, filename), buffer);
    const url = `/uploads/${filename}`;
    return Response.json({ url }, { status: 201 });
  }
}
