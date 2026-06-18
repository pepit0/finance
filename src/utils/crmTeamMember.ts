import { directoryPersonLabel } from "./crmDirectoryAdmin";

export function teamMemberInitials(row: { display_name: string | null; email: string }): string {
  const label = directoryPersonLabel(row);
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return "?";
}

export function teamMemberFirstName(row: { display_name: string | null; email: string }): string {
  const label = directoryPersonLabel(row);
  const first = label.split(/\s+/).filter(Boolean)[0];
  return first ?? label;
}
