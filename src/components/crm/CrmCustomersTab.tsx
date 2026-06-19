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
import { CrmCallRecordingPlayer } from "./CrmCallRecordingPlayer";
import { CrmCreditAppInfoModal } from "./CrmCreditAppInfoModal";
import { CrmCustomerLenderRail } from "./CrmCustomerLenderRail";
import { CrmCustomerEditHistorySection } from "./CrmCustomerEditHistorySection";
import {
  CrmCustomerTaskForm,
  CrmCustomerTaskList,
  CrmCustomerTasksProvider
} from "./CrmCustomerTaskSection";
import { CrmCustomerTasksSidebar } from "./CrmCustomerTasksSidebar";
import { CrmCustomerListCollapseBtn, CrmCustomersSideRail, type CrmCustomersSidebarView } from "./CrmCustomersSideRail";
import { ActivityKindIcon, CallTaskIcon, ChatNavIcon } from "./CrmCustomerTaskIcons";
import { CrmLenderDecisionTag } from "./CrmLenderDecisionTag";
import { CrmPipelineStageSelect } from "./CrmPipelineStageSelect";
import { EditCustomerModal } from "./EditCustomerModal";
import {
  deleteCrmActivity,
  deleteCustomer,
  fetchActivities,
  fetchCustomers,
  fetchCrmUserDirectory,
  initiateTwilioCall,
  directoryAdminSetupMessage,
  resolveCrmDirectoryAdminStatus,
  fetchCustomerLenderOutcomes,
  fetchLenderOutcomesForCustomers,
  insertActivity,
  restoreCustomer,
  upsertMyCrmDirectoryRow,
  countIncompleteUpcomingCrmCustomerTasksForUser,
  fetchLeadSheetPrintPayloadForCustomer
} from "../../lib/crmApi";
import { useLeadSheetPrint } from "../../hooks/useLeadSheetPrint";
import { CrmLeadSheetPrintButton } from "./CrmLeadSheetPrintButton";
import { supabase } from "../../lib/supabase";
import { directoryPersonLabel, directoryUsername, profileCreatorLabel } from "../../utils/crmDirectoryAdmin";
import { formatSystemLeadCommentBody } from "../../utils/canadianProvince";
import { isSystemLeadActivityComment } from "../../utils/crmLeadSheetPrint";
import {
  filterCustomersByAssignee,
  filterCustomersByPipelineStage,
  filterCustomersBySearch,
  formatRelativeSince,
  sortCustomers,
  CUSTOMER_SORT_OPTIONS,
  type CrmCustomerSortKey
} from "../../utils/crmSearch";
import { aggregateLenderDecisionTag, type CrmLenderDecisionTag as CrmLenderDecisionTagValue } from "../../utils/lenderOutcomeTag";
import { useCrmPipelineStagesContext } from "../../context/CrmPipelineStagesContext";
import { useCrmPermissionsContext } from "../../context/CrmPermissionsContext";
import { useCrmLendersContext } from "../../context/CrmLendersContext";
import { formatPhoneDisplay } from "../../utils/phoneFormat";
import { formatPhoneIntelligenceSummary, parsePhoneIntelligence } from "../../utils/crmPhoneIntelligence";
import { twilioRecordingBadgeState } from "../../utils/crmActivityRecordingBadge";

const PANEL_OPEN_KEY = "crm-customers-panel-open";

const ACTIVITY_KIND_OPTIONS: { value: CrmActivityKind; label: string }[] = [
  { value: "call", label: "Call" },
  { value: "comment", label: "Comment" },
  { value: "text", label: "Text" }
];

function readPanelOpen(): boolean {
  try {
    const stored = localStorage.getItem(PANEL_OPEN_KEY);
    if (stored === "0") {
      return false;
    }
    if (stored === "1") {
      return true;
    }
    if (localStorage.getItem("crm-customers-list-collapsed") === "1") {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

function writePanelOpen(value: boolean) {
  try {
    localStorage.setItem(PANEL_OPEN_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

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

function compactAssigneeFilterLabel(value: string, label: string): string {
  if (value === "all") {
    return "All";
  }
  if (value === "unassigned") {
    return "Open";
  }
  if (value === "me") {
    return "Me";
  }
  return label.length > 12 ? `${label.slice(0, 11)}…` : label;
}

function compactPipelineFilterLabel(value: string, label: string): string {
  if (value === "all") {
    return "All";
  }
  return label.length > 12 ? `${label.slice(0, 11)}…` : label;
}

function compactSortLabel(value: CrmCustomerSortKey, label: string): string {
  if (value === "pipeline") {
    return "Pipeline";
  }
  if (value === "created") {
    return "Created";
  }
  if (value === "last_touch") {
    return "Touch";
  }
  return label;
}

function TwilioCallRecordingBadge({ activity, nowMs }: { activity: CrmActivity; nowMs: number }) {
  const state = twilioRecordingBadgeState(activity, nowMs);
  if (state === "recorded") {
    return <span className="crmBadge crmBadgeRecorded">Recorded</span>;
  }
  if (state === "processing") {
    return <span className="crmBadge crmBadgeRecordedPending">Processing recording…</span>;
  }
  if (state === "failed") {
    return <span className="crmBadge crmBadgeCallFailed">CALL FAILED</span>;
  }
  return null;
}

export function CrmCustomersTab({
  focusCustomerId = null,
  onFocusCustomerHandled,
  externalSearchQuery,
  onOpenChat,
  outboundCall = null,
  outboundCallDoneAt = 0,
  onOutboundCallSessionChange
}: {
  focusCustomerId?: string | null;
  onFocusCustomerHandled?: () => void;
  externalSearchQuery?: string;
  onOpenChat?: (customerId: string) => void;
  outboundCall?: { sessionId: string; customerId: string; customerName: string } | null;
  outboundCallDoneAt?: number;
  onOutboundCallSessionChange?: (
    session: { sessionId: string; customerId: string; customerName: string } | null
  ) => void;
} = {}) {
  const pipeline = useCrmPipelineStagesContext();
  const permissions = useCrmPermissionsContext();
  const { financeEnabled } = useCrmLendersContext();
  const [meId, setMeId] = useState<string | null>(null);
  const [meEmail, setMeEmail] = useState<string | null>(null);
  const [directory, setDirectory] = useState<CrmUserDirectoryRow[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [pipelineFilter, setPipelineFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<CrmCustomerSortKey>("created");
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
  const [adminSetupBanner, setAdminSetupBanner] = useState<string | null>(null);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);
  const [placingCall, setPlacingCall] = useState(false);
  const [activityPollToken, setActivityPollToken] = useState(0);
  const [recordingBadgeNow, setRecordingBadgeNow] = useState(() => Date.now());
  const [editHistoryRefresh, setEditHistoryRefresh] = useState(0);
  const [lenderOutcomes, setLenderOutcomes] = useState<Partial<Record<CrmLenderSlug, CrmLenderOutcomeEntry>>>({});
  const [customerLenderTags, setCustomerLenderTags] = useState<Map<string, CrmLenderDecisionTagValue>>(new Map());
  const [sidebarView, setSidebarView] = useState<CrmCustomersSidebarView>("customers");
  const [panelOpen, setPanelOpen] = useState(readPanelOpen);
  const [incompleteTaskCount, setIncompleteTaskCount] = useState(0);
  const [printingSystemLead, setPrintingSystemLead] = useState(false);
  const { printLeadSheet, printPortal } = useLeadSheetPrint();
  const [isMobileLayout, setIsMobileLayout] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );
  const selected = customers.find((c) => c.id === selectedId) ?? null;
  const selectedPhoneIntelSummary = useMemo(() => {
    if (!selected) {
      return null;
    }
    const intel = parsePhoneIntelligence(selected.profile_metadata);
    return intel ? formatPhoneIntelligenceSummary(intel) : null;
  }, [selected]);
  const canPlaceCall = permissions.hasPermission("calls.place") && !!(selected?.phone || selected?.secondary_phone);
  const canOpenChat =
    !!onOpenChat &&
    permissions.hasPermission("texts.view") &&
    !!(selected?.phone || selected?.secondary_phone);
  const showListPanel = panelOpen || isMobileLayout;
  const showToolbarSearch = sidebarView === "customers";
  const showToolbarSorters = true;
  const showSearchInChrome = showToolbarSearch && (isMobileLayout || !showListPanel);
  const showSearchInListColumn = showToolbarSearch && !isMobileLayout && showListPanel;

  const customerSearchInput = showToolbarSearch ? (
    <input
      type="search"
      className="crmSearchInput"
      placeholder="Search name, email, or phone…"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      aria-label="Search customers"
    />
  ) : null;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileLayout(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const customersAfterAssignee = useMemo(
    () => filterCustomersByAssignee(customers, assigneeFilter, meId),
    [customers, assigneeFilter, meId]
  );

  const customersAfterPipeline = useMemo(
    () => (listTab === "active" ? filterCustomersByPipelineStage(customersAfterAssignee, pipelineFilter) : customersAfterAssignee),
    [customersAfterAssignee, pipelineFilter, listTab]
  );

  const activeCountForAssignee = useMemo(
    () => filterCustomersByAssignee(activeCustomers, assigneeFilter, meId).length,
    [activeCustomers, assigneeFilter, meId]
  );

  const assignedCustomerCount = useMemo(() => {
    if (!meId) {
      return 0;
    }
    return activeCustomers.filter((c) => c.assigned_to === meId).length;
  }, [activeCustomers, meId]);

  const sidebarCustomerCount = useMemo(() => {
    if (listTab === "lost") {
      return customersAfterAssignee.length;
    }
    return assignedCustomerCount;
  }, [assignedCustomerCount, customersAfterAssignee.length, listTab]);

  const reloadIncompleteTaskCount = useCallback(async () => {
    if (!meId) {
      setIncompleteTaskCount(0);
      return;
    }
    const result = await countIncompleteUpcomingCrmCustomerTasksForUser(meId);
    if (!result.error) {
      setIncompleteTaskCount(result.count);
    }
  }, [meId]);

  const filteredCustomers = useMemo(
    () => filterCustomersBySearch(customersAfterPipeline, searchQuery),
    [customersAfterPipeline, searchQuery]
  );

  const sortedCustomers = useMemo(
    () => sortCustomers(filteredCustomers, sortKey, pipeline.sortRank),
    [filteredCustomers, sortKey, pipeline.sortRank]
  );

  const assigneeFilterOptions = useMemo(
    () => buildAssigneeFilterOptions(customers, directory),
    [customers, directory]
  );

  const toolbarAssigneeOptions = useMemo(
    () =>
      isMobileLayout
        ? assigneeFilterOptions.map((option) => ({
            ...option,
            label: compactAssigneeFilterLabel(option.value, option.label)
          }))
        : assigneeFilterOptions,
    [assigneeFilterOptions, isMobileLayout]
  );

  const toolbarPipelineOptions = useMemo(
    () =>
      isMobileLayout
        ? pipeline.filterOptions.map((option) => ({
            ...option,
            label: compactPipelineFilterLabel(option.value, option.label)
          }))
        : pipeline.filterOptions,
    [isMobileLayout, pipeline.filterOptions]
  );

  const toolbarSortOptions = useMemo(
    () =>
      isMobileLayout
        ? CUSTOMER_SORT_OPTIONS.map((option) => ({
            ...option,
            label: compactSortLabel(option.value, option.label)
          }))
        : CUSTOMER_SORT_OPTIONS,
    [isMobileLayout]
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
        setCustomerLenderTags(new Map());
        return;
      }
      setCustomers(listRes.data);
      if (status === "active") {
        setActiveCustomers(listRes.data);
        if (financeEnabled) {
          const ids = listRes.data.map((c) => c.id);
          const { data: outcomesByCustomer, error: lenderErr } = await fetchLenderOutcomesForCustomers(ids);
          if (lenderErr) {
            setBanner(lenderErr);
            setCustomerLenderTags(new Map());
          } else {
            const tagMap = new Map<string, CrmLenderDecisionTagValue>();
            for (const [customerId, outcomes] of outcomesByCustomer) {
              const tag = aggregateLenderDecisionTag(outcomes);
              if (tag) {
                tagMap.set(customerId, tag);
              }
            }
            setCustomerLenderTags(tagMap);
          }
        } else {
          setCustomerLenderTags(new Map());
        }
      } else {
        setCustomerLenderTags(new Map());
        if (activeRes && !activeRes.error) {
          setActiveCustomers(activeRes.data);
        }
      }
      void reloadIncompleteTaskCount();
    },
    [financeEnabled, listTab, reloadIncompleteTaskCount]
  );

  useEffect(() => {
    void reloadCustomers();
  }, [reloadCustomers]);

  useEffect(() => {
    void reloadIncompleteTaskCount();
  }, [reloadIncompleteTaskCount]);

  useEffect(() => {
    if (!focusCustomerId) {
      return;
    }
    setListTab("active");
    setSelectedId(focusCustomerId);
    void reloadCustomers("active");
    onFocusCustomerHandled?.();
  }, [focusCustomerId, onFocusCustomerHandled, reloadCustomers]);

  useEffect(() => {
    if (externalSearchQuery === undefined) {
      return;
    }
    setSearchQuery(externalSearchQuery);
  }, [externalSearchQuery]);

  const goToListTab = (tab: CrmCustomerStatus) => {
    setEditModalOpen(false);
    setListTab(tab);
    setSelectedId(null);
    setSearchQuery("");
    setAssigneeFilter("all");
    setPipelineFilter("all");
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
  }, [selectedId, activityPollToken]);

  useEffect(() => {
    const hasProcessingRecording = activities.some(
      (activity) => twilioRecordingBadgeState(activity) === "processing"
    );
    if (!hasProcessingRecording) {
      return;
    }
    const timer = window.setInterval(() => {
      setRecordingBadgeNow(Date.now());
    }, 15_000);
    return () => {
      window.clearInterval(timer);
    };
  }, [activities]);

  useEffect(() => {
    if (!selectedId || activityPollToken === 0) {
      return;
    }
    const delays = [15000, 30000, 45000, 60000, 90000, 120000, 180000, 240000];
    const timers = delays.map((delay) =>
      window.setTimeout(() => {
        void fetchActivities(selectedId).then(({ data, error }) => {
          if (!error) {
            setActivities(data);
          }
        });
      }, delay)
    );
    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    };
  }, [selectedId, activityPollToken]);

  useEffect(() => {
    if (!financeEnabled) {
      setLenderOutcomes({});
      setCustomerLenderTags(new Map());
    }
  }, [financeEnabled]);

  useEffect(() => {
    if (!selectedId || !financeEnabled) {
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
  }, [financeEnabled, selectedId]);

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
        if (selectedId && financeEnabled) {
          const tag = aggregateLenderDecisionTag(next);
          setCustomerLenderTags((tags) => {
            const updated = new Map(tags);
            if (tag) {
              updated.set(selectedId, tag);
            } else {
              updated.delete(selectedId);
            }
            return updated;
          });
        }
        return next;
      });
    },
    [financeEnabled, selectedId]
  );

  const onPipelineStageChanged = useCallback((updated: CrmCustomer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setActiveCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setEditHistoryRefresh((n) => n + 1);
  }, []);

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

  const onPlaceCall = async () => {
    if (!selectedId || (!selected?.phone && !selected?.secondary_phone)) {
      return;
    }
    setPlacingCall(true);
    setBanner(null);
    onOutboundCallSessionChange?.(null);
    const result = await initiateTwilioCall(selectedId);
    setPlacingCall(false);
    if (!result.ok) {
      setBanner(result.error);
      return;
    }
    if (result.sessionId) {
      onOutboundCallSessionChange?.({
        sessionId: result.sessionId,
        customerId: selectedId,
        customerName: selected?.display_name ?? "Customer"
      });
    } else {
      setBanner(result.message ?? "Calling your phone now. Answer to connect to the customer.");
    }
    setActivityPollToken((value) => value + 1);
    if (result.pipelineStage) {
      const patchStage = result.pipelineStage;
      setCustomers((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, pipeline_stage: patchStage } : c))
      );
      setActiveCustomers((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, pipeline_stage: patchStage } : c))
      );
    }
  };

  useEffect(() => {
    if (!outboundCallDoneAt || !selectedId || !outboundCall || outboundCall.customerId !== selectedId) {
      return;
    }
    setActivityPollToken((value) => value + 1);
    void fetchActivities(selectedId).then(({ data, error }) => {
      if (!error) {
        setActivities(data);
      }
    });
  }, [outboundCallDoneAt, selectedId, outboundCall]);

  const formatWhen = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  const activityAuthorLabel = (a: CrmActivity) => {
    if (!a.author_id) {
      return a.source === "twilio" ? "Twilio" : "System";
    }
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
    bumpEditHistory();
  };

  const bumpEditHistory = () => setEditHistoryRefresh((n) => n + 1);

  const handleEditSaved = async () => {
    await reloadCustomers(listTab);
    bumpEditHistory();
  };

  const handleCreditInfoSaved = async () => {
    if (!selectedId) {
      return;
    }
    await reloadCustomers(listTab);
    bumpEditHistory();
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
  const customerListTabLabel = listTab === "active" ? "Active customers" : "Lost customers";

  const togglePanel = () => {
    setPanelOpen((prev) => {
      const next = !prev;
      writePanelOpen(next);
      return next;
    });
  };

  const selectSidebarView = (view: CrmCustomersSidebarView) => {
    setSidebarView(view);
    setPanelOpen(true);
    writePanelOpen(true);
  };

  const openCustomerFromTask = (customerId: string) => {
    setSelectedId(customerId);
  };

  const onPrintSystemLead = async () => {
    if (!selected || printingSystemLead) {
      return;
    }
    setPrintingSystemLead(true);
    setBanner(null);
    const payload = await fetchLeadSheetPrintPayloadForCustomer(selected, directory);
    setPrintingSystemLead(false);
    if ("error" in payload) {
      setBanner(payload.error);
      return;
    }
    printLeadSheet({
      form: payload.form,
      customerName: payload.customerName,
      assigneeLabel: payload.assigneeLabel,
      sourceLabel: payload.sourceLabel,
      notes: payload.notes
    });
  };

  const customersSideRail = (
    <CrmCustomersSideRail
      activeView={sidebarView}
      onSelectView={selectSidebarView}
      customerCount={sidebarCustomerCount}
      customerListTab={listTab}
      taskCount={incompleteTaskCount}
    />
  );

  const customersLayoutChrome = (
    <div className="crmCustomersLayoutChrome">
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

      <div className="crmPanelHeadingRow crmCustomersTitleRow">
        <div className="crmPanelHeadingGroup">
          <h2 id="crm-customers-heading" className="crmPanelHeading">
            Customers
          </h2>
          <p className="crmCustomersCount" aria-live="polite">
            {listLoading
              ? "…"
              : listTab === "active"
                ? `${activeCountForAssignee} active`
                : `${customersAfterAssignee.length} lost`}
          </p>
        </div>
      </div>

      <div className="crmCustomersToolbar">
        <div className="crmCustomersToolbarLead">
          {showSearchInChrome ? (
            <div className="crmCustomersToolbarSearch">{customerSearchInput}</div>
          ) : null}
          <div className="crmCustomersToolbarActions">
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
            <button type="button" className="topBarSheetButton crmAddCustomerBtn" onClick={() => setAddModalOpen(true)}>
              <svg className="crmAddCustomerBtnIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M11 11V6a1 1 0 1 1 2 0v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H6a1 1 0 1 1 0-2h5z"
                />
              </svg>
              Add customer
            </button>
          </div>
        </div>
        {showToolbarSorters ? (
          <div
            className={`crmCustomersToolbarSorters${isMobileLayout ? " crmCustomersToolbarSortersMobile" : ""}`}
          >
            <label className="crmToolbarAssignee">
              <span className="crmToolbarAssigneeLabel">Assignee</span>
              <select
                className="crmAssigneeSelect"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                aria-label="Filter by assignee"
              >
                {toolbarAssigneeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {sidebarView === "customers" && listTab === "active" ? (
              <label className="crmToolbarAssignee">
                <span className="crmToolbarAssigneeLabel">Pipeline</span>
                <select
                  className="crmAssigneeSelect"
                  value={pipelineFilter}
                  onChange={(e) => setPipelineFilter(e.target.value)}
                  aria-label="Filter by pipeline stage"
                >
                  {toolbarPipelineOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {sidebarView === "customers" ? (
              <label className="crmToolbarAssignee">
                <span className="crmToolbarAssigneeLabel">{isMobileLayout ? "Sort" : "Sort by"}</span>
                <select
                  className="crmAssigneeSelect"
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as CrmCustomerSortKey)}
                  aria-label="Sort customers"
                >
                  {toolbarSortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div
      className={`crmCustomersLayout${showListPanel ? " crmCustomersLayoutPanelOpen" : " crmCustomersLayoutPanelCollapsed"}${selectedId ? " crmCustomersLayoutDetailOpen" : ""}`}
    >
      <AddCustomerModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSaved={(id) => {
          setSearchQuery("");
          setListTab("active");
          setSelectedId(id);
          void reloadCustomers("active");
          bumpEditHistory();
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
        onPipelineStageChanged={onPipelineStageChanged}
      />
      <CrmCreditAppInfoModal
        open={creditInfoOpen}
        customer={selected}
        directory={directory}
        onClose={() => setCreditInfoOpen(false)}
        onSaved={() => void handleCreditInfoSaved()}
      />

      {customersLayoutChrome}

      <div className="crmCustomersScrollBody">
      <div className="crmCustomersGrid crmCustomersGridWithRail">
        <div
          className={`crmCustomersLeftSlot${showListPanel ? " crmCustomersLeftSlotExpanded" : " crmCustomersLeftSlotCollapsed"}${isMobileLayout ? " crmCustomersLeftSlotMobile" : ""}`}
        >
          {isMobileLayout ? customersSideRail : null}
          {showSearchInListColumn ? (
            <div className="crmCustomerListSearchRow">{customerSearchInput}</div>
          ) : null}
          {showListPanel ? (
            <section
              className="crmCard crmCustomerListPanel"
              aria-label={sidebarView === "customers" ? "Customer list" : "Task list"}
            >
              {!isMobileLayout ? (
                <div className="crmCustomerListPanelHead">
                  <div className="crmCustomerListViewTabs" role="group" aria-label="List view">
                    <button
                      type="button"
                      className={`crmCustomerListViewTab${sidebarView === "customers" ? " crmCustomerListViewTabActive" : ""}`}
                      onClick={() => selectSidebarView("customers")}
                      aria-pressed={sidebarView === "customers"}
                    >
                      {customerListTabLabel}
                    </button>
                    <button
                      type="button"
                      className={`crmCustomerListViewTab${sidebarView === "tasks" ? " crmCustomerListViewTabActive" : ""}`}
                      onClick={() => selectSidebarView("tasks")}
                      aria-pressed={sidebarView === "tasks"}
                    >
                      Tasks
                    </button>
                  </div>
                  <CrmCustomerListCollapseBtn onClick={togglePanel} />
                </div>
              ) : null}

              {sidebarView === "customers" ? (
                <>
                  <span id={listTitleId} className="crmVisuallyHidden">
                    {customerListTabLabel}
                  </span>
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
                  : customersAfterPipeline.length === 0
                    ? "No customers match this pipeline filter."
                    : "No matches for your search."}
            </p>
          ) : (
            <ul className="crmCustomerList" aria-labelledby={listTitleId}>
              {sortedCustomers.map((c) => {
                const assignLabel = assigneeLabelForCustomer(c);
                const lenderTag = customerLenderTags.get(c.id) ?? null;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={`crmCustomerRow ${c.id === selectedId ? "crmCustomerRowActive" : ""}`}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <div className="crmCustomerRowBody">
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
                      </div>
                      <div className="crmCustomerRowStatusStack">
                        <span className="crmPipelineBadge crmPipelineBadgeThemed" style={pipeline.badgeStyle(c.pipeline_stage)}>
                          {pipeline.formatLabel(c.pipeline_stage)}
                        </span>
                        {financeEnabled && lenderTag ? <CrmLenderDecisionTag tag={lenderTag} /> : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
                </>
              ) : (
                <CrmCustomerTasksSidebar
                  userId={meId}
                  assigneeFilter={assigneeFilter}
                  onSelectCustomer={openCustomerFromTask}
                />
              )}
            </section>
          ) : (
            customersSideRail
          )}
        </div>

        <section className="crmCard crmDetailPanel" aria-label="Customer detail">
          {!selected ? (
            <p className="crmDetailEmpty">Select a customer</p>
          ) : (
            <>
              <button
                type="button"
                className="crmCustomerMobileBackBtn"
                onClick={() => setSelectedId(null)}
              >
                {sidebarView === "tasks" ? "← Tasks" : "← Customers"}
              </button>
              <div className="crmCustomerDetailTop">
                <div className="crmProfileTitleBlock">
                  <div className="crmProfileTitleRow">
                    <div className="crmProfileNameStack">
                      <div className="crmProfileNameColumn">
                        <div className="crmProfileStatusRow">
                          <CrmPipelineStageSelect
                            customer={selected}
                            onStageChanged={onPipelineStageChanged}
                            onBanner={setBanner}
                          />
                          {financeEnabled ? (
                            <CrmLenderDecisionTag outcomes={lenderOutcomes} className="crmProfileLenderTag" />
                          ) : null}
                        </div>
                        <div className="crmProfileNameLine">
                          <h3 className="crmProfileTitle">{selected.display_name}</h3>
                          <button
                            type="button"
                            className="crmProfileEditBtn crmProfileTitleEditBtn"
                            aria-label="Edit customer"
                            onClick={() => setEditModalOpen(true)}
                          >
                            <span className="crmProfileTitleEditIcon" aria-hidden="true">
                              ✎
                            </span>
                            <span className="crmProfileTitleEditLabel">Edit</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="crmCustomerDetailMain">
                    <div className="crmCustomerDetailMeta">
                      <dl className="crmProfileSummary">
                        {selected.phone ? (
                          <>
                            <dt>Phone</dt>
                            <dd className={canPlaceCall || canOpenChat ? "crmProfilePhoneRow" : undefined}>
                              {isMobileLayout ? (
                                <span className="crmProfilePhoneMobileGroup">
                                  {canPlaceCall ? (
                                    <button
                                      type="button"
                                      className="crmProfilePhoneMobileCallLink"
                                      disabled={placingCall || outboundCall?.customerId === selectedId}
                                      onClick={() => void onPlaceCall()}
                                    >
                                      {placingCall
                                        ? "Calling your phone…"
                                        : outboundCall?.customerId === selectedId
                                          ? "Call in progress…"
                                          : formatPhoneDisplay(selected.phone)}
                                    </button>
                                  ) : (
                                    <span className="crmProfilePhoneValue">{formatPhoneDisplay(selected.phone)}</span>
                                  )}
                                  {canOpenChat ? (
                                    <button
                                      type="button"
                                      className="crmProfilePhoneActionIconBtn"
                                      aria-label="Text customer"
                                      title="Text customer"
                                      onClick={() => onOpenChat(selectedId!)}
                                    >
                                      <ChatNavIcon className="crmProfilePhoneActionIcon" />
                                    </button>
                                  ) : null}
                                </span>
                              ) : (
                                <>
                                  <span className="crmProfilePhoneValue">{formatPhoneDisplay(selected.phone)}</span>
                                  {canPlaceCall ? (
                                    <button
                                      type="button"
                                      className="crmProfilePhoneActionIconBtn"
                                      aria-label="Call customer"
                                      title={
                                        placingCall
                                          ? "Calling your phone…"
                                          : outboundCall?.customerId === selectedId
                                            ? "Call in progress…"
                                            : "Call customer"
                                      }
                                      disabled={placingCall || outboundCall?.customerId === selectedId}
                                      onClick={() => void onPlaceCall()}
                                    >
                                      <CallTaskIcon className="crmProfilePhoneActionIcon" />
                                    </button>
                                  ) : null}
                                  {canOpenChat ? (
                                    <button
                                      type="button"
                                      className="crmProfilePhoneActionIconBtn"
                                      aria-label="Text customer"
                                      title="Text customer"
                                      onClick={() => onOpenChat(selectedId!)}
                                    >
                                      <ChatNavIcon className="crmProfilePhoneActionIcon" />
                                    </button>
                                  ) : null}
                                </>
                              )}
                              {selectedPhoneIntelSummary ? (
                                <p className="crmProfilePhoneIntel">{selectedPhoneIntelSummary}</p>
                              ) : null}
                            </dd>
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
                </div>
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
                  <div className="crmProfileHeaderActionStack">
                    <button
                      type="button"
                      className="crmProfileEditBtn"
                      aria-label="Credit application info"
                      onClick={() => setCreditInfoOpen(true)}
                    >
                      <span aria-hidden="true">i</span>
                      <span>App info</span>
                    </button>
                    {permissions.hasPermission("customers.delete") ? (
                      <button
                        type="button"
                        className="crmButtonDanger crmProfileDeleteBtn"
                        disabled={deletingCustomer}
                        onClick={() => void onDeleteCustomer()}
                      >
                        {deletingCustomer ? "Deleting…" : "Delete"}
                      </button>
                    ) : null}
                  </div>
                </div>
                {financeEnabled ? (
                  <div className="crmCustomerDetailLenders">
                    <CrmCustomerLenderRail
                      customerId={selected.id}
                      outcomes={lenderOutcomes}
                      onOutcomesPatch={patchLenderOutcomes}
                      onBanner={setBanner}
                      isMobileLayout={isMobileLayout}
                    />
                  </div>
                ) : null}
              </div>

              <CrmCustomerTasksProvider
                customer={selected}
                directory={directory}
                meId={meId}
                meEmail={meEmail}
                onTasksChanged={reloadIncompleteTaskCount}
              >
                <div className="crmLogActivityBlock">
                  <div className="crmLogActivityColumn">
                    <form className="crmForm crmLogActivityForm" onSubmit={onAddActivity}>
                      <div className="crmLogActivityIntro">
                        <h3 className="crmLogActivityHeading">Log a call, comment, or text</h3>
                        <div className="crmCustomerTaskTypeRow" role="group" aria-label="Entry type">
                          {ACTIVITY_KIND_OPTIONS.map(({ value, label }) => (
                            <button
                              key={value}
                              type="button"
                              className={`crmCustomerTaskTypeBtn${actKind === value ? " crmCustomerTaskTypeBtnActive" : ""}`}
                              onClick={() => setActKind(value)}
                              aria-pressed={actKind === value}
                            >
                              <ActivityKindIcon kind={value} />
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div
                        className={`crmLogNotesField${
                          isMobileLayout && actKind === "comment" ? " crmLogNotesFieldWithSend" : ""
                        }`}
                      >
                        <textarea
                          id="crm-act-body"
                          className="crmTextarea"
                          rows={4}
                          value={actBody}
                          onChange={(e) => setActBody(e.target.value)}
                          required
                          aria-label="Notes"
                          placeholder="What was discussed? Next steps?"
                        />
                        {isMobileLayout && actKind === "comment" ? (
                          <button
                            type="submit"
                            className="crmLogNotesSendBtn"
                            disabled={savingAct || !actBody.trim()}
                            aria-label={savingAct ? "Saving comment" : "Add comment"}
                            title={savingAct ? "Saving…" : "Add comment"}
                          >
                            <svg
                              className="crmLogNotesSendIcon"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                              focusable="false"
                            >
                              <path d="M12 19V5M5 12l7-7 7 7" />
                            </svg>
                          </button>
                        ) : null}
                      </div>
                      {!(isMobileLayout && actKind === "comment") ? (
                        <button type="submit" className="loginButton crmLogSubmitButton" disabled={savingAct}>
                          {savingAct ? "Saving…" : "Add entry"}
                        </button>
                      ) : null}
                    </form>
                  </div>

                  <CrmCustomerTaskForm />
                </div>

                <CrmCustomerEditHistorySection
                  customerId={selected.id}
                  directory={directory}
                  refreshToken={editHistoryRefresh}
                  onBanner={setBanner}
                />

                <CrmCustomerTaskList />

                <div className="crmActivityHistorySection">
                <h3 className="crmSubheading">Calls & comments</h3>
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
                            <TwilioCallRecordingBadge activity={a} nowMs={recordingBadgeNow} />
                          </div>
                          {isSystemLeadActivityComment(a.body) ? (
                            <div className="crmActivityHeadActions">
                              <CrmLeadSheetPrintButton
                                className="crmActivityPrintBtn"
                                disabled={printingSystemLead}
                                onClick={() => void onPrintSystemLead()}
                              />
                              {permissions.hasPermission("activities.delete_any") ? (
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
                          ) : permissions.hasPermission("activities.delete_any") ? (
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
                          {isSystemLeadActivityComment(a.body)
                            ? formatSystemLeadCommentBody(a.body)
                            : a.body}
                        </p>
                        {a.source === "twilio" && a.recording_storage_path ? (
                          <CrmCallRecordingPlayer
                            activityId={a.id}
                            canListen={permissions.hasPermission("calls.listen")}
                          />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              </CrmCustomerTasksProvider>
            </>
          )}
        </section>
      </div>
      </div>
      {printPortal}
    </div>
  );
}
