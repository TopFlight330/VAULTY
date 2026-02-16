import { createClient } from "@/lib/supabase/client";

export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
  });
  if (error) {
    console.error("Upload error:", error.message);
    return null;
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload a file via the Supabase SDK.
 * Returns the storage path on success, or null on failure.
 */
export async function uploadFileWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<string | null> {
  console.log("[UPLOAD] Starting:", file.name, file.size);
  const supabase = createClient();
  onProgress(10);

  try {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
    });

    if (error) {
      console.error("[UPLOAD] Failed:", error.message);
      onProgress(0);
      return null;
    }

    console.log("[UPLOAD] Success:", data?.path);
    onProgress(100);
    return path;
  } catch (err) {
    console.error("[UPLOAD] Exception:", err);
    onProgress(0);
    return null;
  }
}

export async function deleteFile(
  bucket: string,
  path: string
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return !error;
}

export function getPublicUrl(bucket: string, path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
