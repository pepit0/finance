/**
 * Google Drive "view" links embed poorly; `/preview` works reliably in iframes.
 * Raw PDF URLs and local `/lender-guides/*.pdf` are returned unchanged.
 */
export function normalizeBookingGuideEmbedUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }

  const fileIdMatch = trimmed.match(/\/file\/d\/([a-z0-9_-]+)/i);
  if (fileIdMatch && /drive\.google\.com/i.test(trimmed)) {
    return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
  }

  const openIdMatch = trimmed.match(/drive\.google\.com\/open\?[^#]*\bid=([a-z0-9_-]+)/i);
  if (openIdMatch) {
    return `https://drive.google.com/file/d/${openIdMatch[1]}/preview`;
  }

  return trimmed;
}

/** URLs we can embed without sniffing bytes (Drive preview is HTML but iframe-safe). */
export function isEmbeddableWithoutPdfContentType(url: string): boolean {
  const u = url.toLowerCase();
  if (u.endsWith(".pdf")) {
    return true;
  }
  if (u.includes("drive.google.com/file/") && u.includes("/preview")) {
    return true;
  }
  return false;
}
