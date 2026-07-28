import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const FEATH_BOARD_BUG_ATTACHMENTS_BUCKET = "feath-board-bug-attachments";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type BugAttachment = {
  path: string;
  name: string;
  uploadedAt: string;
};

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;

  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;

  supabase = createClient(url, anonKey);
  return supabase;
}

function extensionForFile(file: File): string {
  const type = file.type.trim().toLowerCase();
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

function isAllowedImage(file: File): boolean {
  const type = file.type.trim().toLowerCase();
  if (ALLOWED_TYPES.has(type)) return true;
  return /\.(jpe?g|png|gif|webp)$/i.test(file.name);
}

function friendlyStorageError(message: string): string {
  if (/bucket|not found|does not exist/i.test(message)) {
    return (
      'Bug photo storage is not set up. In Supabase SQL Editor, run sql/feath_board_bug_attachments.sql, ' +
      'then confirm bucket "feath-board-bug-attachments" exists under Storage.'
    );
  }
  if (/mime|content-type|invalid file type/i.test(message)) {
    return "Upload a JPEG, PNG, WebP, or GIF image.";
  }
  if (/row-level security|permission denied|RLS/i.test(message)) {
    return "Upload was denied. Sign in to the board and try again.";
  }
  return message || "Upload failed.";
}

export function bugAttachmentStoragePath(bugId: number, file: File): string {
  return `burd/bugs/${bugId}/${crypto.randomUUID()}.${extensionForFile(file)}`;
}

export function bugAttachmentPublicUrl(path: string | null | undefined): string | null {
  const trimmed = path?.trim();
  if (!trimmed) return null;

  const client = getSupabase();
  if (!client) return null;

  const { data } = client.storage.from(FEATH_BOARD_BUG_ATTACHMENTS_BUCKET).getPublicUrl(trimmed);
  return data.publicUrl;
}

export async function uploadBugAttachments(
  bugId: number,
  files: File[],
): Promise<{ attachments: BugAttachment[]; error: string | null }> {
  if (!files.length) return { attachments: [], error: null };

  const client = getSupabase();
  if (!client) {
    return { attachments: [], error: "Supabase is not configured for photo uploads." };
  }

  const { data: auth } = await client.auth.getUser();
  if (!auth.user) {
    return { attachments: [], error: "Sign in to attach photos to a bug report." };
  }

  const attachments: BugAttachment[] = [];

  for (const file of files) {
    if (!isAllowedImage(file)) {
      return { attachments: [], error: `"${file.name}" is not a supported image type.` };
    }
    if (file.size > MAX_BYTES) {
      return { attachments: [], error: `"${file.name}" is too large. Each photo must be 4 MB or smaller.` };
    }

    const storagePath = bugAttachmentStoragePath(bugId, file);
    const { error } = await client.storage.from(FEATH_BOARD_BUG_ATTACHMENTS_BUCKET).upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

    if (error) {
      return { attachments: [], error: friendlyStorageError(error.message) };
    }

    attachments.push({
      path: storagePath,
      name: file.name,
      uploadedAt: new Date().toISOString(),
    });
  }

  return { attachments, error: null };
}

declare global {
  interface Window {
    __feathBoardBugAttachmentUrl: (path: string | null | undefined) => string | null;
    __feathBoardUploadBugAttachments: (
      bugId: number,
      files: File[],
    ) => Promise<{ attachments: BugAttachment[]; error: string | null }>;
  }
}

window.__feathBoardBugAttachmentUrl = bugAttachmentPublicUrl;
window.__feathBoardUploadBugAttachments = uploadBugAttachments;
