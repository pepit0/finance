import { feathBoardPassword, feathBoardUrl } from "../site.config";

export function isWebsiteHome(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return normalized === "/";
}

export function tryOpenFeathBoard(): void {
  const entered = window.prompt("Enter password to open the team board:");
  if (entered === null) {
    return;
  }
  if (entered === feathBoardPassword()) {
    window.location.href = feathBoardUrl();
    return;
  }
  window.alert("Incorrect password.");
}
