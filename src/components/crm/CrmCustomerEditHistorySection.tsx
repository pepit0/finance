import { useCallback, useEffect, useState } from "react";
import type { CrmCustomerEditHistoryRow, CrmUserDirectoryRow } from "../../types/crm";
import { fetchCustomerEditHistory } from "../../lib/crmApi";
import { directoryPersonLabel, directoryUsername } from "../../utils/crmDirectoryAdmin";
import { sourceLabel } from "../../utils/customerEditHistory";

type CrmCustomerEditHistorySectionProps = {
  customerId: string | null;
  directory: CrmUserDirectoryRow[];
  refreshToken?: number;
  onBanner: (message: string | null) => void;
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

function authorLabel(row: CrmCustomerEditHistoryRow, directory: CrmUserDirectoryRow[]): string {
  if (row.author_id) {
    const match = directory.find((entry) => entry.user_id === row.author_id);
    if (match) {
      return directoryUsername(match) ?? directoryPersonLabel(match);
    }
  }
  return row.author_email?.trim() || "Unknown";
}

export function CrmCustomerEditHistorySection({
  customerId,
  directory,
  refreshToken = 0,
  onBanner
}: CrmCustomerEditHistorySectionProps) {
  const [rows, setRows] = useState<CrmCustomerEditHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!customerId) {
      setRows([]);
      return;
    }
    setLoading(true);
    const { data, error } = await fetchCustomerEditHistory(customerId, 25);
    setLoading(false);
    if (error) {
      onBanner(error);
      setRows([]);
      return;
    }
    setRows(data);
  }, [customerId, onBanner]);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  if (!customerId) {
    return null;
  }

  const countLabel = loading ? "…" : String(rows.length);

  return (
    <details key={customerId} className="crmEditHistorySection">
      <summary className="crmEditHistorySummaryBar">
        <span className="crmEditHistorySummaryTitle">Edit history</span>
        <span className="crmEditHistorySummaryCount">{countLabel}</span>
      </summary>
      <div className="crmEditHistoryBody">
        {loading ? (
          <p className="crmMuted crmEditHistoryEmpty">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="crmMuted crmEditHistoryEmpty">No tracked edits yet.</p>
        ) : (
          <ul className="crmEditHistoryList">
            {rows.map((row) => (
              <li key={row.id} className="crmEditHistoryItem">
                <details className="crmEditHistoryItemDetails">
                  <summary className="crmEditHistoryItemSummary">
                    <span className="crmBadge crmBadgeEditHistory">{sourceLabel(row.source)}</span>
                    <span className="crmEditHistoryItemMeta">
                      {authorLabel(row, directory)} · {formatWhen(row.created_at)}
                    </span>
                    <span className="crmEditHistoryItemPreview">{row.summary}</span>
                  </summary>
                  {row.changes.length > 0 ? (
                    <ul className="crmEditHistoryChanges">
                      {row.changes.map((change) => (
                        <li key={`${row.id}-${change.field}`}>
                          <span className="crmEditHistoryChangeLabel">{change.label}:</span>{" "}
                          <span className="crmEditHistoryChangeOld">{change.old}</span>
                          <span className="crmEditHistoryChangeArrow" aria-hidden="true">
                            {" "}
                            →{" "}
                          </span>
                          <span className="crmEditHistoryChangeNew">{change.new}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </details>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
