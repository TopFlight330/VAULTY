"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createSignedUploadUrl(
  bucket: string,
  path: string
): Promise<{ signedUrl: string; token: string } | null> {
  // Verify auth with regular client
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Ensure path starts with user's own folder
  if (!path.startsWith(user.id + "/")) return null;

  // Use admin client to bypass storage policies
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error) {
    console.error("Signed URL error:", error.message);
    return null;
  }

  return { signedUrl: data.signedUrl, token: data.token };
}

/**
 * Upload a file directly via admin client (bypasses all storage policies).
 * Accepts base64-encoded file data from the client.
 */
export async function uploadFileDirect(
  bucket: string,
  path: string,
  base64Data: string,
  contentType: string
): Promise<{ publicUrl: string } | null> {
  // Verify auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Ensure path starts with user's own folder
  if (!path.startsWith(user.id + "/")) return null;

  // Decode base64 to Buffer
  const buffer = Buffer.from(base64Data, "base64");

  // Upload via admin client
  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error("Direct upload error:", error.message);
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}?t=${Date.now()}`;
  return { publicUrl };
}
