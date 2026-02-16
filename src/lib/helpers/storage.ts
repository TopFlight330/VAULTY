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
  // First do a quick SDK upload attempt to get the auth working,
  // but use XHR for progress tracking with token from SDK
  const supabase = createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Get token: try session, fallback to anon key
  let token = anonKey;
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      token = data.session.access_token;
    }
  } catch {
    // fallback to anon key
  }

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
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

    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("x-upsert", "true");
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
