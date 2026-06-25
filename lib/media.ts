import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { decode } from "base64-arraybuffer";
import { supabase } from "./supabase";

const BUCKET = "media";

/**
 * Compress an image client-side before upload (PRD §10 — protect the 1 GB free
 * tier and keep egress low), then upload to {space_id}/{card_id}.jpg.
 * Returns the object path and the compressed dimensions.
 */
export async function uploadImage(params: {
  uri: string;
  spaceId: string;
  cardId: string;
}): Promise<{ path: string; width: number; height: number }> {
  const manipulated = await ImageManipulator.manipulateAsync(
    params.uri,
    [{ resize: { width: 1600 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  const base64 =
    manipulated.base64 ??
    (await FileSystem.readAsStringAsync(manipulated.uri, {
      encoding: FileSystem.EncodingType.Base64,
    }));

  const path = `${params.spaceId}/${params.cardId}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, decode(base64), {
      contentType: "image/jpeg",
      upsert: true,
    });
  if (error) throw error;

  return { path, width: manipulated.width, height: manipulated.height };
}

/**
 * Upload an already-recorded video file as-is (PRD: own videos are the only
 * heavy media). Returns the object path.
 */
export async function uploadVideo(params: {
  uri: string;
  spaceId: string;
  cardId: string;
  ext?: string;
}): Promise<{ path: string }> {
  const ext = params.ext ?? "mp4";
  const base64 = await FileSystem.readAsStringAsync(params.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const path = `${params.spaceId}/${params.cardId}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, decode(base64), {
      contentType: ext === "mov" ? "video/quicktime" : "video/mp4",
      upsert: true,
    });
  if (error) throw error;
  return { path };
}

const urlCache = new Map<string, { url: string; expires: number }>();

/** Signed URL for a private media object, cached until shortly before expiry. */
export async function getMediaUrl(path: string): Promise<string | null> {
  const cached = urlCache.get(path);
  if (cached && cached.expires > Date.now()) return cached.url;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error || !data) return null;

  urlCache.set(path, { url: data.signedUrl, expires: Date.now() + 55 * 60 * 1000 });
  return data.signedUrl;
}
