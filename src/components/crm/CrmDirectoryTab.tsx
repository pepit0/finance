import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CrmDirectoryPosition, CrmUserDirectoryRow } from "../../types/crm";
import type { CrmPresenceStatus } from "../../lib/crmPresence";
import { presenceStatusLabel } from "../../lib/crmPresence";
import {
  fetchCrmUserDirectory,
  updateDirectoryCallbackPhone,
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
import { formatPhoneDisplay } from "../../utils/phoneFormat";
import {
  assignableDirectoryPositions,
  canAssignDirectoryPosition,
  canManageDirectoryUser,
  directoryPositionLabel,
  sortDirectoryByAuthority
} from "../../utils/crmDirectoryPosition";
import { useCrmDirectoryGroupsContext } from "../../context/CrmDirectoryGroupsContext";
import { CrmPresenceDot } from "./CrmPresenceDot";
import { CrmTeamAvatar } from "./CrmTeamAvatar";

type CrmDirectoryTabProps = {
  visible: boolean;
  presenceByUser: Map<string, CrmPresenceStatus>;
};

function presenceCounts(directory: CrmUserDirectoryRow[], presenceByUser: Map<string, CrmPresenceStatus>) {
  let online = 0;
  let away = 0;
  let offline = 0;
  for (const row of directory) {
    const status = presenceByUser.get(row.user_id) ?? "offline";
    if (status === "online") online += 1;
    else if (status === "away") away += 1;
    else offline += 1;
  }
  return { online, away, offline };
}

export function CrmDirectoryTab({ visible, presenceByUser }: CrmDirectoryTabProps) {
  const { groups } = useCrmDirectoryGroupsContext();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [directory, setDirectory] = useState<CrmUserDirectoryRow[]>([]);
  const [directoryNameDrafts, setDirectoryNameDrafts] = useState<Record<string, string>>({});
  const [directoryCallbackDrafts, setDirectoryCallbackDrafts] = useState<Record<string, string>>({});
  const [savingDirectoryNameFor, setSavingDirectoryNameFor] = useState<string | null>(null);
  const [savingDirectoryCallbackFor, setSavingDirectoryCallbackFor] = useState<string | null>(null);
  const [savingPositionFor, setSavingPositionFor] = useState<string | null>(null);
  const [savingPermissionsAdminFor, setSavingPermissionsAdminFor] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
  const counts = useMemo(() => presenceCounts(directory, presenceByUser), [directory, presenceByUser]);

  const selfRow = useMemo(
    () => (authUser?.id ? directory.find((row) => row.user_id === authUser.id) ?? null : null),
    [authUser?.id, directory]
  );

  const teamMembers = useMemo(
    () => sortedDirectory.filter((row) => row.user_id !== authUser?.id),
    [sortedDirectory, authUser?.id]
  );

  const canManageAnyone = useMemo(() => {
    if (isMaster) {
      return true;
    }
    return sortedDirectory.some(
      (row) =>
        row.user_id !== viewerContext.userId && canManageDirectoryUser(viewerContext, row, groups)
    );
  }, [groups, isMaster, sortedDirectory, viewerContext]);

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
    const nextNames: Record<string, string> = {};
    const nextPhones: Record<string, string> = {};
    for (const r of directory) {
      nextNames[r.user_id] = r.display_name ?? "";
      nextPhones[r.user_id] = r.callback_phone ? formatPhoneDisplay(r.callback_phone) : "";
    }
    setDirectoryNameDrafts(nextNames);
    setDirectoryCallbackDrafts(nextPhones);
  }, [directory]);

  const patchLocalRow = (userId: string, patch: Partial<CrmUserDirectoryRow>) => {
    setDirectory((rows) => rows.map((row) => (row.user_id === userId ? { ...row, ...patch } : row)));
  };

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

  const saveDirectoryRowCallbackPhone = async (userId: string) => {
    setSavingDirectoryCallbackFor(userId);
    setBanner(null);
    const raw = directoryCallbackDrafts[userId] ?? "";
    const { error } = await updateDirectoryCallbackPhone(userId, raw.trim() || null);
    setSavingDirectoryCallbackFor(null);
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
    <div className="crmTeamPage">
      {banner ? (
        <p className="crmBanner" role="alert">
          {banner}
        </p>
      ) : null}

      <header className="crmTeamPageHeader">
        <div>
          <p className="crmTeamPageIntro">
            See who is online and reach out when you need help on a deal.
          </p>
        </div>
        <div className="crmTeamPresenceStats" aria-label="Team presence summary">
          <span className="crmTeamPresenceStat crmTeamPresenceStat--online">
            <CrmPresenceDot status="online" />
            {counts.online} online
          </span>
          <span className="crmTeamPresenceStat crmTeamPresenceStat--away">
            <CrmPresenceDot status="away" />
            {counts.away} away
          </span>
          <span className="crmTeamPresenceStat crmTeamPresenceStat--offline">
            <CrmPresenceDot status="offline" />
            {counts.offline} offline
          </span>
        </div>
      </header>

      {loading ? (
        <p className="crmMuted">Loading team…</p>
      ) : sortedDirectory.length === 0 ? (
        <p className="crmMuted">No team members yet. People appear here after they open CRM.</p>
      ) : (
        <>
          {selfRow ? (
            <section className="crmTeamSelfCard" aria-labelledby="crm-team-self-heading">
              <h3 id="crm-team-self-heading" className="crmTeamSelfCardTitle">
                Your profile
              </h3>
              <div className="crmTeamSelfCardBody">
                <CrmTeamAvatar
                  name={directoryPersonLabel(selfRow)}
                  email={selfRow.email}
                  displayName={selfRow.display_name}
                  avatarPath={selfRow.avatar_path}
                  avatarVersion={selfRow.updated_at}
                  presence={presenceByUser.get(selfRow.user_id) ?? "offline"}
                  size="lg"
                  editable
                  onAvatarChange={(path) =>
                    patchLocalRow(selfRow.user_id, {
                      avatar_path: path,
                      updated_at: new Date().toISOString()
                    })
                  }
                />
                <div className="crmTeamSelfCardMeta">
                  <div className="crmTeamSelfTitleRow">
                    <p className="crmTeamMemberName">{directoryPersonLabel(selfRow)}</p>
                    <p className="crmTeamMemberPresence">
                      <CrmPresenceDot status={presenceByUser.get(selfRow.user_id) ?? "offline"} />
                      {presenceStatusLabel(presenceByUser.get(selfRow.user_id) ?? "offline")}
                    </p>
                  </div>
                  <p className="crmTeamMemberRole">
                    {isMaster ? "Master account" : directoryPositionLabel(selfRow.position, groups)}
                  </p>
                  <p className="crmTeamMemberEmail">{selfRow.email}</p>
                  <div className="crmTeamSelfNameEdit">
                    <label className="crmTeamManageLabel" htmlFor="crm-team-self-display-name">
                      Display name
                    </label>
                    <div className="crmTeamSelfNameRow">
                      <input
                        id="crm-team-self-display-name"
                        type="text"
                        className="crmTeamManageInput loginInput"
                        placeholder="How your name appears in CRM"
                        value={directoryNameDrafts[selfRow.user_id] ?? ""}
                        onChange={(event) =>
                          setDirectoryNameDrafts((prev) => ({
                            ...prev,
                            [selfRow.user_id]: event.target.value
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="topBarSheetButton"
                        disabled={savingDirectoryNameFor === selfRow.user_id}
                        onClick={() => void saveDirectoryRowDisplayName(selfRow.user_id)}
                      >
                        {savingDirectoryNameFor === selfRow.user_id ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>
                  <div className="crmTeamSelfNameEdit">
                    <label className="crmTeamManageLabel" htmlFor="crm-team-self-callback-phone">
                      Phone for calls
                    </label>
                    <p className="crmMuted crmTeamCallbackHint">
                      Twilio rings this number when you place or receive bridged calls.
                    </p>
                    <div className="crmTeamSelfNameRow">
                      <input
                        id="crm-team-self-callback-phone"
                        type="tel"
                        className="crmTeamManageInput loginInput"
                        placeholder="(555) 555-5555"
                        autoComplete="tel"
                        value={directoryCallbackDrafts[selfRow.user_id] ?? ""}
                        onChange={(event) =>
                          setDirectoryCallbackDrafts((prev) => ({
                            ...prev,
                            [selfRow.user_id]: event.target.value
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="topBarSheetButton"
                        disabled={savingDirectoryCallbackFor === selfRow.user_id}
                        onClick={() => void saveDirectoryRowCallbackPhone(selfRow.user_id)}
                      >
                        {savingDirectoryCallbackFor === selfRow.user_id ? "Saving…" : "Save phone"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {canManageAnyone ? (
            <details className="crmTeamManagePanel">
              <summary className="crmTeamManagePanelSummary">
                <span className="crmTeamManagePanelSummaryLabel">Manage team</span>
                <span className="crmTeamManagePanelChevron" aria-hidden="true" />
              </summary>
              <p className="crmMuted crmTeamManageIntro">
                Managers can assign positions and edit display names for team members below them in the org chart.
                {isMaster ? " As master, you can also designate permission admins." : null}
              </p>
              <ul className="crmTeamManageList">
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
                      className={`crmTeamManageRow${canEditRow ? "" : " crmTeamManageRow--readonly"}${rowIsMaster ? " crmTeamManageRow--master" : ""}`}
                    >
                      <div className="crmTeamManageRowTop">
                        <div className="crmTeamManagePerson">
                          <span className="crmTeamManagePersonName">{directoryPersonLabel(row)}</span>
                          <span className="crmTeamManagePersonEmail">{row.email}</span>
                        </div>
                        <div className="crmTeamManagePositionSlot">
                          <label className="crmTeamManageLabel" htmlFor={`crm-team-position-${row.user_id}`}>
                            Position
                          </label>
                          {canEditPosition ? (
                            <select
                              id={`crm-team-position-${row.user_id}`}
                              className="crmAssigneeSelect crmTeamManageSelect"
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
                            <span
                              className={`crmTeamManagePositionReadonly${rowIsMaster ? " crmTeamManagePositionReadonly--master" : ""}`}
                            >
                              {rowIsMaster ? "Master account" : directoryPositionLabel(row.position, groups)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="crmTeamManageFieldsGrid">
                        <div className="crmTeamManageFieldBlock">
                          <label className="crmTeamManageLabel" htmlFor={`crm-team-display-name-${row.user_id}`}>
                            Display name
                          </label>
                          <input
                            id={`crm-team-display-name-${row.user_id}`}
                            type="text"
                            className="crmTeamManageInput loginInput"
                            placeholder="Display name"
                            aria-label={`Display name for ${row.email}`}
                            value={directoryNameDrafts[row.user_id] ?? ""}
                            disabled={!canEditRow}
                            onChange={(event) =>
                              setDirectoryNameDrafts((prev) => ({
                                ...prev,
                                [row.user_id]: event.target.value
                              }))
                            }
                          />
                        </div>
                        <div className="crmTeamManageFieldBlock">
                          <label className="crmTeamManageLabel" htmlFor={`crm-team-callback-phone-${row.user_id}`}>
                            Phone for calls
                          </label>
                          <input
                            id={`crm-team-callback-phone-${row.user_id}`}
                            type="tel"
                            className="crmTeamManageInput loginInput"
                            placeholder="(555) 555-5555"
                            aria-label={`Callback phone for ${row.email}`}
                            value={directoryCallbackDrafts[row.user_id] ?? ""}
                            disabled={!canEditRow}
                            onChange={(event) =>
                              setDirectoryCallbackDrafts((prev) => ({
                                ...prev,
                                [row.user_id]: event.target.value
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="crmTeamManageActions">
                        {isMaster && !rowIsMaster ? (
                          <label className="crmAdminDirectoryPermissionsAdminCheck crmTeamManagePermCheck">
                            <input
                              type="checkbox"
                              checked={row.is_permissions_admin}
                              disabled={savingPermissionsAdminFor === row.user_id}
                              onChange={(event) => void onPermissionsAdminChange(row, event.target.checked)}
                            />
                            <span>Permission admin</span>
                          </label>
                        ) : null}
                        <div className="crmTeamManageActionButtons">
                          <button
                            type="button"
                            className="topBarSheetButton crmAdminDirectorySaveBtn"
                            disabled={!canEditRow || savingDirectoryNameFor === row.user_id}
                            onClick={() => void saveDirectoryRowDisplayName(row.user_id)}
                          >
                            {savingDirectoryNameFor === row.user_id ? "Saving…" : "Save name"}
                          </button>
                          <button
                            type="button"
                            className="crmModalButtonSecondary crmAdminDirectorySaveBtn"
                            disabled={!canEditRow || savingDirectoryCallbackFor === row.user_id}
                            onClick={() => void saveDirectoryRowCallbackPhone(row.user_id)}
                          >
                            {savingDirectoryCallbackFor === row.user_id ? "Saving…" : "Save phone"}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </details>
          ) : null}

          <section className="crmTeamGridSection" aria-labelledby="crm-team-grid-heading">
            <h3 id="crm-team-grid-heading" className="crmTeamSectionTitle">
              {teamMembers.length > 0 ? "Everyone" : "Team"}
            </h3>
            <ul className="crmTeamGrid">
              {(teamMembers.length > 0 ? teamMembers : sortedDirectory).map((row) => {
                const rowIsMaster = row.email.trim().toLowerCase() === CRM_DIRECTORY_MASTER_EMAIL;
                const presence = presenceByUser.get(row.user_id) ?? "offline";
                const isSelf = row.user_id === authUser?.id;

                return (
                  <li key={row.user_id} className={`crmTeamCard${isSelf ? " crmTeamCard--self" : ""}`}>
                    <CrmTeamAvatar
                      name={directoryPersonLabel(row)}
                      email={row.email}
                      displayName={row.display_name}
                      avatarPath={row.avatar_path}
                      avatarVersion={row.updated_at}
                      presence={presence}
                    />
                    <div className="crmTeamCardBody">
                      <p className="crmTeamMemberName">
                        {directoryPersonLabel(row)}
                        {rowIsMaster ? <span className="crmDirectoryMasterBadge">Master</span> : null}
                      </p>
                      <p className="crmTeamMemberRole">
                        {rowIsMaster ? "Master account" : directoryPositionLabel(row.position, groups)}
                      </p>
                      <p className="crmTeamMemberPresence">
                        <CrmPresenceDot status={presence} />
                        {presenceStatusLabel(presence)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
