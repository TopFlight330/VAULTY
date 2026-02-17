import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, R2_BUCKET } from "@/lib/r2/client";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Authenticate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const path = formData.get("path") as string | null;

  if (!file || !path) {
    return NextResponse.json({ error: "Missing file or path" }, { status: 400 });
  }

  // Ensure path starts with user's own folder
  if (!path.startsWith(user.id + "/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 403 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const client = getR2Client();
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: path,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      })
    );
    return NextResponse.json({ success: true, path });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[R2 API] Upload error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
