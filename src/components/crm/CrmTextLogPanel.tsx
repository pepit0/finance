import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CrmCallLogDirectionFilter,
  CrmCallLogPhoneParty,
  CrmSmsStatus,
  CrmTextLogEntry,
  CrmTextLogSortKey,
  CrmUserDirectoryRow
} from "../../types/crm";
import {
  crmTodoLocalDate,
  fetchCrmOriginLocalDate,
  fetchCrmUserDirectory,
  fetchTextLog,
  normalizeCrmDateRange
} from "../../lib/crmApi";
import { directoryPersonLabel } from "../../utils/crmDirectoryAdmin";
import { supabase } from "../../lib/supabase";
import { CallLogPhoneLine, CallLogPhonePartyLabel } from "./CrmCallLogPanel";

type CrmTextLogPanelProps = {
  visible: boolean;
  embedded?: boolean;
  onOpenCustomer?: (customerId: string) => void;
};

const DIRECTION_OPTIONS: { value: CrmCallLogDirectionFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "inbound", label: "Inbound" },
  { value: "outbound", label: "Outbound" }
];

const SORT_OPTIONS: { value: CrmTextLogSortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" }
];

function buildCrmUserFilterOptions(directory: CrmUserDirectoryRow[], meId: string | null) {
  const options: { value: string; label: string }[] = [{ value: "all", label: "All users" }];
  if (meId) {
    options.push({ value: "me", label: "Me" });
  }
  const sorted = [...directory].sort((a, b) =>
    directoryPersonLabel(a).localeCompare(directoryPersonLabel(b))
  );
  for (const row of sorted) {
    if (row.user_id === meId) {
      continue;
    }
    options.push({ value: row.user_id, label: directoryPersonLabel(row) });
  }
  return options;
}

function filterTextLogByCrmUser(
  entries: CrmTextLogEntry[],
  filter: string,
  meId: string | null
): CrmTextLogEntry[] {
  if (filter === "all") {
    return entries;
  }
  if (filter === "me") {
    if (!meId) {
      return [];
    }
    return entries.filter((entry) => entry.author_id === meId);
  }
  return entries.filter((entry) => entry.author_id === filter);
}

function sortTextLogEntries(entries: CrmTextLogEntry[], sortKey: CrmTextLogSortKey): CrmTextLogEntry[] {
  if (sortKey === "newest") {
    return entries;
  }
  return [...entries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

function formatTextLogTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { timeStyle: "short" });
}

function formatTextLogWrittenDate(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
  if (date.getFullYear() !== today.getFullYear()) {
    options.year = "numeric";
  }
  return date.toLocaleDateString(undefined, options);
}

function truncateTextPreview(body: string, maxLen = 52) {
  const trimmed = body.trim().replace(/\s+/g, " ");
  if (trimmed.length <= maxLen) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

function textLogCustomerParty(entry: CrmTextLogEntry): CrmCallLogPhoneParty | null {
  const from = entry.sms_from_party;
  const to = entry.sms_to_party;
  if (entry.sms_direction === "inbound") {
    return from?.kind === "customer" ? from : null;
  }
  if (entry.sms_direction === "outbound") {
    return to?.kind === "customer" ? to : null;
  }
  if (from?.kind === "customer") {
    return from;
  }
  return to?.kind === "customer" ? to : null;
}

function textLogAgentParty(entry: CrmTextLogEntry): CrmCallLogPhoneParty | null {
  const from = entry.sms_from_party;
  const to = entry.sms_to_party;
  if (entry.sms_direction === "inbound") {
    return to?.kind === "crm_user" ? to : null;
  }
  if (entry.sms_direction === "outbound") {
    return from?.kind === "crm_user" ? from : null;
  }
  if (from?.kind === "crm_user") {
    return from;
  }
  return to?.kind === "crm_user" ? to : null;
}

function smsStatusBadgeClass(direction: CrmTextLogEntry["sms_direction"], status: CrmSmsStatus | null) {
  if (direction === "inbound") {
    return "crmCallLogSmsStatusTag crmCallLogSmsStatusTag--received";
  }
  if (status === "delivered" || status === "received") {
    return "crmCallLogSmsStatusTag crmCallLogSmsStatusTag--delivered";
  }
  if (status === "failed" || status === "undelivered") {
    return "crmCallLogSmsStatusTag crmCallLogSmsStatusTag--failed";
  }
  return "crmCallLogSmsStatusTag crmCallLogSmsStatusTag--sent";
}

function smsStatusBadgeLabel(direction: CrmTextLogEntry["sms_direction"], status: CrmSmsStatus | null) {
  if (direction === "inbound") {
    return "Received";
  }
  if (status === "delivered") {
    return "Delivered";
  }
  if (status === "failed" || status === "undelivered") {
    return "Failed";
  }
  if (status === "queued") {
    return "Queued";
  }
  if (status === "sent") {
    return "Sent";
  }
  if (status === "received") {
    return "Received";
  }
  return "Sent";
}

export function CrmTextLogPanel({ visible, embedded = false, onOpenCustomer }: CrmTextLogPanelProps) {
  const [direction, setDirection] = useState<CrmCallLogDirectionFilter>("all");
  const [crmUserFilter, setCrmUserFilter] = useState("all");
  const [sortKey, setSortKey] = useState<CrmTextLogSortKey>("newest");
  const [dateFrom, setDateFrom] = useState(crmTodoLocalDate());
  const [dateTo, setDateTo] = useState(crmTodoLocalDate());
  const [rangeReady, setRangeReady] = useState(false);
  const [entries, setEntries] = useState<CrmTextLogEntry[]>([]);
  const [directory, setDirectory] = useState<CrmUserDirectoryRow[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  const activeRange = useMemo(() => normalizeCrmDateRange(dateFrom, dateTo), [dateFrom, dateTo]);
  const crmUserFilterOptions = useMemo(
    () => buildCrmUserFilterOptions(directory, meId),
    [directory, meId]
  );
  const displayedEntries = useMemo(
    () => sortTextLogEntries(filterTextLogByCrmUser(entries, crmUserFilter, meId), sortKey),
    [crmUserFilter, entries, meId, sortKey]
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    void supabase.auth.getUser().then(({ data }) => {
      setMeId(data.user?.id ?? null);
    });
    void fetchCrmUserDirectory().then((result) => {
      if (!result.error) {
        setDirectory(result.data);
      }
    });
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    let cancelled = false;
    void fetchCrmOriginLocalDate().then((result) => {
      if (cancelled) {
        return;
      }
      setDateFrom(result.date);
      setDateTo(crmTodoLocalDate());
      if (result.error) {
        setBanner(result.error);
      }
      setRangeReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const reload = useCallback(async () => {
    if (!visible || !rangeReady) {
      setEntries([]);
      return;
    }
    setLoading(true);
    setBanner(null);
    const result = await fetchTextLog({ range: activeRange, direction });
    setLoading(false);
    if (result.error) {
      setBanner(result.error);
      setEntries([]);
      setSelectedActivityId(null);
      return;
    }
    setEntries(result.data);
    setSelectedActivityId((current) =>
      current && result.data.some((entry) => entry.id === current) ? current : null
    );
  }, [activeRange, direction, rangeReady, visible]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onFromChange = (value: string) => {
    setDateFrom(value);
    if (value && dateTo && value > dateTo) {
      setDateTo(value);
    }
  };

  const onToChange = (value: string) => {
    setDateTo(value);
    if (value && dateFrom && value < dateFrom) {
      setDateFrom(value);
    }
  };

  const onSelectEntry = (entryId: string) => {
    setSelectedActivityId((current) => (current === entryId ? null : entryId));
  };

  if (!visible) {
    return null;
  }

  return (
    <section
      className={`crmCallLogPanel crmTextLogPanel${embedded ? " crmCallLogPanelEmbedded" : ""}`}
      aria-labelledby={embedded ? undefined : "crm-text-log-heading"}
    >
      <header className="crmCallLogHeader">
        {!embedded ? (
          <div className="crmCallLogHeaderLead">
            <h2 id="crm-text-log-heading" className="crmCallLogTitle">
              Recent texts
            </h2>
            {rangeReady && !loading ? (
              <span className="crmCallLogCount">
                {displayedEntries.length} {displayedEntries.length === 1 ? "text" : "texts"}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="crmCallLogFilterBar">
          <div className="crmCallLogFilterPrimary">
            <div className="crmSegmented crmCallLogDirectionFilter" role="group" aria-label="Text direction">
              {DIRECTION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`crmSegment ${direction === option.value ? "crmSegmentActive" : ""}`}
                  aria-pressed={direction === option.value}
                  onClick={() => setDirection(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <label className="crmCallLogSelectField">
              <span className="crmCallLogDateLabel">CRM user</span>
              <select
                className="crmCallLogSelect"
                value={crmUserFilter}
                disabled={!rangeReady}
                aria-label="Filter by CRM user"
                onChange={(event) => setCrmUserFilter(event.target.value)}
              >
                {crmUserFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="crmCallLogSelectField">
              <span className="crmCallLogDateLabel">Sort</span>
              <select
                className="crmCallLogSelect"
                value={sortKey}
                disabled={!rangeReady}
                aria-label="Sort texts"
                onChange={(event) => setSortKey(event.target.value as CrmTextLogSortKey)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="crmCallLogDateRange" role="group" aria-label="Text dates">
            <label className="crmCallLogDateField">
              <span className="crmCallLogDateLabel">From</span>
              <input
                type="date"
                className="crmCallLogDateInput"
                value={dateFrom}
                max={dateTo || undefined}
                disabled={!rangeReady}
                onChange={(event) => onFromChange(event.target.value)}
              />
            </label>
            <label className="crmCallLogDateField">
              <span className="crmCallLogDateLabel">To</span>
              <input
                type="date"
                className="crmCallLogDateInput"
                value={dateTo}
                min={dateFrom || undefined}
                disabled={!rangeReady}
                onChange={(event) => onToChange(event.target.value)}
              />
            </label>
          </div>
        </div>
      </header>

      {banner ? (
        <p className="crmBanner crmCallLogBanner" role="alert">
          {banner}
        </p>
      ) : null}

      <div className="crmCallLogBody">
        {!rangeReady || loading ? (
          <p className="crmCallLogEmpty">{rangeReady ? "Loading text history…" : "Loading date range…"}</p>
        ) : displayedEntries.length === 0 ? (
          <p className="crmCallLogEmpty">No texts match the selected filters.</p>
        ) : (
          <ul className="crmCallLogList">
            {displayedEntries.map((entry) => {
              const isSelected = selectedActivityId === entry.id;
              const customerParty = textLogCustomerParty(entry);
              const agentParty = textLogAgentParty(entry);
              const direction = entry.sms_direction;
              const preview = truncateTextPreview(entry.body);

              return (
                <li key={entry.id} className={`crmCallLogItem${isSelected ? " crmCallLogItemSelected" : ""}`}>
                  <button type="button" className="crmCallLogItemBtn" onClick={() => onSelectEntry(entry.id)}>
                    <span className="crmCallLogItemBadgeCol">
                      <span className="crmCallLogItemBadgeRow">
                        {direction ? (
                          <span className={`crmCallLogDirPill crmCallLogDirPill--${direction}`}>
                            {direction === "inbound" ? "Inbound" : "Outbound"}
                          </span>
                        ) : null}
                      </span>
                      <span className="crmCallLogItemBadgeRow">
                        <span className={smsStatusBadgeClass(direction, entry.sms_status)}>
                          {smsStatusBadgeLabel(direction, entry.sms_status)}
                        </span>
                      </span>
                    </span>

                    <span className="crmCallLogItemContent">
                      <span className="crmCallLogItemPrimaryRow">
                        {customerParty ? (
                          <CallLogPhonePartyLabel
                            party={customerParty}
                            onOpenCustomer={onOpenCustomer}
                            className="crmCallLogItemCustomerName"
                          />
                        ) : (
                          <span className="crmCallLogItemCustomerName crmCallLogItemCustomerNameMuted">
                            {entry.customer_display_name?.trim() || "No name text"}
                          </span>
                        )}
                        <span className="crmCallLogItemWhen">
                          <span className="crmCallLogItemTime">{formatTextLogTime(entry.created_at)}</span>
                          <span className="crmCallLogItemDate">{formatTextLogWrittenDate(entry.created_at)}</span>
                        </span>
                      </span>

                      <span className="crmCallLogItemSecondaryRow">
                        {agentParty ? <span className="crmCallLogItemAgent">{agentParty.label}</span> : null}
                        {preview ? <span className="crmCallLogTextPreview">{preview}</span> : null}
                      </span>
                    </span>

                    <span className="crmCallLogItemExpandIcon" aria-hidden="true" />
                  </button>

                  {isSelected ? (
                    <div className="crmCallLogItemDetail">
                      <p className="crmCallLogItemSummary crmCallLogItemMessage">{entry.body}</p>
                      {entry.sms_from || entry.sms_to ? (
                        <p className="crmCallLogItemPhones">
                          {entry.sms_from ? (
                            <CallLogPhoneLine
                              prefix="From"
                              phone={entry.sms_from}
                              party={entry.sms_from_party}
                              onOpenCustomer={onOpenCustomer}
                            />
                          ) : null}
                          {entry.sms_from && entry.sms_to ? " · " : null}
                          {entry.sms_to ? (
                            <CallLogPhoneLine
                              prefix="To"
                              phone={entry.sms_to}
                              party={entry.sms_to_party}
                              onOpenCustomer={onOpenCustomer}
                            />
                          ) : null}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
