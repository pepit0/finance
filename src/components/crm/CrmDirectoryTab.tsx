import type { User } from "@supabase/supabase-js";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { CrmDirectoryPosition, CrmUserDirectoryRow } from "../../types/crm";
import type { CrmPresenceStatus } from "../../lib/crmPresence";
import {
  fetchCrmUserDirectory,
  resolveCrmDirectoryAdminStatus,
  updateDirectoryDisplayName,
  updateDirectoryPermissionsAdmin,
  updateDirectoryPosition,
  upsertMyCrmDirectoryRow
} from "../../lib/crmApi";
import { supabase } from "../../lib/supabase";
import {
  CRM_DIRECTORY_MASTER_EMAIL,
  directoryPersonLabel,
  isCrmDirectoryMaster
} from "../../utils/crmDirectoryAdmin";
import {
  assignableDirectoryPositions,
  canAssignDirectoryPosition,
  canManageDirectoryUser,
  directoryPositionLabel,
  sortDirectoryByAuthority
} from "../../utils/crmDirectoryPosition";
import { useCrmDirectoryGroupsContext } from "../../context/CrmDirectoryGroupsContext";
import { CrmPresenceDot } from "./CrmPresenceDot";

type CrmDirectoryTabProps = {
  visible: boolean;
  presenceByUser: Map<string, CrmPresenceStatus>;
};

export function CrmDirectoryTab({ visible, presenceByUser }: CrmDirectoryTabProps) {
  const { groups } = useCrmDirectoryGroupsContext();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [directory, setDirectory] = useState<CrmUserDirectoryRow[]>([]);
  const [directoryNameDrafts, setDirectoryNameDrafts] = useState<Record<string, string>>({});
  const [savingDirectoryNameFor, setSavingDirectoryNameFor] = useState<string | null>(null);
  const [savingPositionFor, setSavingPositionFor] = useState<string | null>(null);
  const [savingPermissionsAdminFor, setSavingPermissionsAdminFor] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDirectoryAdmin, setIsDirectoryAdmin] = useState(false);

  const isMaster = useMemo(() => isCrmDirectoryMaster(authUser), [authUser]);

  const viewerContext = useMemo(() => {
    const selfRow = directory.find((row) => row.user_id === authUser?.id);
    return {
      isMaster,
      userId: authUser?.id ?? null,
      position: selfRow?.position ?? null
    };
  }, [authUser?.id, directory, isMaster]);

  const sortedDirectory = useMemo(() => sortDirectoryByAuthority(directory, groups), [directory, groups]);

  const reloadDirectory = useCallback(async () => {
    const syncRes = await upsertMyCrmDirectoryRow();
    const { data, error } = await fetchCrmUserDirectory();
    if (error) {
      setBanner(error);
      setDirectory([]);
      return;
    }
    if (syncRes.error) {
      setBanner(syncRes.error);
    }
    setDirectory(data);
  }, []);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    setBanner(null);
    await reloadDirectory();
    setLoading(false);
  }, [reloadDirectory]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthUser(data.user ?? null);
    });
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }
    void reloadAll();
  }, [visible, reloadAll]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    let cancelled = false;
    (async () => {
      const status = await resolveCrmDirectoryAdminStatus();
      if (!cancelled) {
        setIsDirectoryAdmin(status.isAdmin);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const r of directory) {
      next[r.user_id] = r.display_name ?? "";
    }
    setDirectoryNameDrafts(next);
  }, [directory]);

  const saveDirectoryRowDisplayName = async (userId: string) => {
    setSavingDirectoryNameFor(userId);
    setBanner(null);
    const raw = directoryNameDrafts[userId] ?? "";
    const { error } = await updateDirectoryDisplayName(userId, raw.trim() || null);
    setSavingDirectoryNameFor(null);
    if (error) {
      setBanner(error);
      return;
    }
    await reloadDirectory();
  };

  const clearDirectoryRowDisplayName = async (userId: string) => {
    setDirectoryNameDrafts((prev) => ({ ...prev, [userId]: "" }));
    setSavingDirectoryNameFor(userId);
    setBanner(null);
    const { error } = await updateDirectoryDisplayName(userId, null);
    setSavingDirectoryNameFor(null);
    if (error) {
      setBanner(error);
      return;
    }
    await reloadDirectory();
  };

  const onPositionChange = async (row: CrmUserDirectoryRow, nextPosition: CrmDirectoryPosition) => {
    if (nextPosition === row.position) {
      return;
    }
    setSavingPositionFor(row.user_id);
    setBanner(null);
    const { error } = await updateDirectoryPosition(row.user_id, nextPosition);
    setSavingPositionFor(null);
    if (error) {
      setBanner(error);
      return;
    }
    await reloadDirectory();
  };

  const onPermissionsAdminChange = async (row: CrmUserDirectoryRow, nextValue: boolean) => {
    if (nextValue === row.is_permissions_admin) {
      return;
    }
    setSavingPermissionsAdminFor(row.user_id);
    setBanner(null);
    const { error } = await updateDirectoryPermissionsAdmin(row.user_id, nextValue);
    setSavingPermissionsAdminFor(null);
    if (error) {
      setBanner(error);
      return;
    }
    await reloadDirectory();
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="crmDirectoryTab">
      {banner ? (
        <p className="crmBanner" role="alert">
          {banner}
        </p>
      ) : null}

      <section className="crmCard crmAdminDirectoryCard" aria-labelledby="crm-team-members-heading">
        <h2 id="crm-team-members-heading" className="crmCardTitle">
          Team members
        </h2>
        <p className="crmMuted crmAdminDirectoryIntro">
          Assign each person a group (job position) in order of authority:{" "}
          {groups.map((group) => group.label).join(" → ")}. Managers can edit display names and assign positions for
          team members below them. Master account:{" "}
          <code className="crmInlineCode">{CRM_DIRECTORY_MASTER_EMAIL}</code>. Master can designate permission admins
          who may edit groups and the permission matrix in Settings.
        </p>
        <p className="crmPresenceLegend" aria-label="Team presence legend">
          <span className="crmPresenceLegendItem">
            <CrmPresenceDot status="online" /> Online — CRM tab open
          </span>
          <span className="crmPresenceLegendItem">
            <CrmPresenceDot status="away" /> Away — no activity for 5 minutes
          </span>
          <span className="crmPresenceLegendItem">
            <CrmPresenceDot status="offline" /> Offline — tab closed
          </span>
        </p>
        {loading ? (
          <p className="crmMuted">Loading…</p>
        ) : sortedDirectory.length === 0 ? (
          <p className="crmMuted">No team members in the directory yet. They appear after each person opens CRM.</p>
        ) : (
          <ul className="crmAdminDirectoryList crmAdminDirectoryListWithPresence">
            {sortedDirectory.map((row) => {
              const rowIsMaster = row.email.trim().toLowerCase() === CRM_DIRECTORY_MASTER_EMAIL;
              const canEditRow = canManageDirectoryUser(viewerContext, row, groups);
              const canEditPosition =
                !rowIsMaster &&
                assignableDirectoryPositions(viewerContext, groups).some((position) =>
                  canAssignDirectoryPosition(viewerContext, row, position, groups)
                );
              const positionOptions = assignableDirectoryPositions(viewerContext, groups).filter((position) =>
                canAssignDirectoryPosition(viewerContext, row, position, groups)
              );

              return (
                <li
                  key={row.user_id}
                  className={`crmAdminDirectoryRow${canEditRow ? "" : " crmAdminDirectoryRowReadOnly"}`}
                >
                  <div className="crmAdminDirectoryEmail">
                    <CrmPresenceDot status={presenceByUser.get(row.user_id) ?? "offline"} />
                    <span className="crmAdminDirectoryEmailText">
                      {row.email}
                      {rowIsMaster ? <span className="crmDirectoryMasterBadge">Master account</span> : null}
                      {row.display_name?.trim() ? (
                        <span className="crmAdminDirectoryCurrentLabel"> — {directoryPersonLabel(row)}</span>
                      ) : null}
                    </span>
                  </div>
                  <div className="crmAdminDirectoryPositionCell">
                    {canEditPosition ? (
                      <select
                        className="crmAssigneeSelect crmAdminDirectoryPositionSelect"
                        aria-label={`Position for ${row.email}`}
                        value={row.position}
                        disabled={savingPositionFor === row.user_id}
                        onChange={(event) =>
                          void onPositionChange(row, event.target.value as CrmDirectoryPosition)
                        }
                      >
                        {positionOptions.includes(row.position) ? null : (
                          <option value={row.position}>{directoryPositionLabel(row.position, groups)}</option>
                        )}
                        {positionOptions.map((position) => (
                          <option key={position} value={position}>
                            {directoryPositionLabel(position, groups)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`crmDirectoryPositionBadge crmDirectoryPositionBadge-${row.position}`}>
                        {rowIsMaster ? "Master account" : directoryPositionLabel(row.position, groups)}
                      </span>
                    )}
                    {savingPositionFor === row.user_id ? (
                      <span className="crmMuted crmAdminDirectorySavingHint">Saving…</span>
                    ) : null}
                  </div>
                  <input
                    type="text"
                    className="crmAdminDirectoryInput loginInput"
                    placeholder="Display name"
                    aria-label={`Display name for ${row.email}`}
                    value={directoryNameDrafts[row.user_id] ?? ""}
                    disabled={!canEditRow}
                    onChange={(e) =>
                      setDirectoryNameDrafts((prev) => ({
                        ...prev,
                        [row.user_id]: e.target.value
                      }))
                    }
                  />
                  <div className="crmAdminDirectoryActions">
                    {isMaster && !rowIsMaster ? (
                      <label className="crmAdminDirectoryPermissionsAdminCheck">
                        <input
                          type="checkbox"
                          checked={row.is_permissions_admin}
                          disabled={savingPermissionsAdminFor === row.user_id}
                          onChange={(event) => void onPermissionsAdminChange(row, event.target.checked)}
                        />
                        <span>Permission admin</span>
                      </label>
                    ) : null}
                    <button
                      type="button"
                      className="topBarSheetButton crmAdminDirectorySaveBtn"
                      disabled={!canEditRow || savingDirectoryNameFor === row.user_id}
                      onClick={() => void saveDirectoryRowDisplayName(row.user_id)}
                    >
                      {savingDirectoryNameFor === row.user_id ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      className="crmModalButtonSecondary"
                      disabled={!canEditRow || savingDirectoryNameFor === row.user_id}
                      onClick={() => void clearDirectoryRowDisplayName(row.user_id)}
                    >
                      Clear
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {!isDirectoryAdmin && !isMaster ? (
          <p className="crmMuted crmAdminDirectoryFootnote">
            Sales team members can edit their own display name. Managers can manage team members below their position.
          </p>
        ) : null}
      </section>
    </div>
  );
}
