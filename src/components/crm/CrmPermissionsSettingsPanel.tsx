import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { CrmDirectoryGroup, CrmDirectoryPosition, CrmPermissionDef } from "../../types/crm";
import {
  countDirectoryUsersOnPosition,
  fetchCrmPermissionDefs,
  fetchCrmPositionPermissionRows,
  setCrmPositionPermissions
} from "../../lib/crmApi";
import { useCrmDirectoryGroupsContext } from "../../context/CrmDirectoryGroupsContext";
import { defaultDirectoryGroupSlug } from "../../utils/crmDirectoryGroups";
import { directoryPositionLabel } from "../../utils/crmDirectoryPosition";
import { buildPositionPermissionMap, groupCrmPermissionDefs } from "../../utils/crmPermissionDefs";

type CrmPermissionsSettingsPanelProps = {
  disabled?: boolean;
  isMaster?: boolean;
};

function DirectoryGroupRow({
  group,
  index,
  total,
  reassignOptions,
  disabled,
  onMove,
  onSaveLabel,
  onDelete
}: {
  group: CrmDirectoryGroup;
  index: number;
  total: number;
  reassignOptions: CrmDirectoryGroup[];
  disabled: boolean;
  onMove: (direction: "up" | "down") => Promise<boolean>;
  onSaveLabel: (label: string) => Promise<boolean>;
  onDelete: (reassignToSlug?: string) => Promise<boolean>;
}) {
  const [labelDraft, setLabelDraft] = useState(group.label);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reassignSlug, setReassignSlug] = useState("");
  const [memberCount, setMemberCount] = useState<number | null>(null);

  useEffect(() => {
    setLabelDraft(group.label);
  }, [group.label, group.slug]);

  const saveLabel = async () => {
    if (labelDraft.trim() === group.label) {
      return;
    }
    const ok = await onSaveLabel(labelDraft);
    if (!ok) {
      setLabelDraft(group.label);
    }
  };

  const openDelete = async () => {
    setDeleteOpen(true);
    const result = await countDirectoryUsersOnPosition(group.slug);
    setMemberCount(result.error ? 0 : result.count);
  };

  const confirmDelete = async () => {
    const ok = await onDelete(memberCount && memberCount > 0 ? reassignSlug : undefined);
    if (ok) {
      setDeleteOpen(false);
      setReassignSlug("");
      setMemberCount(null);
    }
  };

  const deleteTargets = reassignOptions.filter((option) => option.slug !== group.slug);
  const canDelete = total > 1 && !group.is_default;

  return (
    <div className="crmPipelineSettingsRow crmDirectoryGroupsRow">
      <div className="crmPipelineSettingsOrder">
        <button
          type="button"
          className="crmPipelineSettingsOrderBtn"
          disabled={disabled || index === 0}
          aria-label={`Move ${group.label} up`}
          onClick={() => void onMove("up")}
        >
          ↑
        </button>
        <button
          type="button"
          className="crmPipelineSettingsOrderBtn"
          disabled={disabled || index >= total - 1}
          aria-label={`Move ${group.label} down`}
          onClick={() => void onMove("down")}
        >
          ↓
        </button>
      </div>

      <span className="crmDirectoryGroupBadge">{group.label}</span>

      <input
        type="text"
        className="crmInput crmPipelineSettingsLabelInput"
        value={labelDraft}
        disabled={disabled}
        aria-label={`Label for ${group.label}`}
        onChange={(event) => setLabelDraft(event.target.value)}
        onBlur={() => void saveLabel()}
      />

      {canDelete ? (
        deleteOpen ? (
          <div className="crmPipelineSettingsDeleteDialog crmDirectoryGroupsDeleteDialog">
            <p className="crmPipelineSettingsDeleteCopy">
              {memberCount === null
                ? "Checking team members…"
                : memberCount > 0
                  ? `${memberCount} team member${memberCount === 1 ? "" : "s"} use this group. Move them to:`
                  : "Remove this group? Its permission settings will be deleted."}
            </p>
            {memberCount !== null && memberCount > 0 ? (
              <select
                className="crmAssigneeSelect"
                value={reassignSlug}
                disabled={disabled}
                aria-label="Reassign team members to"
                onChange={(event) => setReassignSlug(event.target.value)}
              >
                <option value="">Choose group…</option>
                {deleteTargets.map((option) => (
                  <option key={option.slug} value={option.slug}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="crmPipelineSettingsDeleteActions">
              <button
                type="button"
                className="crmModalButtonSecondary"
                disabled={disabled}
                onClick={() => {
                  setDeleteOpen(false);
                  setReassignSlug("");
                  setMemberCount(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="crmPipelineSettingsDeleteBtn"
                disabled={disabled || (memberCount !== null && memberCount > 0 && !reassignSlug)}
                onClick={() => void confirmDelete()}
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="crmPipelineSettingsDeleteBtn"
            disabled={disabled}
            onClick={() => void openDelete()}
          >
            Delete
          </button>
        )
      ) : group.is_default ? (
        <span aria-hidden="true" />
      ) : (
        <span className="crmMuted crmPipelineSettingsSystemNote">Required</span>
      )}
    </div>
  );
}

export function CrmPermissionsSettingsPanel({ disabled = false, isMaster = false }: CrmPermissionsSettingsPanelProps) {
  const {
    groups,
    loading: groupsLoading,
    saving: groupsSaving,
    error: groupsError,
    tableAvailable: groupsTableAvailable,
    createGroup,
    updateGroupLabel,
    moveGroup,
    deleteGroup,
    setDefaultGroup,
    clearError: clearGroupsError
  } = useCrmDirectoryGroupsContext();

  const [defs, setDefs] = useState<CrmPermissionDef[]>([]);
  const [positionKeys, setPositionKeys] = useState<Record<string, Set<string>>>({});
  const [activePosition, setActivePosition] = useState<CrmDirectoryPosition>("general_manager");
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newGroupLabel, setNewGroupLabel] = useState("");

  const groupSlugs = useMemo(() => groups.map((group) => group.slug), [groups]);
  const defaultGroupSlug = useMemo(() => defaultDirectoryGroupSlug(groups), [groups]);

  const reloadPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [defsResult, rowsResult] = await Promise.all([
      fetchCrmPermissionDefs(),
      fetchCrmPositionPermissionRows()
    ]);
    setLoading(false);
    if (defsResult.error) {
      setError(defsResult.error);
      return;
    }
    if (rowsResult.error) {
      setError(rowsResult.error);
      return;
    }
    setDefs(defsResult.data);
    setPositionKeys(buildPositionPermissionMap(rowsResult.data, groupSlugs));
  }, [groupSlugs]);

  useEffect(() => {
    void reloadPermissions();
  }, [reloadPermissions]);

  useEffect(() => {
    if (groups.length === 0) {
      return;
    }
    if (!groups.some((group) => group.slug === activePosition)) {
      setActivePosition(groups[0].slug);
    }
  }, [activePosition, groups]);

  const permissionGroups = useMemo(() => groupCrmPermissionDefs(defs), [defs]);
  const activeKeys = positionKeys[activePosition] ?? new Set<string>();

  const onToggle = async (permissionKey: string, nextGranted: boolean) => {
    const current = new Set(activeKeys);
    if (nextGranted) {
      current.add(permissionKey);
    } else {
      current.delete(permissionKey);
    }

    setSavingKey(permissionKey);
    setError(null);
    const result = await setCrmPositionPermissions(activePosition, [...current]);
    setSavingKey(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setPositionKeys((prev) => ({
      ...prev,
      [activePosition]: current
    }));
  };

  const onCreateGroup = async (event: FormEvent) => {
    event.preventDefault();
    clearGroupsError();
    const ok = await createGroup(newGroupLabel);
    if (ok) {
      setNewGroupLabel("");
    }
  };

  const onDefaultGroupChange = async (slug: string) => {
    if (!slug || slug === defaultGroupSlug) {
      return;
    }
    clearGroupsError();
    await setDefaultGroup(slug);
  };

  const controlsDisabled =
    disabled || loading || groupsLoading || savingKey !== null || groupsSaving || (isMaster && !groupsTableAvailable);
  const defaultRoleDisabled = disabled || groupsLoading || groupsSaving || !groupsTableAvailable;
  const combinedError = groupsError ?? error;

  return (
    <div className="crmGroupsPermissionsTab">
      {isMaster ? (
        <section className="crmCard crmDirectoryGroupsCard" aria-labelledby="crm-directory-groups-heading">
          <h2 id="crm-directory-groups-heading" className="crmCardTitle">
            Groups
          </h2>
          <p className="crmMuted crmDirectoryGroupsIntro">
            Groups are the job positions used on the Team tab. Higher groups have more authority when assigning roles.
            You can rename, reorder, add, or remove groups.
          </p>

          {!groupsTableAvailable && !groupsLoading ? (
            <p className="crmBanner crmDirectoryGroupsMigrationHint" role="status">
              To save group changes, run <code className="crmInlineCode">sql/crm_directory_groups.sql</code> in Supabase
              SQL Editor (after <code className="crmInlineCode">sql/crm_position_permissions.sql</code>), then refresh
              this page.
            </p>
          ) : null}

          {groupsError ? (
            <p className="crmBanner" role="alert">
              {groupsError}
            </p>
          ) : null}

          <div className="crmPipelineSettingsList crmDirectoryGroupsList">
            {groupsLoading ? (
              <p className="crmMuted">Loading groups…</p>
            ) : (
              groups.map((group, index) => (
                <DirectoryGroupRow
                  key={group.slug}
                  group={group}
                  index={index}
                  total={groups.length}
                  reassignOptions={groups}
                  disabled={controlsDisabled}
                  onMove={(direction) => moveGroup(group.slug, direction)}
                  onSaveLabel={(label) => updateGroupLabel(group.slug, label)}
                  onDelete={(reassignToSlug) => deleteGroup(group.slug, reassignToSlug)}
                />
              ))
            )}
          </div>

          <form className="crmPipelineSettingsCreate crmDirectoryGroupsCreate" onSubmit={(event) => void onCreateGroup(event)}>
            <h3 className="crmPipelineSettingsCreateTitle">Add group</h3>
            <div className="crmPipelineSettingsCreateFields">
              <input
                type="text"
                className="crmInput"
                placeholder="Group name (e.g. BDC)"
                value={newGroupLabel}
                disabled={controlsDisabled}
                aria-label="New group name"
                onChange={(event) => setNewGroupLabel(event.target.value)}
              />
              <button type="submit" className="topBarSheetButton" disabled={controlsDisabled || !newGroupLabel.trim()}>
                {groupsSaving ? "Saving…" : "Add group"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="crmCard crmPermissionsSettingsCard" aria-labelledby="crm-permissions-settings-heading">
        <h2 id="crm-permissions-settings-heading" className="crmCardTitle">
          Permissions
        </h2>
        <p className="crmMuted crmPermissionsSettingsIntro">
          Choose what each group can do in the CRM. Changes apply to everyone with that job position.
        </p>

        <label className="crmDirectoryDefaultRoleField">
          <span className="crmDirectoryDefaultRoleLabel">New team members start in</span>
          <select
            className="crmAssigneeSelect crmDirectoryDefaultRoleSelect"
            value={defaultGroupSlug}
            disabled={defaultRoleDisabled}
            aria-label="Default role for new team members"
            onChange={(event) => void onDefaultGroupChange(event.target.value)}
          >
            {groups.map((group) => (
              <option key={group.slug} value={group.slug}>
                {group.label}
              </option>
            ))}
          </select>
        </label>

        {combinedError ? (
          <p className="crmBanner" role="alert">
            {combinedError}
          </p>
        ) : null}

        <div className="crmPermissionsPositionTabs" role="tablist" aria-label="Group">
          {groups.map((group) => (
            <button
              key={group.slug}
              type="button"
              role="tab"
              className={`crmPermissionsPositionTab${activePosition === group.slug ? " crmPermissionsPositionTabActive" : ""}`}
              aria-selected={activePosition === group.slug}
              disabled={controlsDisabled}
              onClick={() => setActivePosition(group.slug)}
            >
              {group.label}
            </button>
          ))}
        </div>

        <div className="crmPermissionsGroups">
          {loading ? (
            <p className="crmMuted">Loading permissions…</p>
          ) : (
            permissionGroups.map((group) => (
              <div key={group.group_key} className="crmPermissionsGroup">
                <h3 className="crmPermissionsGroupTitle">{group.group_label}</h3>
                <ul className="crmPermissionsGroupList">
                  {group.permissions.map((permission) => {
                    const checked = activeKeys.has(permission.key);
                    const rowDisabled = controlsDisabled || savingKey === permission.key;
                    return (
                      <li key={permission.key} className="crmPermissionsRow">
                        <label className="crmPermissionsRowLabel">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={rowDisabled}
                            onChange={(event) => void onToggle(permission.key, event.target.checked)}
                          />
                          <span className="crmPermissionsRowCopy">
                            <span className="crmPermissionsRowTitle">{permission.label}</span>
                            {permission.description ? (
                              <span className="crmMuted crmPermissionsRowDescription">{permission.description}</span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <p className="crmMuted crmPermissionsFootnote">
          Editing permissions for <strong>{directoryPositionLabel(activePosition, groups)}</strong>.
          {savingKey ? " Saving…" : null}
        </p>
      </section>
    </div>
  );
}
