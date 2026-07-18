const FIGMA_HOSTS = new Set(["figma.com", "www.figma.com", "embed.figma.com"]);

/** Path prefixes that Embed Kit 2.0 can iframe. */
const EMBED_KIT2_TYPES = new Set(["proto", "design", "board", "slides", "deck", "file"]);

export type FigmaViewerKind = "iframe" | "make-launch";

export type FigmaEmbedResult =
  | { ok: true; embedSrc: string; kind: FigmaViewerKind }
  | { ok: false; error: string };

export type ViewPayload = {
  embedSrc: string;
  title: string;
};

type EncodedPayloadV1 = {
  v: 1;
  s: string;
  t?: string;
};

function stripTrailingSlash(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}

function isFigmaHost(hostname: string): boolean {
  return FIGMA_HOSTS.has(hostname.toLowerCase());
}

function isFigmaSiteHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "figma.site" || host.endsWith(".figma.site");
}

function ensureEmbedHost(url: URL): void {
  if (!url.searchParams.has("embed-host") && !url.searchParams.has("embed_host")) {
    url.searchParams.set("embed-host", "feath");
  }
}

/**
 * Embed Kit 2.0: www.figma.com/{type}/… → embed.figma.com/{type}/…
 * @see https://developers.figma.com/docs/embeds/embed-figma-file/
 */
function toEmbedKit2(parsed: URL, type: string): string {
  const embedType = type === "file" ? "design" : type;
  const parts = parsed.pathname.split("/").filter(Boolean);
  // ["proto", "KEY", "Name", ...]
  const rest = parts.slice(1).join("/");
  const embed = new URL(`https://embed.figma.com/${embedType}/${rest}`);
  parsed.searchParams.forEach((value, key) => {
    embed.searchParams.set(key, value);
  });
  ensureEmbedHost(embed);
  return embed.toString();
}

/**
 * Turn a pasted Figma prototype, Make, published site, or embed URL into a viewer src.
 */
export function normalizeFigmaEmbedUrl(raw: string): FigmaEmbedResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Paste a Figma prototype, Make, or embed link." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, error: "Only http(s) links are allowed." };
  }

  const host = parsed.hostname.toLowerCase();
  const path = stripTrailingSlash(parsed.pathname);
  const segments = path.split("/").filter(Boolean);
  const type = (segments[0] || "").toLowerCase();

  // Published Make / Sites apps (iframeable)
  if (isFigmaSiteHost(host)) {
    return { ok: true, embedSrc: parsed.toString(), kind: "iframe" };
  }

  if (!isFigmaHost(host)) {
    return {
      ok: false,
      error: "Use a figma.com prototype/Make link, an embed URL, or a published *.figma.site link.",
    };
  }

  // Already on embed.figma.com
  if (host === "embed.figma.com") {
    const embed = new URL(parsed.toString());
    ensureEmbedHost(embed);
    return { ok: true, embedSrc: embed.toString(), kind: "iframe" };
  }

  // Classic Embed Kit 1.0: /embed?url=…
  if (path === "/embed" || path.startsWith("/embed/")) {
    return { ok: true, embedSrc: parsed.toString(), kind: "iframe" };
  }

  // Figma Make editor share links — Figma blocks external iframes (CSP).
  // We still accept them and open via a Feath-branded launcher.
  if (type === "make") {
    return { ok: true, embedSrc: parsed.toString(), kind: "make-launch" };
  }

  // Prototype / design / board / slides / deck / legacy file → Embed Kit 2.0
  if (EMBED_KIT2_TYPES.has(type)) {
    return { ok: true, embedSrc: toEmbedKit2(parsed, type), kind: "iframe" };
  }

  return {
    ok: false,
    error:
      "Use a Figma prototype (/proto), Make (/make), published *.figma.site, or embed link (Share → Copy link).",
  };
}

/** Opaque base64url — Figma URL is not readable in the share link. */
function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): string {
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeViewPayload(embedSrc: string, title?: string): string {
  const payload: EncodedPayloadV1 = { v: 1, s: embedSrc };
  const t = title?.trim();
  if (t) payload.t = t;
  return toBase64Url(JSON.stringify(payload));
}

export function decodeViewPayload(encoded: string | null): ViewPayload | null {
  if (!encoded) return null;
  try {
    const raw = JSON.parse(fromBase64Url(encoded)) as EncodedPayloadV1;
    if (raw?.v !== 1 || typeof raw.s !== "string" || !raw.s) return null;
    return {
      embedSrc: raw.s,
      title: typeof raw.t === "string" ? raw.t.trim() : "",
    };
  } catch {
    return null;
  }
}

/** Legacy query params (?u=&t=) still open if someone has an old link. */
export function decodeEmbedParam(encoded: string | null): FigmaEmbedResult {
  if (!encoded) {
    return { ok: false, error: "This link is missing an embed." };
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(encoded);
  } catch {
    return { ok: false, error: "This link is corrupted or incomplete." };
  }

  return normalizeFigmaEmbedUrl(decoded);
}

export function decodeTitleParam(encoded: string | null): string {
  if (!encoded) return "";
  try {
    return decodeURIComponent(encoded).trim();
  } catch {
    return "";
  }
}

export function resolveViewFromSearchParams(searchParams: URLSearchParams): {
  result: FigmaEmbedResult;
  title: string;
} {
  const opaque = decodeViewPayload(searchParams.get("e"));
  if (opaque) {
    return {
      result: normalizeFigmaEmbedUrl(opaque.embedSrc),
      title: opaque.title,
    };
  }

  return {
    result: decodeEmbedParam(searchParams.get("u")),
    title: decodeTitleParam(searchParams.get("t")),
  };
}

export function buildViewShareUrl(origin: string, embedSrc: string, title?: string): string {
  const base = origin.replace(/\/+$/, "");
  const e = encodeViewPayload(embedSrc, title);
  return `${base}/view/?e=${e}`;
}
