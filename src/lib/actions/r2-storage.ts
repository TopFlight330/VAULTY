"use server";

import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client, R2_BUCKET } from "@/lib/r2/client";
import { createClient } from "@/lib/supabase/server";

/**
 * Generate a presigned PUT URL for direct client upload to R2.
 * The user must be authenticated and the path must start with their user ID.
 */
export async function createR2UploadUrl(
  path: string,
  contentType: string
): Promise<{ uploadUrl: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Ensure path starts with user's own folder
  if (!path.startsWith(user.id + "/")) return null;

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: path,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 });
  return { uploadUrl };
}

/**
 * Delete a file from R2 storage.
 */
export async function deleteR2File(path: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  if (!path.startsWith(user.id + "/")) return false;

  const client = getR2Client();
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: path,
      })
    );
    return true;
  } catch {
    return false;
  }
}
