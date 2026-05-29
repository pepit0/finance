import type { CrmCreditAppAttachment } from "../types/crm";
import type { CrmCreditAppDocumentKind } from "../utils/crmCreditAppAttachment";
import { supabase } from "./supabase";

export const CRM_CREDIT_APP_DOCUMENTS_BUCKET = "crm-credit-app-documents";

/** Signed view/download links expire quickly; URLs are useless without CRM sign-in to mint new ones. */
const SIGNED_URL_TTL_SECONDS = 600;

const MAX_FILE_BYTES = 12 * 1024 * 1024;
const ALLOWED_MIME_PREFIXES = ["image/", "application/pdf"];

function friendlyStorageError(message: string): string {
  if (/bucket|not found|does not exist/i.test(message)) {
    return (
      "Document storage is not set up on this Supabase project. In the CRM project (same URL as VITE_SUPABASE_URL), " +
      "open SQL Editor, run the full script sql/crm_credit_app_documents_storage.sql, then check Storage for bucket " +
      '"crm-credit-app-documents". Refresh the app and try again.'
    );
  }
  if (/mime|content-type|invalid file type/i.test(message)) {
    return "That file type was rejected. Upload an image (JPEG, PNG, WebP, GIF, HEIC) or PDF.";
  }
  if (/row-level security|permission denied|RLS/i.test(message)) {
    return (
      "Upload was denied. Sign in again, confirm you have CRM access (allowlist or role), and run " +
      "sql/crm_credit_app_documents_storage.sql on this Supabase project."
    );
  }
  return message || "Upload failed.";
}

function sanitizeFileName(name: string): string {
  const base = name.replace(/[/\\?%*:|"<>]/g, "_").trim() || "upload";
  return base.slice(0, 120);
}

function isAllowedFile(file: File): boolean {
  const type = file.type.trim().toLowerCase();
  if (!type) {
    return /\.(jpe?g|png|gif|webp|heic|pdf)$/i.test(file.name);
  }
  return ALLOWED_MIME_PREFIXES.some((prefix) => type.startsWith(prefix));
}

export async function uploadCreditAppDocument(
  customerId: string,
  kind: CrmCreditAppDocumentKind,
  file: File,
  previousPath?: string | null
): Promise<{ data: CrmCreditAppAttachment | null; error: string | null }> {
  if (!customerId.trim()) {
    return { data: null, error: "Customer is required to upload documents." };
  }
  if (!isAllowedFile(file)) {
    return { data: null, error: "Upload an image (JPEG, PNG, WebP, GIF, HEIC) or PDF." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { data: null, error: "File must be 12 MB or smaller." };
  }

  const safeName = sanitizeFileName(file.name);
  const storage_path = `${customerId.trim()}/${kind}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(CRM_CREDIT_APP_DOCUMENTS_BUCKET)
    .upload(storage_path, file, {
      cacheControl: "private, no-cache, no-store",
      upsert: false,
      contentType: file.type || undefined
    });

  if (uploadError) {
    return { data: null, error: friendlyStorageError(uploadError.message) };
  }

  if (previousPath?.trim()) {
    await supabase.storage.from(CRM_CREDIT_APP_DOCUMENTS_BUCKET).remove([previousPath.trim()]);
  }

  return {
    data: {
      storage_path,
      file_name: safeName,
      content_type: file.type.trim() || "application/octet-stream",
      uploaded_at: new Date().toISOString()
    },
    error: null
  };
}

export async function removeCreditAppDocument(storagePath: string): Promise<{ error: string | null }> {
  const path = storagePath.trim();
  if (!path) {
    return { error: null };
  }
  const { error } = await supabase.storage.from(CRM_CREDIT_APP_DOCUMENTS_BUCKET).remove([path]);
  if (error) {
    return { error: friendlyStorageError(error.message) };
  }
  return { error: null };
}

export async function getCreditAppDocumentSignedUrl(
  attachment: CrmCreditAppAttachment,
  options?: { download?: boolean }
): Promise<{ url: string | null; error: string | null }> {
  const { data, error } = await supabase.storage
    .from(CRM_CREDIT_APP_DOCUMENTS_BUCKET)
    .createSignedUrl(attachment.storage_path, SIGNED_URL_TTL_SECONDS, {
      download: options?.download ? attachment.file_name : false
    });

  if (error) {
    return { url: null, error: friendlyStorageError(error.message) };
  }
  return { url: data?.signedUrl ?? null, error: null };
}
