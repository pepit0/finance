import { feathBoardUrl } from "../site.config";

export function isWebsiteHome(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return normalized === "/";
}

export function tryOpenFeathBoard(): void {
  window.location.href = feathBoardUrl();
}
