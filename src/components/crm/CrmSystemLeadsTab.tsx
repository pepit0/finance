import { useCallback, useEffect, useState } from "react";
import type { CrmSystemLeadListRow, CrmUserDirectoryRow } from "../../types/crm";
import {
  assignCrmSystemLead,
  fetchCrmUserDirectory,
  fetchUnassignedSystemLeads,
  markCustomerLost
} from "../../lib/crmApi";
import { directoryPersonLabel } from "../../utils/crmDirectoryAdmin";
import { formatPhoneDisplay } from "../../utils/phoneFormat";

type CrmSystemLeadsTabProps = {
  visible: boolean;
  refreshToken?: number;
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function CrmSystemLeadsTab({ visible, refreshToken = 0 }: CrmSystemLeadsTabProps) {
  const [leads, setLeads] = useState<CrmSystemLeadListRow[]>([]);
  const [directory, setDirectory] = useState<CrmUserDirectoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [movingLostId, setMovingLostId] = useState<string | null>(null);
  const [assigneeByLead, setAssigneeByLead] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setBanner(null);
    const [leadsResult, directoryResult] = await Promise.all([
      fetchUnassignedSystemLeads(),
      fetchCrmUserDirectory()
    ]);
    setLoading(false);
    if (leadsResult.error) {
      setBanner(leadsResult.error);
      setLeads([]);
    } else {
      setLeads(leadsResult.data);
    }
    if (!directoryResult.error) {
      setDirectory(directoryResult.data);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }
    void load();
  }, [visible, load, refreshToken]);

  const onAssign = async (lead: CrmSystemLeadListRow) => {
    const selected = assigneeByLead[lead.id] ?? "";
    if (!selected) {
      setBanner("Choose a team member to assign.");
      return;
    }
    const row = directory.find((d) => d.user_id === selected);
    if (!row) {
      setBanner("Invalid assignee.");
      return;
    }
    setAssigningId(lead.id);
    setBanner(null);
    const result = await assignCrmSystemLead(lead.id, row.user_id, row.email);
    setAssigningId(null);
    if (result.error) {
      setBanner(result.error);
      return;
    }
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
  };

  const onMoveToLost = async (lead: CrmSystemLeadListRow) => {
    const name = lead.customer?.display_name ?? lead.preapproval?.display_name ?? "this applicant";
    if (
      !window.confirm(
        `Move ${name} to Lost customers? They will leave the system leads queue and appear under Customers → Lost.`
      )
    ) {
      return;
    }
    setMovingLostId(lead.id);
    setBanner(null);
    const result = await markCustomerLost(lead.customer_id);
    setMovingLostId(null);
    if (result.error) {
      setBanner(result.error);
      return;
    }
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="crmSystemLeads">
      <p className="crmPanelIntro">
        New credit applications from the marketing site arrive here as <strong>system leads</strong>. Customer
        records are created automatically; assign each lead to a team member to work the deal in{" "}
        <strong>Customers</strong>.
      </p>
      {banner ? (
        <p className="crmBanner" role="alert">
          {banner}
        </p>
      ) : null}
      {loading ? (
        <p className="crmMuted">Loading…</p>
      ) : leads.length === 0 ? (
        <p className="crmMuted">No unassigned system leads.</p>
      ) : (
        <ul className="crmWebLeadsList">
          {leads.map((lead) => {
            const name = lead.customer?.display_name ?? lead.preapproval?.display_name ?? "Applicant";
            const email = lead.customer?.email ?? lead.preapproval?.email ?? "";
            const phone = lead.customer?.phone ?? lead.preapproval?.phone ?? "";
            return (
              <li key={lead.id}>
                <article className="crmWebLeadCard crmSystemLeadCard">
                  <header className="crmWebLeadHeader">
                    <time className="crmWebLeadTime" dateTime={lead.created_at}>
                      {formatWhen(lead.created_at)}
                    </time>
                    <span className="crmWebLeadName">{name}</span>
                  </header>
                  <dl className="crmWebLeadDl">
                    <div className="crmWebLeadRow">
                      <dt>Email</dt>
                      <dd>{email}</dd>
                    </div>
                    <div className="crmWebLeadRow">
                      <dt>Phone</dt>
                      <dd>{formatPhoneDisplay(phone)}</dd>
                    </div>
                    {lead.preapproval?.vehicle_interest ? (
                      <div className="crmWebLeadRow">
                        <dt>Vehicle</dt>
                        <dd>{lead.preapproval.vehicle_interest}</dd>
                      </div>
                    ) : null}
                    {lead.preapproval?.employer ? (
                      <div className="crmWebLeadRow">
                        <dt>Employer</dt>
                        <dd>{lead.preapproval.employer}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <div className="crmSystemLeadAssign">
                    <label className="crmSystemLeadAssignLabel" htmlFor={`assign-${lead.id}`}>
                      Assign to
                    </label>
                    <select
                      id={`assign-${lead.id}`}
                      className="crmSystemLeadAssignSelect"
                      value={assigneeByLead[lead.id] ?? ""}
                      onChange={(e) =>
                        setAssigneeByLead((prev) => ({ ...prev, [lead.id]: e.target.value }))
                      }
                    >
                      <option value="">Select team member…</option>
                      {directory.map((d) => (
                        <option key={d.user_id} value={d.user_id}>
                          {directoryPersonLabel(d)}
                        </option>
                      ))}
                    </select>
                    <div className="crmSystemLeadAssignActions">
                      <button
                        type="button"
                        className="newCustomerBtn crmSystemLeadAssignBtn"
                        disabled={assigningId === lead.id || movingLostId === lead.id}
                        onClick={() => void onAssign(lead)}
                      >
                        {assigningId === lead.id ? "Assigning…" : "Assign"}
                      </button>
                      <button
                        type="button"
                        className="newCustomerBtn crmSystemLeadLostBtn"
                        disabled={assigningId === lead.id || movingLostId === lead.id}
                        onClick={() => void onMoveToLost(lead)}
                      >
                        {movingLostId === lead.id ? "Moving…" : "Lost"}
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

