import type { User } from "@supabase/supabase-js";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { CrmDirectoryAdminRow, CrmUserDirectoryRow } from "../../types/crm";
import type { CrmPresenceStatus } from "../../lib/crmPresence";
import {
  deleteDirectoryAdmin,
  fetchCrmDirectoryAdmins,
  fetchCrmUserDirectory,
  insertDirectoryAdmin,
  resolveCrmDirectoryAdminStatus,
  updateDirectoryDisplayName,
  upsertMyCrmDirectoryRow
} from "../../lib/crmApi";
import { supabase } from "../../lib/supabase";
import { CRM_DIRECTORY_MASTER_EMAIL, directoryPersonLabel, isCrmDirectoryMaster } from "../../utils/crmDirectoryAdmin";
import { CrmPresenceDot } from "./CrmPresenceDot";

type CrmDirectoryTabProps = {
  visible: boolean;
  presenceByUser: Map<string, CrmPresenceStatus>;
};

export function CrmDirectoryTab({ visible, presenceByUser }: CrmDirectoryTabProps) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [directory, setDirectory] = useState<CrmUserDirectoryRow[]>([]);
  const [delegatedAdmins, setDelegatedAdmins] = useState<CrmDirectoryAdminRow[]>([]);
  const [directoryNameDrafts, setDirectoryNameDrafts] = useState<Record<string, string>>({});
  const [savingDirectoryNameFor, setSavingDirectoryNameFor] = useState<string | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [removingAdminEmail, setRemovingAdminEmail] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDirectoryAdmin, setIsDirectoryAdmin] = useState(false);

  const isMaster = useMemo(() => isCrmDirectoryMaster(authUser), [authUser]);
  const showTeamPresence = isDirectoryAdmin && visible;

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

  const reloadDelegatedAdmins = useCallback(async () => {
    const { data, error } = await fetchCrmDirectoryAdmins();
    if (error) {
      setBanner(error);
      setDelegatedAdmins([]);
      return;
    }
    setDelegatedAdmins(data);
  }, []);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    setBanner(null);
    await reloadDirectory();
    if (isCrmDirectoryMaster(authUser)) {
      await reloadDelegatedAdmins();
    }
    setLoading(false);
  }, [authUser, reloadDelegatedAdmins, reloadDirectory]);

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

  const onAddAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddingAdmin(true);
    setBanner(null);
    const { error } = await insertDirectoryAdmin(newAdminEmail);
    setAddingAdmin(false);
    if (error) {
      setBanner(error);
      return;
    }
    setNewAdminEmail("");
    await reloadDelegatedAdmins();
  };

  const onRemoveAdmin = async (email: string) => {
    setRemovingAdminEmail(email);
    setBanner(null);
    const { error } = await deleteDirectoryAdmin(email);
    setRemovingAdminEmail(null);
    if (error) {
      setBanner(error);
      return;
    }
    await reloadDelegatedAdmins();
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

      {isMaster ? (
        <section className="crmCard crmAdminDelegatedCard" aria-labelledby="crm-delegated-admins-heading">
          <h2 id="crm-delegated-admins-heading" className="crmCardTitle">
            Directory admins
          </h2>
          <p className="crmMuted crmAdminDirectoryIntro">
            These accounts can edit <strong>team display names</strong> and{" "}
            <strong>remove calls, comments, or texts</strong> from customer history (same as you). They cannot add or
            remove other admins. Master account:{" "}
            <code className="crmInlineCode">{CRM_DIRECTORY_MASTER_EMAIL}</code>
          </p>
          <form className="crmAddAdminForm" onSubmit={onAddAdmin}>
            <label className="loginLabel" htmlFor="crm-new-admin-email">
              Add admin by email
            </label>
            <div className="crmAddAdminRow">
              <input
                id="crm-new-admin-email"
                className="loginInput"
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="colleague@company.com"
                autoComplete="email"
              />
              <button type="submit" className="topBarSheetButton" disabled={addingAdmin}>
                {addingAdmin ? "Adding…" : "Add admin"}
              </button>
            </div>
          </form>
          {delegatedAdmins.length === 0 ? (
            <p className="crmMuted">No delegated admins yet.</p>
          ) : (
            <ul className="crmDelegatedAdminList">
              {delegatedAdmins.map((row) => (
                <li key={row.email} className="crmDelegatedAdminRow">
                  <span className="crmDelegatedAdminEmail">{row.email}</span>
                  <button
                    type="button"
                    className="crmDangerButton"
                    disabled={removingAdminEmail === row.email}
                    onClick={() => void onRemoveAdmin(row.email)}
                  >
                    {removingAdminEmail === row.email ? "Removing…" : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section className="crmCard crmAdminDirectoryCard" aria-labelledby="crm-team-display-names">
        <h2 id="crm-team-display-names" className="crmCardTitle">
          Team display names
        </h2>
        <p className="crmMuted crmAdminDirectoryIntro">
          Optional labels for assignees and activity history. Login stays email-only. Shown as{" "}
          <code className="crmInlineCode">display_name ?? email</code> in CRM.
        </p>
        {showTeamPresence ? (
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
        ) : null}
        {loading ? (
          <p className="crmMuted">Loading…</p>
        ) : directory.length === 0 ? (
          <p className="crmMuted">No team members in the directory yet. They appear after each person opens CRM.</p>
        ) : (
          <ul className="crmAdminDirectoryList">
            {directory.map((row) => {
              const canEditRow = isDirectoryAdmin || row.user_id === authUser?.id;
              return (
                <li
                  key={row.user_id}
                  className={`crmAdminDirectoryRow${canEditRow ? "" : " crmAdminDirectoryRowReadOnly"}`}
                >
                  <div className="crmAdminDirectoryEmail">
                    {showTeamPresence ? (
                      <CrmPresenceDot status={presenceByUser.get(row.user_id) ?? "offline"} />
                    ) : null}
                    <span className="crmAdminDirectoryEmailText">
                      {row.email}
                      {row.display_name?.trim() ? (
                        <span className="crmAdminDirectoryCurrentLabel"> — {directoryPersonLabel(row)}</span>
                      ) : null}
                    </span>
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
      </section>
    </div>
  );
}
