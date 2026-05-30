import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type {
  CrmActivity,
  CrmActivityKind,
  CrmCustomer,
  CrmCustomerStatus,
  CrmLenderOutcomeEntry,
  CrmLenderSlug,
  CrmUserDirectoryRow
} from "../../types/crm";
import { AddCustomerModal } from "./AddCustomerModal";
import { CrmCreditAppInfoModal } from "./CrmCreditAppInfoModal";
import { CrmCustomerLenderRail } from "./CrmCustomerLenderRail";
import { EditCustomerModal } from "./EditCustomerModal";
import {
  deleteCrmActivity,
  deleteCustomer,
  fetchActivities,
  fetchCustomers,
  fetchCrmUserDirectory,
  directoryAdminSetupMessage,
  resolveCrmDirectoryAdminStatus,
  fetchCustomerLenderOutcomes,
  insertActivity,
  restoreCustomer,
  upsertMyCrmDirectoryRow
} from "../../lib/crmApi";
import { supabase } from "../../lib/supabase";
import { directoryPersonLabel, directoryUsername, profileCreatorLabel } from "../../utils/crmDirectoryAdmin";
import { formatSystemLeadCommentBody } from "../../utils/canadianProvince";
import { filterCustomersByAssignee, filterCustomersBySearch, formatRelativeSince } from "../../utils/crmSearch";
import { formatPhoneDisplay } from "../../utils/phoneFormat";

function buildAssigneeFilterOptions(
  customers: CrmCustomer[],
  directory: CrmUserDirectoryRow[]
): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [
    { value: "all", label: "All assignees" },
    { value: "unassigned", label: "Unassigned" },
    { value: "me", label: "Assigned to me" }
  ];
  const seen = new Set(opts.map((o) => o.value));
  const byId = new Map<string, string>();
  for (const d of directory) {
    byId.set(d.user_id, directoryPersonLabel(d));
  }
  for (const c of customers) {
    if (c.assigned_to && c.assigned_to_email && !byId.has(c.assigned_to)) {
      byId.set(c.assigned_to, c.assigned_to_email);
    }
  }
  const rest = [...byId.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  for (const [id, label] of rest) {
    if (!seen.has(id)) {
      opts.push({ value: id, label });
      seen.add(id);
    }
  }
  return opts;
}

export function CrmCustomersTab() {
  const [meId, setMeId] = useState<string | null>(null);
  const [meEmail, setMeEmail] = useState<string | null>(null);
  const [directory, setDirectory] = useState<CrmUserDirectoryRow[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [listTab, setListTab] = useState<CrmCustomerStatus>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [activeCustomers, setActiveCustomers] = useState<CrmCustomer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [creditInfoOpen, setCreditInfoOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(false);

  const [actKind, setActKind] = useState<CrmActivityKind>("comment");
  const [actBody, setActBody] = useState("");
  const [savingAct, setSavingAct] = useState(false);
  const [isDirectoryAdmin, setIsDirectoryAdmin] = useState(false);
  const [adminSetupBanner, setAdminSetupBanner] = useState<string | null>(null);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);
  const [lenderOutcomes, setLenderOutcomes] = useState<Partial<Record<CrmLenderSlug, CrmLenderOutcomeEntry>>>({});
  const selected = customers.find((c) => c.id === selectedId) ?? null;

  const customersAfterAssignee = useMemo(
    () => filterCustomersByAssignee(customers, assigneeFilter, meId),
    [customers, assigneeFilter, meId]
  );

  const activeCountForAssignee = useMemo(
    () => filterCustomersByAssignee(activeCustomers, assigneeFilter, meId).length,
    [activeCustomers, assigneeFilter, meId]
  );

  const filteredCustomers = useMemo(
    () => filterCustomersBySearch(customersAfterAssignee, searchQuery),
    [customersAfterAssignee, searchQuery]
  );

  const assigneeFilterOptions = useMemo(
    () => buildAssigneeFilterOptions(customers, directory),
    [customers, directory]
  );

  const assigneeLabelForCustomer = useCallback(
    (c: CrmCustomer): string | null => {
      if (!c.assigned_to) {
        return null;
      }
      const row = directory.find((d) => d.user_id === c.assigned_to);
      if (row) {
        return directoryPersonLabel(row);
      }
      return c.assigned_to_email;
    },
    [directory]
  );

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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user ?? null;
      setMeId(u?.id ?? null);
      setMeEmail(u?.email?.trim() ?? null);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const status = await resolveCrmDirectoryAdminStatus();
      if (!cancelled) {
        setIsDirectoryAdmin(status.isAdmin);
        setAdminSetupBanner(directoryAdminSetupMessage(status));
        if (status.error && !status.isAdmin) {
          setBanner(status.error);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void reloadDirectory();
  }, [reloadDirectory]);

  const reloadCustomers = useCallback(
    async (statusOverride?: CrmCustomerStatus) => {
      const status = statusOverride ?? listTab;
      setListLoading(true);
      setBanner(null);
      let listRes: Awaited<ReturnType<typeof fetchCustomers>>;
      let activeRes: Awaited<ReturnType<typeof fetchCustomers>> | null = null;
      if (status === "active") {
        listRes = await fetchCustomers({ status: "active" });
      } else {
        [listRes, activeRes] = await Promise.all([
          fetchCustomers({ status }),
          fetchCustomers({ status: "active" })
        ]);
      }
      setListLoading(false);
      if (listRes.error) {
        setBanner(listRes.error);
        setCustomers([]);
        setActiveCustomers([]);
        return;
      }
      setCustomers(listRes.data);
      if (status === "active") {
        setActiveCustomers(listRes.data);
      } else if (activeRes && !activeRes.error) {
        setActiveCustomers(activeRes.data);
      }
    },
    [listTab]
  );

  useEffect(() => {
    void reloadCustomers();
  }, [reloadCustomers]);

  const goToListTab = (tab: CrmCustomerStatus) => {
    setEditModalOpen(false);
    setListTab(tab);
    setSelectedId(null);
    setSearchQuery("");
    setAssigneeFilter("all");
  };

  useEffect(() => {
    if (!selectedId) {
      setActivities([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      const { data, error } = await fetchActivities(selectedId);
      if (cancelled) {
        return;
      }
      setDetailLoading(false);
      if (error) {
        setBanner(error);
        setActivities([]);
        return;
      }
      setActivities(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setLenderOutcomes({});
      return;
    }
    let cancelled = false;
    void fetchCustomerLenderOutcomes(selectedId).then(({ data, error }) => {
      if (cancelled) {
        return;
      }
      if (error) {
        setBanner(error);
        setLenderOutcomes({});
        return;
      }
      const next: Partial<Record<CrmLenderSlug, CrmLenderOutcomeEntry>> = {};
      for (const row of data) {
        next[row.lender_slug] = {
          outcome: row.outcome,
          reason: row.reason ?? null
        };
      }
      setLenderOutcomes(next);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const patchLenderOutcomes = useCallback(
    (patch: Partial<Record<CrmLenderSlug, CrmLenderOutcomeEntry | undefined>>) => {
      setLenderOutcomes((prev) => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(patch)) {
          const slug = key as CrmLenderSlug;
          if (value === undefined) {
            delete next[slug];
          } else {
            next[slug] = value;
          }
        }
        return next;
      });
    },
    []
  );

  const onAddActivity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId) {
      return;
    }
    setSavingAct(true);
    setBanner(null);
    const { error } = await insertActivity({
      customer_id: selectedId,
      kind: actKind,
      body: actBody
    });
    setSavingAct(false);
    if (error) {
      setBanner(error);
      return;
    }
    setActBody("");
    const { data, error: loadErr } = await fetchActivities(selectedId);
    if (loadErr) {
      setBanner(loadErr);
      return;
    }
    setActivities(data);
    await reloadCustomers();
  };

  const formatWhen = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  const activityAuthorLabel = (a: CrmActivity) => {
    if (a.author_id === meId) {
      return "You";
    }
    const dirRow = directory.find((d) => d.user_id === a.author_id);
    if (dirRow) {
      const username = directoryUsername(dirRow);
      if (username) {
        return username;
      }
    }
    const email = a.author_email?.trim();
    if (email) {
      return email;
    }
    return `Legacy entry (${a.author_id.slice(0, 8)}…)`;
  };

  const onRemoveActivity = async (activityId: string, kind: CrmActivityKind) => {
    if (!selectedId) {
      return;
    }
    const kindLabel = kind === "call" ? "call" : kind === "comment" ? "comment" : "text";
    if (
      !window.confirm(
        `Remove this ${kindLabel} from the customer history? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeletingActivityId(activityId);
    setBanner(null);
    const { error } = await deleteCrmActivity(activityId);
    setDeletingActivityId(null);
    if (error) {
      setBanner(error);
      return;
    }
    const { data, error: loadErr } = await fetchActivities(selectedId);
    if (loadErr) {
      setBanner(loadErr);
      return;
    }
    setActivities(data);
    await reloadCustomers();
  };

  const onRestoreFromProfile = async () => {
    if (!selectedId || !selected || selected.status !== "lost") {
      return;
    }
    setRestoring(true);
    setBanner(null);
    const { error } = await restoreCustomer(selectedId);
    setRestoring(false);
    if (error) {
      setBanner(error);
      return;
    }
    setListTab("active");
    await reloadCustomers("active");
    setSelectedId(selectedId);
  };

  const handleEditSaved = async () => {
    await reloadCustomers(listTab);
  };

  const handleCreditInfoSaved = async () => {
    if (!selectedId) {
      return;
    }
    await reloadCustomers(listTab);
    const { data, error } = await fetchActivities(selectedId);
    if (error) {
      setBanner(error);
      return;
    }
    setActivities(data);
  };

  const handleMovedToLost = async () => {
    setEditModalOpen(false);
    setSearchQuery("");
    setListTab("lost");
    setSelectedId(null);
    await reloadCustomers("lost");
  };

  const handleRestoredFromModal = async () => {
    setEditModalOpen(false);
    const id = selected?.id ?? null;
    setListTab("active");
    setSearchQuery("");
    await reloadCustomers("active");
    if (id) {
      setSelectedId(id);
    }
  };

  const onDeleteCustomer = async () => {
    if (!selectedId || !selected) {
      return;
    }
    if (
      !window.confirm(
        `Permanently delete ${selected.display_name}? This removes their profile, activities, and lender outcomes. This cannot be undone.`
      )
    ) {
      return;
    }
    setDeletingCustomer(true);
    setBanner(null);
    const { error } = await deleteCustomer(selectedId);
    setDeletingCustomer(false);
    if (error) {
      setBanner(error);
      return;
    }
    setEditModalOpen(false);
    setSelectedId(null);
    await reloadCustomers();
  };

  const listTitleId = listTab === "active" ? "crm-customer-list-active" : "crm-customer-list-lost";

  return (
    <div className="crmCustomersLayout">
      <AddCustomerModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSaved={(id) => {
          setSearchQuery("");
          setListTab("active");
          setSelectedId(id);
          void reloadCustomers("active");
        }}
      />

      <EditCustomerModal
        open={editModalOpen}
        customer={selected}
        directory={directory}
        meId={meId}
        meEmail={meEmail}
        onClose={() => setEditModalOpen(false)}
        onSaved={() => void handleEditSaved()}
        onMovedToLost={() => void handleMovedToLost()}
        onRestored={() => void handleRestoredFromModal()}
      />
      <CrmCreditAppInfoModal
        open={creditInfoOpen}
        customer={selected}
        onClose={() => setCreditInfoOpen(false)}
        onSaved={() => void handleCreditInfoSaved()}
      />

      {adminSetupBanner ? (
        <p className="crmBanner crmBannerWarn" role="status">
          {adminSetupBanner}
        </p>
      ) : null}

      {banner ? (
        <p className="crmBanner" role="alert">
          {banner}
        </p>
      ) : null}

      <div className="crmPanelHeadingRow">
        <div className="crmPanelHeadingGroup">
          <h2 id="crm-customers-heading" className="crmPanelHeading">
            Customers
          </h2>
          <p className="crmCustomersCount" aria-live="polite">
            {listLoading ? "…" : `${activeCountForAssignee} active`}
          </p>
        </div>
        <div className="crmPanelHeadingActions">
          <div className="crmSegmented" role="group" aria-label="Customer list">
            <button
              type="button"
              className={`crmSegment ${listTab === "active" ? "crmSegmentActive" : ""}`}
              onClick={() => goToListTab("active")}
            >
              Active
            </button>
            <button
              type="button"
              className={`crmSegment ${listTab === "lost" ? "crmSegmentActive" : ""}`}
              onClick={() => goToListTab("lost")}
            >
              Lost
            </button>
          </div>
          <button type="button" className="topBarSheetButton" onClick={() => setAddModalOpen(true)}>
            Add customer
          </button>
        </div>
      </div>

      <div className="crmCustomersToolbar">
        <input
          type="search"
          className="crmSearchInput"
          placeholder="Search name, email, or phone…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search customers"
        />
        <label className="crmToolbarAssignee">
          <span className="crmToolbarAssigneeLabel">Assignee</span>
          <select
            className="crmAssigneeSelect"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            aria-label="Filter by assignee"
          >
            {assigneeFilterOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="crmCustomersGrid crmCustomersGridTwo">
        <section className="crmCard crmCustomerListPanel" aria-labelledby={listTitleId}>
          <h2 id={listTitleId} className="crmCardTitle">
            {listTab === "active" ? "Active customers" : "Lost customers"}
          </h2>
          {listLoading ? (
            <p className="crmMuted">Loading…</p>
          ) : filteredCustomers.length === 0 ? (
            <p className="crmMuted">
              {customers.length === 0
                ? listTab === "active"
                  ? "No active customers yet. Use “Add customer” above."
                  : "No lost customers."
                : customersAfterAssignee.length === 0
                  ? "No customers match this assignee filter."
                  : "No matches for your search."}
            </p>
          ) : (
            <ul className="crmCustomerList">
              {filteredCustomers.map((c) => {
                const assignLabel = assigneeLabelForCustomer(c);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={`crmCustomerRow ${c.id === selectedId ? "crmCustomerRowActive" : ""}`}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <span className="crmCustomerRowName">{c.display_name}</span>
                      {c.phone ? (
                        <span className="crmCustomerRowMeta">{formatPhoneDisplay(c.phone)}</span>
                      ) : null}
                      {c.email ? <span className="crmCustomerRowMeta">{c.email}</span> : null}
                      {listTab === "lost" ? (
                        <span className="crmCustomerRowLostMeta">{formatRelativeSince(c.last_call_at)}</span>
                      ) : null}
                      <span className="crmCustomerRowAssignee">
                        {assignLabel ? `Assigned: ${assignLabel}` : "Unassigned"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="crmCard crmDetailPanel" aria-label="Customer detail">
          {!selected ? (
            <p className="crmDetailEmpty">Select a customer</p>
          ) : (
            <>
              <div className="crmCustomerDetailTop">
                <div className="crmCustomerDetailMain">
                  <div className="crmCustomerDetailMeta">
                    <div className="crmProfileHeader">
                      <h3 className="crmProfileTitle">{selected.display_name}</h3>
                      <div className="crmProfileHeaderActions">
                        {selected.status === "lost" ? (
                          <button
                            type="button"
                            className="topBarSheetButton crmRestoreButton"
                            disabled={restoring}
                            onClick={() => void onRestoreFromProfile()}
                          >
                            {restoring ? "Restoring…" : "Restore to active"}
                          </button>
                        ) : null}
                        {isDirectoryAdmin ? (
                          <button
                            type="button"
                            className="crmButtonDanger"
                            disabled={deletingCustomer}
                            onClick={() => void onDeleteCustomer()}
                          >
                            {deletingCustomer ? "Deleting…" : "Delete customer"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="crmProfileEditBtn"
                          aria-label="Credit application info"
                          onClick={() => setCreditInfoOpen(true)}
                        >
                          <span aria-hidden="true">i</span>
                        </button>
                        <button
                          type="button"
                          className="crmProfileEditBtn"
                          aria-label="Edit customer"
                          onClick={() => setEditModalOpen(true)}
                        >
                          <span aria-hidden="true">✎</span>
                        </button>
                      </div>
                    </div>

                    <dl className="crmProfileSummary">
                      {selected.phone ? (
                        <>
                          <dt>Phone</dt>
                          <dd>{formatPhoneDisplay(selected.phone)}</dd>
                        </>
                      ) : null}
                      {selected.secondary_phone ? (
                        <>
                          <dt>Secondary</dt>
                          <dd>{formatPhoneDisplay(selected.secondary_phone)}</dd>
                        </>
                      ) : null}
                      {selected.email ? (
                        <>
                          <dt>Email</dt>
                          <dd>{selected.email}</dd>
                        </>
                      ) : null}
                      {selected.date_of_birth ? (
                        <>
                          <dt>Date of birth</dt>
                          <dd>{selected.date_of_birth}</dd>
                        </>
                      ) : null}
                      <dt>Assigned to</dt>
                      <dd>
                        {selected.assigned_to
                          ? assigneeLabelForCustomer(selected) ??
                            selected.assigned_to_email ??
                            "Assigned (no display on file)"
                          : "Unassigned"}
                      </dd>
                      <dt className="crmProfileSummaryMeta">Profile created by</dt>
                      <dd className="crmProfileSummaryMeta">{profileCreatorLabel(selected, directory)}</dd>
                    </dl>
                    {!selected.phone && !selected.secondary_phone && !selected.email && !selected.date_of_birth ? (
                      <p className="crmMuted crmProfileSummaryEmpty">No phone, email, or date of birth on file.</p>
                    ) : null}
                  </div>
                </div>
                <CrmCustomerLenderRail
                  customerId={selected.id}
                  outcomes={lenderOutcomes}
                  onOutcomesPatch={patchLenderOutcomes}
                  onBanner={setBanner}
                />
              </div>

              <div className="crmLogActivityBlock">
                <form className="crmForm crmLogActivityForm" onSubmit={onAddActivity}>
                  <div className="crmLogActivityIntro">
                    <h3 className="crmLogActivityHeading">Log a call, comment, or text</h3>
                    <div className="crmKindRow" role="group" aria-label="Entry type">
                      <label className="crmRadio">
                        <input
                          type="radio"
                          name="crm-kind"
                          checked={actKind === "call"}
                          onChange={() => setActKind("call")}
                        />{" "}
                        Call
                      </label>
                      <label className="crmRadio">
                        <input
                          type="radio"
                          name="crm-kind"
                          checked={actKind === "comment"}
                          onChange={() => setActKind("comment")}
                        />{" "}
                        Comment
                      </label>
                      <label className="crmRadio">
                        <input
                          type="radio"
                          name="crm-kind"
                          checked={actKind === "text"}
                          onChange={() => setActKind("text")}
                        />{" "}
                        Text
                      </label>
                    </div>
                  </div>
                  <div className="crmLogNotesField">
                    <label className="loginLabel" htmlFor="crm-act-body">
                      Notes
                    </label>
                    <textarea
                      id="crm-act-body"
                      className="crmTextarea"
                      rows={4}
                      value={actBody}
                      onChange={(e) => setActBody(e.target.value)}
                      required
                      placeholder="What was discussed? Next steps?"
                    />
                  </div>
                  <button type="submit" className="loginButton crmLogSubmitButton" disabled={savingAct}>
                    {savingAct ? "Saving…" : "Add entry"}
                  </button>
                </form>
              </div>

              <div className="crmActivityHistorySection">
                <h3 className="crmSubheading">History</h3>
                {detailLoading ? (
                  <p className="crmMuted">Loading activity…</p>
                ) : activities.length === 0 ? (
                  <p className="crmMuted">No calls, comments, or texts yet.</p>
                ) : (
                  <ul className="crmActivityList">
                    {activities.map((a) => (
                      <li key={a.id} className="crmActivityItem">
                        <div className="crmActivityHead">
                          <div className="crmActivityHeadMain">
                            <span
                              className={
                                a.kind === "call"
                                  ? "crmBadge crmBadgeCall"
                                  : a.kind === "text"
                                    ? "crmBadge crmBadgeText"
                                    : "crmBadge crmBadgeComment"
                              }
                            >
                              {a.kind === "call" ? "Call" : a.kind === "text" ? "Text" : "Comment"}
                            </span>
                            <span className="crmActivityAuthor">{activityAuthorLabel(a)}</span>
                            <span className="crmActivityMeta">{formatWhen(a.created_at)}</span>
                          </div>
                          {isDirectoryAdmin ? (
                            <button
                              type="button"
                              className="crmActivityRemoveBtn"
                              disabled={deletingActivityId === a.id}
                              aria-label={`Remove ${a.kind} from history`}
                              onClick={() => void onRemoveActivity(a.id, a.kind)}
                            >
                              {deletingActivityId === a.id ? "Removing…" : "Remove"}
                            </button>
                          ) : null}
                        </div>
                        <p className="crmActivityBody">
                          {a.body.startsWith("Website pre-approval application")
                            ? formatSystemLeadCommentBody(a.body)
                            : a.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
