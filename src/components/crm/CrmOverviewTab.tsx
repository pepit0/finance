import { Fragment, useEffect, useMemo, useState } from "react";
import { fetchCrmCounts } from "../../lib/crmApi";

type CrmOverviewTabProps = {
  visible: boolean;
};

export function CrmOverviewTab({ visible }: CrmOverviewTabProps) {
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [webLeadCount, setWebLeadCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const result = await fetchCrmCounts();
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (result.error) {
        setError(result.error);
        setCustomerCount(null);
        setWebLeadCount(null);
        return;
      }
      setCustomerCount(result.customerCount);
      setWebLeadCount(result.webLeadCount);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const metrics = useMemo(
    () => [
      {
        key: "customers",
        label: "Customers",
        value: loading ? "…" : (customerCount ?? "—")
      },
      {
        key: "webLeads",
        label: "Website pre-approval leads",
        value: loading ? "…" : (webLeadCount ?? "—")
      }
    ],
    [loading, customerCount, webLeadCount]
  );

  if (!visible) {
    return null;
  }

  return (
    <div className="crmOverview">
      {error ? (
        <p className="crmBanner" role="alert">
          {error}
        </p>
      ) : null}
      <section className="crmStatsBoard" aria-label="Statistics">
        {metrics.map((metric, index) => (
          <Fragment key={metric.key}>
            {index > 0 ? <div className="crmStatsBoardDivider" aria-hidden /> : null}
            <div className="crmStatsBoardItem">
              <p className="crmStatLabel">{metric.label}</p>
              <p className="crmStatValue">{metric.value}</p>
            </div>
          </Fragment>
        ))}
      </section>
      <p className="crmPanelIntro">
        Open <strong>System leads</strong> to assign new marketing pre-approvals. Use <strong>Customers</strong> for
        calls, comments, and texts. Counts refresh when you switch back here.
      </p>
    </div>
  );
}
