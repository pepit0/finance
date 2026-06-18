import { supabase } from "./supabase";

export const CRM_TEAM_AVATARS_BUCKET = "crm-team-avatars";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function friendlyStorageError(message: string): string {
  if (/bucket|not found|does not exist/i.test(message)) {
    return (
      "Team photo storage is not set up. In Supabase SQL Editor, run sql/crm_team_avatars.sql, " +
      'then confirm bucket "crm-team-avatars" exists under Storage.'
    );
  }
  if (/mime|content-type|invalid file type/i.test(message)) {
    return "Upload a JPEG, PNG, WebP, or GIF image.";
  }
  if (/row-level security|permission denied|RLS/i.test(message)) {
    return "Upload was denied. You can only change your own profile photo.";
  }
  return message || "Upload failed.";
}

function extensionForFile(file: File): string {
  const type = file.type.trim().toLowerCase();
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

function isAllowedAvatar(file: File): boolean {
  const type = file.type.trim().toLowerCase();
  if (ALLOWED_TYPES.has(type)) {
    return true;
  }
  return /\.(jpe?g|png|gif|webp)$/i.test(file.name);
}

export function teamAvatarStoragePath(userId: string, file: File): string {
  return `${userId.trim()}/avatar.${extensionForFile(file)}`;
}

export function teamAvatarPublicUrl(path: string | null | undefined, version?: string | null): string | null {
  const trimmed = path?.trim();
  if (!trimmed) {
    return null;
  }
  const { data } = supabase.storage.from(CRM_TEAM_AVATARS_BUCKET).getPublicUrl(trimmed);
  if (!version) {
    return data.publicUrl;
  }
  const joiner = data.publicUrl.includes("?") ? "&" : "?";
  return `${data.publicUrl}${joiner}v=${encodeURIComponent(version)}`;
}

export async function uploadMyTeamAvatar(
  file: File,
  previousPath?: string | null
): Promise<{ path: string | null; error: string | null }> {
  if (!isAllowedAvatar(file)) {
    return { path: null, error: "Upload a JPEG, PNG, WebP, or GIF image." };
  }
  if (file.size > MAX_BYTES) {
    return { path: null, error: "Photo must be 2 MB or smaller." };
  }

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return { path: null, error: "Sign in to upload a profile photo." };
  }

  const storagePath = teamAvatarStoragePath(userId, file);

  const { error: uploadError } = await supabase.storage.from(CRM_TEAM_AVATARS_BUCKET).upload(storagePath, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || undefined
  });

  if (uploadError) {
    return { path: null, error: friendlyStorageError(uploadError.message) };
  }

  const { error: dbError } = await supabase
    .from("crm_user_directory")
    .update({
      avatar_path: storagePath,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", userId);

  if (dbError) {
    return { path: null, error: friendlyStorageError(dbError.message) };
  }

  const oldPath = previousPath?.trim();
  if (oldPath && oldPath !== storagePath) {
    await supabase.storage.from(CRM_TEAM_AVATARS_BUCKET).remove([oldPath]);
  }

  return { path: storagePath, error: null };
}

export async function removeMyTeamAvatar(currentPath?: string | null): Promise<{ error: string | null }> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return { error: "Sign in to remove your profile photo." };
  }

  const { error: dbError } = await supabase
    .from("crm_user_directory")
    .update({
      avatar_path: null,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", userId);

  if (dbError) {
    return { error: friendlyStorageError(dbError.message) };
  }

  const path = currentPath?.trim();
  if (path) {
    await supabase.storage.from(CRM_TEAM_AVATARS_BUCKET).remove([path]);
  }

  return { error: null };
}
