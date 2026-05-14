import { useEffect, useState } from "react";
import { fetchCrmCounts } from "../../lib/crmApi";

type CrmOverviewTabProps = {
  visible: boolean;
};

export function CrmOverviewTab({ visible }: CrmOverviewTabProps) {
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [activityCount, setActivityCount] = useState<number | null>(null);
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
        setActivityCount(null);
        return;
      }
      setCustomerCount(result.customerCount);
      setActivityCount(result.activityCount);
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

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
      <div className="crmStatGrid">
        <div className="crmStatCard">
          <p className="crmStatLabel">Customers</p>
          <p className="crmStatValue">{loading ? "…" : customerCount ?? "—"}</p>
        </div>
        <div className="crmStatCard">
          <p className="crmStatLabel">Calls, comments &amp; texts</p>
          <p className="crmStatValue">{loading ? "…" : activityCount ?? "—"}</p>
        </div>
      </div>
      <p className="crmPanelIntro">
        Open the <strong>Customers</strong> tab to add people and log calls, comments, or texts. Counts refresh when you
        switch back here.
      </p>
    </div>
  );
}
