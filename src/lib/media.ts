import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Uploads a file to the private media bucket and returns a long-lived signed URL. */
export async function uploadMedia(file: File, folder: string) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image must be under 10 MB");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("media").createSignedUrl(path, TEN_YEARS);
  if (e2 || !data) throw e2 ?? new Error("Could not create image link");
  return { path, url: data.signedUrl };
}

export async function removeMedia(path?: string | null) {
  if (!path) return;
  await supabase.storage.from("media").remove([path]);
}

/** Extracts the storage path from a signed URL we created. */
export function pathFromUrl(url?: string | null) {
  if (!url) return null;
  const m = url.match(/\/object\/sign\/media\/([^?]+)/);
  return m ? decodeURIComponent(m[1] ?? "") : null;
}
