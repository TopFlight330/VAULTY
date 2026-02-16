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
 * Upload a file with real-time progress tracking via XMLHttpRequest.
 * Returns the storage path on success, or null on failure.
 */
export function uploadFileWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<string | null> {
  return new Promise((resolve) => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        console.error("Upload failed: no active session");
        resolve(null);
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const token = session.access_token;

      const xhr = new XMLHttpRequest();
      const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(path);
        } else {
          console.error("Upload failed:", xhr.status, xhr.responseText);
          resolve(null);
        }
      });

      xhr.addEventListener("error", () => {
        console.error("Upload network error");
        resolve(null);
      });

      xhr.addEventListener("abort", () => {
        console.error("Upload aborted");
        resolve(null);
      });

      xhr.open("POST", url);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.setRequestHeader("x-upsert", "true");
      xhr.send(file);
    }).catch((err) => {
      console.error("Upload session error:", err);
      resolve(null);
    });
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
