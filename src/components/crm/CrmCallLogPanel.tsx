import { useCallback, useEffect, useMemo, useState } from "react";

import type { CrmCallLogDirectionFilter, CrmCallLogEntry, CrmCallLogPhoneParty, CrmCallLogSortKey, CrmUserDirectoryRow } from "../../types/crm";

import {
  crmTodoLocalDate,
  fetchCallLog,
  fetchCrmOriginLocalDate,
  fetchCrmUserDirectory,
  normalizeCrmDateRange
} from "../../lib/crmApi";
import { directoryPersonLabel } from "../../utils/crmDirectoryAdmin";
import { describeCallOutcome } from "../../utils/crmCallOutcome";
import { formatPhoneDisplay } from "../../utils/phoneFormat";
import { supabase } from "../../lib/supabase";

import { CrmCallRecordingPlayer } from "./CrmCallRecordingPlayer";



type CrmCallLogPanelProps = {

  visible: boolean;

  canListen: boolean;

  embedded?: boolean;

  onOpenCustomer?: (customerId: string) => void;

};



const DIRECTION_OPTIONS: { value: CrmCallLogDirectionFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "inbound", label: "Inbound" },
  { value: "outbound", label: "Outbound" }
];

const SORT_OPTIONS: { value: CrmCallLogSortKey; label: string }[] = [
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

function filterCallLogByCrmUser(
  entries: CrmCallLogEntry[],
  filter: string,
  meId: string | null
): CrmCallLogEntry[] {
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

function sortCallLogEntries(entries: CrmCallLogEntry[], sortKey: CrmCallLogSortKey): CrmCallLogEntry[] {
  if (sortKey === "newest") {
    return entries;
  }
  return [...entries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}



function formatCallLogTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { timeStyle: "short" });
}

function CallLogOutcomeBlock({ entry }: { entry: CrmCallLogEntry }) {
  const outcome = describeCallOutcome(entry);
  if (!outcome) {
    return null;
  }

  return (
    <div className="crmCallLogOutcome">
      <p className="crmCallLogOutcomeHeadline">{outcome.headline}</p>
      {outcome.details.length > 0 ? (
        <dl className="crmCallLogOutcomeDetails">
          {outcome.details.map((detail) => (
            <div key={detail.label} className="crmCallLogOutcomeDetailRow">
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

function formatCallLogWrittenDate(iso: string) {
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



function formatCallDuration(seconds: number | null) {

  if (seconds == null || seconds <= 0) {

    return null;

  }

  const minutes = Math.floor(seconds / 60);

  const remainder = seconds % 60;

  if (minutes <= 0) {

    return `${remainder}s`;

  }

  return `${minutes}m ${String(remainder).padStart(2, "0")}s`;

}



function callLogCustomerParty(entry: CrmCallLogEntry): CrmCallLogPhoneParty | null {

  const from = entry.call_from_party;

  const to = entry.call_to_party;

  if (entry.call_direction === "inbound") {

    return from?.kind === "customer" ? from : null;

  }

  if (entry.call_direction === "outbound") {

    return to?.kind === "customer" ? to : null;

  }

  if (from?.kind === "customer") {

    return from;

  }

  return to?.kind === "customer" ? to : null;

}



function callLogAgentParty(entry: CrmCallLogEntry): CrmCallLogPhoneParty | null {

  const from = entry.call_from_party;

  const to = entry.call_to_party;

  if (entry.call_direction === "inbound") {

    return to?.kind === "crm_user" ? to : null;

  }

  if (entry.call_direction === "outbound") {

    return from?.kind === "crm_user" ? from : null;

  }

  if (from?.kind === "crm_user") {

    return from;

  }

  return to?.kind === "crm_user" ? to : null;

}



export function CallLogPhonePartyLabel({

  party,

  onOpenCustomer,

  className

}: {

  party: CrmCallLogPhoneParty;

  onOpenCustomer?: (customerId: string) => void;

  className?: string;

}) {

  if (party.kind === "customer" && party.customer_id && onOpenCustomer) {

    return (

      <button

        type="button"

        className={`crmTodoCustomerLink${className ? ` ${className}` : ""}`}

        onClick={(event) => {

          event.stopPropagation();

          onOpenCustomer(party.customer_id!);

        }}

      >

        {party.label}

      </button>

    );

  }



  return <span className={className ?? "crmCallLogPhoneParty"}>{party.label}</span>;

}



export function CallLogPhoneLine({

  prefix,

  phone,

  party,

  onOpenCustomer

}: {

  prefix: string;

  phone: string;

  party: CrmCallLogPhoneParty | null;

  onOpenCustomer?: (customerId: string) => void;

}) {

  return (

    <>

      {prefix} {formatPhoneDisplay(phone)}

      {party ? (

        <>

          {" ("}

          <CallLogPhonePartyLabel party={party} onOpenCustomer={onOpenCustomer} />

          {")"}

        </>

      ) : null}

    </>

  );

}



export function CrmCallLogPanel({ visible, canListen, embedded = false, onOpenCustomer }: CrmCallLogPanelProps) {

  const [direction, setDirection] = useState<CrmCallLogDirectionFilter>("all");
  const [crmUserFilter, setCrmUserFilter] = useState("all");
  const [sortKey, setSortKey] = useState<CrmCallLogSortKey>("newest");
  const [dateFrom, setDateFrom] = useState(crmTodoLocalDate());
  const [dateTo, setDateTo] = useState(crmTodoLocalDate());
  const [rangeReady, setRangeReady] = useState(false);
  const [entries, setEntries] = useState<CrmCallLogEntry[]>([]);
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
    () => sortCallLogEntries(filterCallLogByCrmUser(entries, crmUserFilter, meId), sortKey),
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

    const result = await fetchCallLog({ range: activeRange, direction });

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
      className={`crmCallLogPanel${embedded ? " crmCallLogPanelEmbedded" : ""}`}
      aria-labelledby={embedded ? undefined : "crm-call-log-heading"}
    >

      <header className="crmCallLogHeader">

        {!embedded ? (
          <div className="crmCallLogHeaderLead">

            <h2 id="crm-call-log-heading" className="crmCallLogTitle">

              Recent calls

            </h2>

            {rangeReady && !loading ? (
              <span className="crmCallLogCount">
                {displayedEntries.length} {displayedEntries.length === 1 ? "call" : "calls"}
              </span>
            ) : null}

          </div>
        ) : null}



        <div className="crmCallLogFilterBar">
          <div className="crmCallLogFilterPrimary">
            <div className="crmSegmented crmCallLogDirectionFilter" role="group" aria-label="Call direction">
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
                aria-label="Sort calls"
                onChange={(event) => setSortKey(event.target.value as CrmCallLogSortKey)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="crmCallLogDateRange" role="group" aria-label="Call dates">

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

          <p className="crmCallLogEmpty">{rangeReady ? "Loading call history…" : "Loading date range…"}</p>

        ) : displayedEntries.length === 0 ? (
          <p className="crmCallLogEmpty">No calls match the selected filters.</p>
        ) : (
          <ul className="crmCallLogList">
            {displayedEntries.map((entry) => {

              const isSelected = selectedActivityId === entry.id;

              const durationLabel = formatCallDuration(entry.call_duration_seconds);

              const customerParty = callLogCustomerParty(entry);

              const agentParty = callLogAgentParty(entry);

              const direction = entry.call_direction;



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
                        {entry.has_recording ? (
                          <span className="crmCallLogRecordingTag">
                            <span className="crmCallLogRecordingDot" aria-hidden="true" />
                            Recording
                          </span>
                        ) : (
                          <span className="crmCallLogNoRecording">No recording</span>
                        )}
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
                            {entry.customer_display_name?.trim() || "No name call"}
                          </span>
                        )}
                        <span className="crmCallLogItemWhen">
                          <span className="crmCallLogItemTime">{formatCallLogTime(entry.created_at)}</span>
                          <span className="crmCallLogItemDate">{formatCallLogWrittenDate(entry.created_at)}</span>
                        </span>
                      </span>

                      <span className="crmCallLogItemSecondaryRow">
                        {agentParty ? (
                          <span className="crmCallLogItemAgent">{agentParty.label}</span>
                        ) : null}
                        {durationLabel ? <span className="crmCallLogDuration">{durationLabel}</span> : null}
                      </span>
                    </span>



                    <span className="crmCallLogItemExpandIcon" aria-hidden="true" />

                  </button>



                  {isSelected ? (

                    <div className="crmCallLogItemDetail">

                      <p className="crmCallLogItemSummary">{entry.body}</p>

                      <CallLogOutcomeBlock entry={entry} />

                      {entry.call_from || entry.call_to ? (

                        <p className="crmCallLogItemPhones">

                          {entry.call_from ? (

                            <CallLogPhoneLine

                              prefix="From"

                              phone={entry.call_from}

                              party={entry.call_from_party}

                              onOpenCustomer={onOpenCustomer}

                            />

                          ) : null}

                          {entry.call_from && entry.call_to ? " · " : null}

                          {entry.call_to ? (

                            <CallLogPhoneLine

                              prefix="To"

                              phone={entry.call_to}

                              party={entry.call_to_party}

                              onOpenCustomer={onOpenCustomer}

                            />

                          ) : null}

                        </p>

                      ) : null}

                      {entry.has_recording ? (

                        <CrmCallRecordingPlayer activityId={entry.id} canListen={canListen} />

                      ) : (

                        <p className="crmActivityRecordingMuted">No recording is available for this call.</p>

                      )}

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


