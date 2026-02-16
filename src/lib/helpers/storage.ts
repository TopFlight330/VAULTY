import { createClient } from "@/lib/supabase/client";
import { createSignedUploadUrl } from "@/lib/actions/storage";

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
 * Upload a file using a server-signed URL + XHR for real progress.
 * 1. Server action creates a signed upload URL (authenticated server-side)
 * 2. Client uploads directly via XHR to the signed URL (with progress tracking)
 */
export async function uploadFileWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<string | null> {
  // Step 1: Get signed upload URL from server
  onProgress(1);
  const signed = await createSignedUploadUrl(bucket, path);
  if (!signed) {
    console.error("[UPLOAD] Failed to get signed URL");
    onProgress(0);
    return null;
  }

  // Step 2: Upload via XHR to the signed URL with real progress
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        // Map 0-100 of actual upload to 5-100 (reserve 0-5 for signed URL step)
        const pct = Math.round(5 + (e.loaded / e.total) * 95);
        onProgress(pct);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve(path);
      } else {
        console.error("[UPLOAD] Failed:", xhr.status, xhr.responseText);
        onProgress(0);
        resolve(null);
      }
    });

    xhr.addEventListener("error", () => {
      console.error("[UPLOAD] Network error");
      onProgress(0);
      resolve(null);
    });

    xhr.open("PUT", signed.signedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
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
