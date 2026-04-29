export interface InventoryVehicle {
  title: string;
  year: number | null;
  priceCad: number;
  odometerKm: number | null;
  detailsUrl: string;
  imageUrl: string | null;
}

const LONDONDERRY_INVENTORY_PAGE =
  "https://www.londonderrydodge.com/new-ram-1500-st-albert/jeep-cherokee-edmonton-ab/?cy=t5a_1c3&md=668&mk=29";

const JINA_PREFIX = "https://r.jina.ai/http://";

function absDealershipUrl(raw: string): string {
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  return new URL(raw, "https://www.londonderrydodge.com").toString();
}

function toJinaUrl(url: string): string {
  return `${JINA_PREFIX}${url.replace(/^https?:\/\//i, "")}`;
}

function parseMoneyToNumber(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) {
    return null;
  }
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

function parseVehicleBlock(block: string): Omit<InventoryVehicle, "imageUrl"> | null {
  const titleMatch = block.match(/^##\s+(.+)$/m);
  const detailsMatch = block.match(/\[Vehicle Details\]\((https?:\/\/[^)]+)\)/i);
  if (!titleMatch || !detailsMatch) {
    return null;
  }

  const priceMatches = [...block.matchAll(/\bPrice\s+([\d,]+)/gi)];
  const priceRaw = priceMatches.length > 0 ? priceMatches[priceMatches.length - 1]?.[1] ?? "" : "";
  const priceCad = parseMoneyToNumber(priceRaw);
  if (priceCad === null) {
    return null;
  }

  const yearMatch = titleMatch[1].match(/\b(19\d{2}|20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : null;

  const odometerMatch = block.match(/\|\s*Odometer\s*\|\s*([\d,]+)\s*Km\s*\|/i);
  const odometerKm = odometerMatch ? parseMoneyToNumber(odometerMatch[1]) : null;

  return {
    title: titleMatch[1].trim(),
    year,
    priceCad,
    odometerKm,
    detailsUrl: detailsMatch[1]
  };
}

function extractFirstImageFromBlock(block: string): string | null {
  const markdownImage = block.match(/!\[[^\]]*]\((https?:\/\/[^)\s]+\.(?:jpg|jpeg|png|webp)(?:\?[^)\s]*)?)\)/i);
  if (markdownImage?.[1]) {
    return markdownImage[1];
  }
  const linkedImage = block.match(/(https?:\/\/[^\s)]+(?:cdn|images)[^\s)]*\.(?:jpg|jpeg|png|webp)(?:\?[^\s)]*)?)/i);
  return linkedImage?.[1] ?? null;
}

function extractVehicleId(detailsUrl: string): string | null {
  const m = detailsUrl.match(/\/(\d{6,})(?:\/)?$/);
  return m?.[1] ?? null;
}

function firstImageCandidateFromId(detailsUrl: string): string | null {
  const id = extractVehicleId(detailsUrl);
  if (!id) {
    return null;
  }
  // Most DealerFire-style pages expose a first photo under this path.
  return `https://www.londonderrydodge.com/images/vehicles/${id}/1.jpg`;
}

export function parseLondonderryInventoryMarkdown(markdown: string): InventoryVehicle[] {
  const starts = [...markdown.matchAll(/^##\s+/gm)].map((m) => m.index ?? -1).filter((n) => n >= 0);
  const out: InventoryVehicle[] = [];
  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const end = starts[i + 1] ?? markdown.length;
    const block = markdown.slice(start, end);
    const parsed = parseVehicleBlock(block);
    if (!parsed) {
      continue;
    }
    out.push({ ...parsed, imageUrl: extractFirstImageFromBlock(block) ?? firstImageCandidateFromId(parsed.detailsUrl) });
  }
  return out;
}

export async function fetchLondonderryInventoryPage(): Promise<InventoryVehicle[]> {
  const response = await fetch(toJinaUrl(LONDONDERRY_INVENTORY_PAGE));
  if (!response.ok) {
    throw new Error(`Inventory source returned ${response.status}.`);
  }
  const markdown = await response.text();
  return parseLondonderryInventoryMarkdown(markdown);
}

export async function fetchVehicleHeroImage(detailsUrl: string): Promise<string | null> {
  const idCandidate = firstImageCandidateFromId(detailsUrl);
  if (idCandidate) {
    return idCandidate;
  }
  try {
    const response = await fetch(toJinaUrl(absDealershipUrl(detailsUrl)));
    if (!response.ok) {
      return null;
    }
    const markdown = await response.text();
    return extractFirstImageFromBlock(markdown);
  } catch {
    return null;
  }
}

