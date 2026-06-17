import type { CrmDirectoryGroup, CrmDirectoryPosition } from "../types/crm";
import {
  DEFAULT_DIRECTORY_GROUPS,
  directoryGroupLabel,
  directoryGroupRank,
  sortDirectoryGroups
} from "./crmDirectoryGroups";

/** @deprecated Use sortDirectoryGroups from crmDirectoryGroups with live group data. */
export const CRM_DIRECTORY_POSITIONS = DEFAULT_DIRECTORY_GROUPS.map((group) => ({
  value: group.slug as CrmDirectoryPosition,
  label: group.label,
  rank: group.rank
}));

export function directoryPositionRank(
  position: CrmDirectoryPosition | null | undefined,
  groups: CrmDirectoryGroup[] = DEFAULT_DIRECTORY_GROUPS
): number {
  return directoryGroupRank(position, groups);
}

export function directoryPositionLabel(
  position: CrmDirectoryPosition | null | undefined,
  groups: CrmDirectoryGroup[] = DEFAULT_DIRECTORY_GROUPS
): string {
  return directoryGroupLabel(position, groups);
}

export function sortDirectoryByAuthority<T extends { position: CrmDirectoryPosition; email: string }>(
  rows: T[],
  groups: CrmDirectoryGroup[] = DEFAULT_DIRECTORY_GROUPS
): T[] {
  return [...rows].sort((a, b) => {
    const rankDiff = directoryPositionRank(b.position, groups) - directoryPositionRank(a.position, groups);
    if (rankDiff !== 0) {
      return rankDiff;
    }
    return a.email.localeCompare(b.email, undefined, { sensitivity: "base" });
  });
}

export function canManageDirectoryUser(
  viewer: { isMaster: boolean; position: CrmDirectoryPosition | null; userId: string | null },
  target: { position: CrmDirectoryPosition; userId: string },
  groups: CrmDirectoryGroup[] = DEFAULT_DIRECTORY_GROUPS
): boolean {
  if (viewer.isMaster) {
    return true;
  }
  if (!viewer.userId) {
    return false;
  }
  if (viewer.userId === target.userId) {
    return true;
  }
  const viewerRank = directoryPositionRank(viewer.position, groups);
  return viewerRank > directoryPositionRank(target.position, groups);
}

export function canAssignDirectoryPosition(
  viewer: { isMaster: boolean; position: CrmDirectoryPosition | null; userId: string | null },
  target: { position: CrmDirectoryPosition; userId: string },
  nextPosition: CrmDirectoryPosition,
  groups: CrmDirectoryGroup[] = DEFAULT_DIRECTORY_GROUPS
): boolean {
  if (viewer.isMaster) {
    return true;
  }
  if (!viewer.userId || viewer.userId === target.userId) {
    return false;
  }
  const viewerRank = directoryPositionRank(viewer.position, groups);
  return (
    viewerRank > directoryPositionRank(target.position, groups) &&
    viewerRank > directoryPositionRank(nextPosition, groups)
  );
}

export function assignableDirectoryPositions(
  viewer: { isMaster: boolean; position: CrmDirectoryPosition | null },
  groups: CrmDirectoryGroup[] = DEFAULT_DIRECTORY_GROUPS
): CrmDirectoryPosition[] {
  const sorted = sortDirectoryGroups(groups);
  if (viewer.isMaster) {
    return sorted.map((group) => group.slug);
  }
  const viewerRank = directoryPositionRank(viewer.position, groups);
  return sorted.filter((group) => group.rank < viewerRank).map((group) => group.slug);
}

export function isDirectoryPositionAboveSales(
  position: CrmDirectoryPosition | null | undefined,
  options?: { isMaster?: boolean; groups?: CrmDirectoryGroup[]; salesSlug?: string }
): boolean {
  if (options?.isMaster) {
    return true;
  }
  const groups = options?.groups ?? DEFAULT_DIRECTORY_GROUPS;
  const salesSlug = options?.salesSlug ?? groups.find((group) => group.slug === "sales")?.slug ?? "sales";
  return directoryPositionRank(position, groups) > directoryPositionRank(salesSlug, groups);
}
