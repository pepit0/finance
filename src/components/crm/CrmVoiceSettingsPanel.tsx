import { FormEvent, useEffect, useState } from "react";

import { fetchCrmOrgVoiceSettings, updateCrmOrgVoiceSettings } from "../../lib/crmApi";

import { useCrmPermissionsContext } from "../../context/CrmPermissionsContext";

import { formatPhoneDisplay } from "../../utils/phoneFormat";

import {
  crmBannerClassName,
  crmErrorBanner,
  crmSuccessBanner,
  type CrmBannerState
} from "../../utils/crmBanner";

import { CrmCallLogPanel } from "./CrmCallLogPanel";
import { CrmTextLogPanel } from "./CrmTextLogPanel";

type CrmVoiceSettingsPanelProps = {
  visible: boolean;
  onOpenCustomer?: (customerId: string) => void;
};

export function CrmVoiceSettingsPanel({ visible, onOpenCustomer }: CrmVoiceSettingsPanelProps) {
  const permissions = useCrmPermissionsContext();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<CrmBannerState | null>(null);
  const [fallbackPhone, setFallbackPhone] = useState("");
  const [disclosureEnabled, setDisclosureEnabled] = useState(true);
  const [disclosureText, setDisclosureText] = useState(
    "This call may be recorded for quality and training purposes."
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    setLoading(true);
    setBanner(null);

    void fetchCrmOrgVoiceSettings().then((result) => {
      setLoading(false);

      if (result.error) {
        setBanner(crmErrorBanner(result.error));
        return;
      }

      setFallbackPhone(
        result.inboundFallbackCallbackPhone ? formatPhoneDisplay(result.inboundFallbackCallbackPhone) : ""
      );
      setDisclosureEnabled(result.recordingDisclosureEnabled);
      setDisclosureText(result.recordingDisclosureText);
    });
  }, [visible]);

  const onSave = async (event: FormEvent) => {
    event.preventDefault();

    setSaving(true);
    setBanner(null);

    const { error } = await updateCrmOrgVoiceSettings({
      inboundFallbackCallbackPhone: fallbackPhone,
      recordingDisclosureEnabled: disclosureEnabled,
      recordingDisclosureText: disclosureText
    });

    setSaving(false);

    if (error) {
      setBanner(crmErrorBanner(error));
      return;
    }

    setBanner(crmSuccessBanner("Call & text settings saved."));
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="crmCallManager">
      <details className="crmCallManagerSettings">
        <summary className="crmCallManagerSettingsSummary">
          <span className="crmCallManagerSettingsSummaryText">
            <span className="crmCallManagerSettingsSummaryTitle">Routing &amp; recording</span>
            <span className="crmCallManagerSettingsSummaryHint">
              Inbound fallback phone, recording disclosure, and disclosure message for bridged calls
            </span>
          </span>
          <span className="crmCallManagerSettingsChevron" aria-hidden="true" />
        </summary>

        <div className="crmCallManagerSettingsBody">
          {banner ? (
            <p className={crmBannerClassName(banner.tone)} role={banner.tone === "success" ? "status" : "alert"}>
              {banner.message}
            </p>
          ) : null}

          {loading ? (
            <p className="crmMuted crmCallManagerSettingsLoading">Loading settings…</p>
          ) : (
            <form className="crmCallManagerSettingsForm" onSubmit={(event) => void onSave(event)}>
              <div className="crmCallManagerSettingsGrid">
                <label className="crmField crmCallManagerSettingsField">
                  <span className="crmFieldLabel">Inbound fallback phone</span>
                  <p className="crmMuted crmCallManagerFieldHint">
                    Twilio rings this number when an inbound caller can&apos;t go to a customer&apos;s assigned
                    agent—for example, the customer is unassigned, the agent has no Phone for calls on Team, or
                    the number isn&apos;t in CRM yet.
                  </p>
                  <input
                    type="tel"
                    className="loginInput"
                    value={fallbackPhone}
                    onChange={(event) => setFallbackPhone(event.target.value)}
                    placeholder="(555) 555-5555"
                    autoComplete="tel"
                  />
                </label>

                <label className="crmCheckboxRow crmCallManagerSettingsCheckbox">
                  <input
                    type="checkbox"
                    checked={disclosureEnabled}
                    onChange={(event) => setDisclosureEnabled(event.target.checked)}
                  />
                  <span>Play recording disclosure on bridged calls</span>
                </label>

                <label className="crmField crmCallManagerSettingsField crmCallManagerSettingsFieldWide">
                  <span className="crmFieldLabel">Disclosure message</span>
                  <textarea
                    className="crmTextarea crmCallManagerSettingsTextarea"
                    rows={2}
                    value={disclosureText}
                    disabled={!disclosureEnabled}
                    onChange={(event) => setDisclosureText(event.target.value)}
                  />
                </label>
              </div>

              <div className="crmCallManagerSettingsActions">
                <button type="submit" className="loginButton crmCallManagerSettingsSave" disabled={saving}>
                  {saving ? "Saving…" : "Save settings"}
                </button>
              </div>
            </form>
          )}
        </div>
      </details>

      <details className="crmCallManagerSettings" open>
        <summary className="crmCallManagerSettingsSummary">
          <span className="crmCallManagerSettingsSummaryText">
            <span className="crmCallManagerSettingsSummaryTitle">Recent calls</span>
            <span className="crmCallManagerSettingsSummaryHint">
              Inbound &amp; outbound call history with recordings
            </span>
          </span>
          <span className="crmCallManagerSettingsChevron" aria-hidden="true" />
        </summary>

        <div className="crmCallManagerSettingsBody crmCallManagerLogBody">
          <CrmCallLogPanel
            visible={visible}
            embedded
            canListen={permissions.hasPermission("calls.listen")}
            onOpenCustomer={onOpenCustomer}
          />
        </div>
      </details>

      <details className="crmCallManagerSettings" open>
        <summary className="crmCallManagerSettingsSummary">
          <span className="crmCallManagerSettingsSummaryText">
            <span className="crmCallManagerSettingsSummaryTitle">Recent texts</span>
            <span className="crmCallManagerSettingsSummaryHint">
              Inbound &amp; outbound SMS message history
            </span>
          </span>
          <span className="crmCallManagerSettingsChevron" aria-hidden="true" />
        </summary>

        <div className="crmCallManagerSettingsBody crmCallManagerLogBody">
          <CrmTextLogPanel visible={visible} embedded onOpenCustomer={onOpenCustomer} />
        </div>
      </details>
    </div>
  );
}
