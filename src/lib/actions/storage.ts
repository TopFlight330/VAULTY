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
