import { createClient } from "@/lib/supabase/client";
import { createSignedUploadUrl } from "@/lib/actions/storage";
import { deleteR2File } from "@/lib/actions/r2-storage";

/**
 * Upload a file to R2 using a presigned URL + XHR for real progress.
 * Used for post media (images/videos).
 */
export async function uploadFileWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<string | null> {
  onProgress(1);

  // Use R2 for post-media, Supabase for other buckets (avatars, banners)
  if (bucket === "post-media") {
    return uploadToR2(path, file, onProgress);
  }

  // Fallback to Supabase signed URL for non-R2 buckets
  return uploadToSupabase(bucket, path, file, onProgress);
}

async function uploadToR2(
  path: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("path", path);

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const pct = Math.round(5 + (e.loaded / e.total) * 95);
        onProgress(pct);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve(path);
      } else {
        console.error("[R2 UPLOAD] Failed:", xhr.status, xhr.responseText);
        onProgress(0);
        resolve(null);
      }
    });

    xhr.addEventListener("error", () => {
      console.error("[R2 UPLOAD] Network error");
      onProgress(0);
      resolve(null);
    });

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  });
}

async function uploadToSupabase(
  bucket: string,
  path: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<string | null> {
  const signed = await createSignedUploadUrl(bucket, path);
  if (!signed) {
    console.error("[UPLOAD] Failed to get signed URL");
    onProgress(0);
    return null;
  }

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
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
 * Delete a file. Uses R2 for post-media, Supabase for other buckets.
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<boolean> {
  if (bucket === "post-media") {
    return deleteR2File(path);
  }
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return !error;
}

export function getPublicUrl(bucket: string, path: string): string {
  if (bucket === "post-media") {
    const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    return `${r2Url}/${path}`;
  }
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
