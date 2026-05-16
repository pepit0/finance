import { useCallback, useEffect, useState } from "react";
import type { CrmPublicPreapprovalLead } from "../../types/crm";
import {
  clearAllPublicPreapprovalLeads,
  deletePublicPreapprovalLead,
  directoryAdminSetupMessage,
  fetchPublicPreapprovalLeads,
  resolveCrmDirectoryAdminStatus
} from "../../lib/crmApi";
import { formatPhoneDisplay } from "../../utils/phoneFormat";

type CrmWebLeadsTabProps = {
  visible: boolean;
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function CrmWebLeadsTab({ visible }: CrmWebLeadsTabProps) {
  const [leads, setLeads] = useState<CrmPublicPreapprovalLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [adminSetupBanner, setAdminSetupBanner] = useState<string | null>(null);
  const [isDirectoryAdmin, setIsDirectoryAdmin] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setBanner(null);
    setSuccessMessage(null);
    const result = await fetchPublicPreapprovalLeads();
    setLoading(false);
    if (result.error) {
      setBanner(result.error);
      setLeads([]);
      return;
    }
    setLeads(result.data);
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }
    let cancelled = false;
    (async () => {
      const status = await resolveCrmDirectoryAdminStatus();
      if (!cancelled) {
        setIsDirectoryAdmin(status.isAdmin);
        setAdminSetupBanner(directoryAdminSetupMessage(status));
      }
    })();
    void loadLeads();
    return () => {
      cancelled = true;
    };
  }, [visible, loadLeads]);

  const onRemoveLead = async (lead: CrmPublicPreapprovalLead) => {
    if (
      !window.confirm(
        `Remove the web pre-approval for ${lead.display_name}? Linked system-lead queue entries for this submission are removed; customer profiles are not deleted.`
      )
    ) {
      return;
    }
    setRemovingId(lead.id);
    setBanner(null);
    const { error } = await deletePublicPreapprovalLead(lead.id);
    setRemovingId(null);
    if (error) {
      setBanner(error);
      return;
    }
    setLeads((prev) => prev.filter((row) => row.id !== lead.id));
  };

  const onClearAll = async () => {
    if (leads.length === 0) {
      return;
    }
    if (
      !window.confirm(
        `Remove all ${leads.length} web pre-approval record(s)? This clears the audit list and linked system-lead rows; customer profiles stay in the CRM.`
      )
    ) {
      return;
    }
    setClearingAll(true);
    setBanner(null);
    const { deleted, error } = await clearAllPublicPreapprovalLeads();
    setClearingAll(false);
    if (error) {
      setBanner(error);
      return;
    }
    setLeads([]);
    if (deleted > 0) {
      setSuccessMessage(`Removed ${deleted} web lead${deleted === 1 ? "" : "s"}.`);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="crmWebLeads">
      <p className="crmPanelIntro">
        Pre-approval form payloads stored on the CRM project (including copies synced from the marketing site). Use{" "}
        <strong>System leads</strong> to assign customers; this tab is an audit trail. Directory admins can remove
        entries here.
      </p>

      {adminSetupBanner ? (
        <p className="crmBanner crmBannerWarn" role="status">
          {adminSetupBanner}
        </p>
      ) : null}

      {successMessage ? (
        <p className="crmMuted" role="status">
          {successMessage}
        </p>
      ) : null}

      {banner ? (
        <p className="crmBanner" role="alert">
          {banner}
        </p>
      ) : null}

      {isDirectoryAdmin && leads.length > 0 ? (
        <div className="crmWebLeadsToolbar">
          <span className="crmMuted">{leads.length} record{leads.length === 1 ? "" : "s"}</span>
          <button
            type="button"
            className="crmButtonDanger crmWebLeadsClearAll"
            disabled={clearingAll || loading}
            onClick={() => void onClearAll()}
          >
            {clearingAll ? "Clearing…" : "Clear all web leads"}
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="crmMuted">Loading…</p>
      ) : leads.length === 0 ? (
        <p className="crmMuted">No web pre-approvals.</p>
      ) : (
        <ul className="crmWebLeadsList">
          {leads.map((lead) => (
            <li key={lead.id}>
              <article className="crmWebLeadCard">
                <header className="crmWebLeadHeader">
                  <time className="crmWebLeadTime" dateTime={lead.created_at}>
                    {formatWhen(lead.created_at)}
                  </time>
                  <span className="crmWebLeadName">{lead.display_name}</span>
                  {isDirectoryAdmin ? (
                    <button
                      type="button"
                      className="crmButtonDanger crmWebLeadRemoveBtn"
                      disabled={removingId === lead.id || clearingAll}
                      onClick={() => void onRemoveLead(lead)}
                    >
                      {removingId === lead.id ? "Removing…" : "Remove"}
                    </button>
                  ) : null}
                </header>
                <dl className="crmWebLeadDl">
                  <div className="crmWebLeadRow">
                    <dt>Email</dt>
                    <dd>{lead.email}</dd>
                  </div>
                  <div className="crmWebLeadRow">
                    <dt>Phone</dt>
                    <dd>{formatPhoneDisplay(lead.phone)}</dd>
                  </div>
                  <div className="crmWebLeadRow">
                    <dt>Date of birth</dt>
                    <dd>{lead.date_of_birth}</dd>
                  </div>
                  <div className="crmWebLeadRow">
                    <dt>Address</dt>
                    <dd>
                      {lead.street}
                      {lead.line2 ? `, ${lead.line2}` : ""}, {lead.city}, {lead.province}
                    </dd>
                  </div>
                  <div className="crmWebLeadRow">
                    <dt>Employer</dt>
                    <dd>{lead.employer}</dd>
                  </div>
                  <div className="crmWebLeadRow">
                    <dt>Gross monthly (CAD)</dt>
                    <dd>
                      {lead.gross_monthly_income_cad.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2
                      })}
                    </dd>
                  </div>
                  {lead.vehicle_interest ? (
                    <div className="crmWebLeadRow crmWebLeadRowBlock">
                      <dt>Vehicle interest</dt>
                      <dd>{lead.vehicle_interest}</dd>
                    </div>
                  ) : null}
                  <div className="crmWebLeadRow crmWebLeadRowMeta">
                    <dt>Consents</dt>
                    <dd>
                      Contact: {lead.consent_contact ? "yes" : "no"} · Credit pull/view:{" "}
                      {lead.consent_credit ? "yes" : "no"}
                    </dd>
                  </div>
                </dl>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
