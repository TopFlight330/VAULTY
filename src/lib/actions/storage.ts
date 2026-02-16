"use server";

import { createClient } from "@/lib/supabase/server";

export async function createSignedUploadUrl(
  bucket: string,
  path: string
): Promise<{ signedUrl: string; token: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Ensure path starts with user's own folder
  if (!path.startsWith(user.id + "/")) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error) {
    console.error("Signed URL error:", error.message);
    return null;
  }

  return { signedUrl: data.signedUrl, token: data.token };
}
