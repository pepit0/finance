import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { countCustomersOnPipelineStage, fetchCrmOrgPipelineCallSettings, updateCrmOrgPipelineCallSettings } from "../../lib/crmApi";
import type { CrmPipelineStageConfig } from "../../types/crm";
import { normalizeHexColor } from "../../utils/crmThemeColor";
import { pipelineStageBadgeStyle } from "../../utils/pipelineStage";
import { useCrmPipelineStagesContext } from "../../context/CrmPipelineStagesContext";
import {
  crmBannerClassName,
  crmErrorBanner,
  crmSuccessBanner,
  type CrmBannerState
} from "../../utils/crmBanner";

type CrmPipelineSettingsPanelProps = {
  disabled?: boolean;
};

function PipelineStageColorPicker({
  value,
  disabled,
  label,
  onChange
}: {
  value: string;
  disabled?: boolean;
  label: string;
  onChange: (color: string) => void;
}) {
  const hex = normalizeHexColor(value) ?? value;

  return (
    <label
      className="crmPipelineSettingsColorField"
      style={{ ["--crm-pipeline-picker-color" as string]: hex }}
      title={label}
    >
      <span className="crmPipelineSettingsColorSwatch" aria-hidden="true" />
      <span className="crmVisuallyHidden">{label}</span>
      <input
        type="color"
        className="crmPipelineSettingsColorInput"
        value={hex}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function OutboundPipelineStagePicker({
  value,
  stages,
  disabled,
  onChange
}: {
  value: string;
  stages: CrmPipelineStageConfig[];
  disabled: boolean;
  onChange: (slug: string) => void;
}) {
  const pipeline = useCrmPipelineStagesContext();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = stages.find((stage) => stage.slug === value) ?? null;

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDocDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  return (
    <div className="crmField crmPipelineOutboundStageField">
      <span className="crmFieldLabel">Pipeline stage</span>
      <div className="crmPipelineStagePicker crmPipelineOutboundStagePicker" ref={wrapRef}>
        <button
          type="button"
          className={`crmPipelineOutboundStageTrigger${selected ? "" : " crmPipelineOutboundStageTriggerEmpty"}`}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={selected ? `Pipeline stage: ${selected.label}. Click to change.` : "Choose pipeline stage"}
          onClick={() => {
            if (!disabled) {
              setOpen((current) => !current);
            }
          }}
        >
          {selected ? (
            <span
              className="crmPipelineBadge crmPipelineBadgeThemed crmPipelineOutboundStageBadge"
              style={pipeline.badgeStyle(selected.slug)}
            >
              {selected.label}
            </span>
          ) : (
            <span className="crmPipelineOutboundStagePlaceholder">Choose stage…</span>
          )}
          <span className="crmPipelineBadgeChevron" aria-hidden="true">
            ▾
          </span>
        </button>
        {open && !disabled ? (
          <div className="crmPipelineStageMenu" role="listbox" aria-label="Choose pipeline stage">
            <p className="crmPipelineStageMenuHint">Pipeline stage</p>
            <div className="crmPipelineStageMenuGrid">
              {stages.map((stage) => (
                <button
                  key={stage.slug}
                  type="button"
                  role="option"
                  aria-selected={stage.slug === value}
                  className={`crmPipelineStageOption crmPipelineBadgeThemed${
                    stage.slug === value ? " crmPipelineStageOptionActive" : ""
                  }`}
                  style={pipeline.badgeStyle(stage.slug)}
                  onClick={() => {
                    onChange(stage.slug);
                    setOpen(false);
                  }}
                >
                  {stage.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PipelineStageRow({
  stage,
  index,
  total,
  reassignOptions,
  disabled,
  onMove,
  onSaveLabel,
  onSaveColor,
  onToggleCreditApp,
  onDelete
}: {
  stage: CrmPipelineStageConfig;
  index: number;
  total: number;
  reassignOptions: CrmPipelineStageConfig[];
  disabled: boolean;
  onMove: (direction: "up" | "down") => Promise<boolean>;
  onSaveLabel: (label: string) => Promise<boolean>;
  onSaveColor: (color: string) => Promise<boolean>;
  onToggleCreditApp: (value: boolean) => Promise<boolean>;
  onDelete: (reassignToSlug?: string) => Promise<boolean>;
}) {
  const [labelDraft, setLabelDraft] = useState(stage.label);
  const [colorDraft, setColorDraft] = useState(stage.color);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reassignSlug, setReassignSlug] = useState("");
  const [customerCount, setCustomerCount] = useState<number | null>(null);

  useEffect(() => {
    setLabelDraft(stage.label);
    setColorDraft(stage.color);
  }, [stage.label, stage.color, stage.slug]);

  const badgeStyle = pipelineStageBadgeStyle(colorDraft);

  const saveLabel = async () => {
    if (labelDraft.trim() === stage.label) {
      return;
    }
    const ok = await onSaveLabel(labelDraft);
    if (!ok) {
      setLabelDraft(stage.label);
    }
  };

  const saveColor = async (nextColor: string) => {
    setColorDraft(nextColor);
    const normalized = normalizeHexColor(nextColor);
    if (!normalized || normalized === stage.color) {
      return;
    }
    const ok = await onSaveColor(normalized);
    if (!ok) {
      setColorDraft(stage.color);
    }
  };

  const openDelete = async () => {
    const result = await countCustomersOnPipelineStage(stage.slug);
    const count = result.error ? 0 : result.count;

    if (count > 0) {
      setCustomerCount(count);
      setDeleteOpen(true);
      return;
    }

    if (!window.confirm(`Delete “${stage.label}”?`)) {
      return;
    }

    await onDelete(undefined);
  };

  const confirmDelete = async () => {
    const ok = await onDelete(customerCount && customerCount > 0 ? reassignSlug : undefined);
    if (ok) {
      setDeleteOpen(false);
      setReassignSlug("");
      setCustomerCount(null);
    }
  };

  const isLost = stage.slug === "lost";
  const isFreshLead = stage.slug === "fresh_lead";
  const deleteTargets = reassignOptions.filter((option) => option.slug !== stage.slug);

  return (
    <div className="crmPipelineSettingsRow">
      <div className="crmPipelineSettingsOrder">
        <button
          type="button"
          className="crmPipelineSettingsOrderBtn"
          disabled={disabled || index === 0 || isLost}
          aria-label={`Move ${stage.label} up`}
          onClick={() => void onMove("up")}
        >
          ↑
        </button>
        <button
          type="button"
          className="crmPipelineSettingsOrderBtn"
          disabled={disabled || index >= total - 1 || isLost}
          aria-label={`Move ${stage.label} down`}
          onClick={() => void onMove("down")}
        >
          ↓
        </button>
      </div>

      <PipelineStageColorPicker
        value={colorDraft}
        disabled={disabled}
        label={`Color for ${stage.label}`}
        onChange={(color) => void saveColor(color)}
      />

      <span className="crmPipelineBadge crmPipelineBadgeThemed" style={badgeStyle}>
        {labelDraft || stage.label}
      </span>

      <input
        type="text"
        className="crmInput crmPipelineSettingsLabelInput"
        value={labelDraft}
        disabled={disabled || isLost}
        aria-label={`Label for ${stage.label}`}
        onChange={(event) => setLabelDraft(event.target.value)}
        onBlur={() => void saveLabel()}
      />

      {!isLost ? (
        <label className="crmPipelineSettingsCreditCheck">
          <input
            type="checkbox"
            checked={stage.requires_credit_app}
            disabled={disabled}
            onChange={(event) => void onToggleCreditApp(event.target.checked)}
          />
          <span>Requires credit app</span>
        </label>
      ) : (
        <span className="crmMuted crmPipelineSettingsSystemNote">System stage</span>
      )}

      {!stage.is_system ? (
        !deleteOpen ? (
          <button
            type="button"
            className="crmDangerButton crmPipelineSettingsDeleteBtn"
            disabled={disabled}
            onClick={() => void openDelete()}
          >
            Delete
          </button>
        ) : null
      ) : isFreshLead ? (
        <span className="crmMuted crmPipelineSettingsSystemNote crmPipelineSettingsDefaultStageNote">
          Default
          <br />
          stage
        </span>
      ) : (
        <span className="crmMuted crmPipelineSettingsSystemNote">Built-in</span>
      )}

      {deleteOpen ? (
        <div className="crmPipelineSettingsDeleteDialog" role="dialog" aria-label={`Delete ${stage.label}`}>
          <p className="crmPipelineSettingsDeleteCopy">
            {customerCount && customerCount > 0
              ? `${customerCount} customer${customerCount === 1 ? "" : "s"} use this stage. Move them to:`
              : `Delete “${stage.label}”?`}
          </p>
          {customerCount && customerCount > 0 ? (
            <select
              className="crmSelect"
              value={reassignSlug}
              disabled={disabled}
              onChange={(event) => setReassignSlug(event.target.value)}
            >
              <option value="">Choose stage…</option>
              {deleteTargets.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
          <div className="crmPipelineSettingsDeleteActions">
            <button type="button" className="crmModalButtonSecondary" disabled={disabled} onClick={() => setDeleteOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="crmDangerButton crmPipelineSettingsDeleteConfirm"
              disabled={disabled || (Boolean(customerCount && customerCount > 0) && !reassignSlug)}
              onClick={() => void confirmDelete()}
            >
              Delete
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CrmPipelineSettingsPanel({ disabled = false }: CrmPipelineSettingsPanelProps) {
  const pipeline = useCrmPipelineStagesContext();
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#2563eb");
  const [callSettingsLoading, setCallSettingsLoading] = useState(true);
  const [callSettingsSaving, setCallSettingsSaving] = useState(false);
  const [callSettingsBanner, setCallSettingsBanner] = useState<CrmBannerState | null>(null);
  const [autoStageEnabled, setAutoStageEnabled] = useState(false);
  const [autoStageSlug, setAutoStageSlug] = useState("");

  const editableStages = useMemo(() => {
    const lostStage = pipeline.stages.find((stage) => stage.slug === "lost");
    return lostStage ? [...pipeline.selectableStages, lostStage] : pipeline.selectableStages;
  }, [pipeline.selectableStages, pipeline.stages]);

  const controlsDisabled = disabled || pipeline.loading || pipeline.saving;

  useEffect(() => {
    setCallSettingsLoading(true);
    setCallSettingsBanner(null);
    void fetchCrmOrgPipelineCallSettings().then((result) => {
      setCallSettingsLoading(false);
      if (result.error) {
        setCallSettingsBanner(crmErrorBanner(result.error));
        return;
      }
      setAutoStageEnabled(result.outboundCallPipelineStageEnabled);
      setAutoStageSlug(result.outboundCallPipelineStage ?? "");
    });
  }, []);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await pipeline.createStage(newLabel, newColor);
    if (ok) {
      setNewLabel("");
      setNewColor("#2563eb");
    }
  };

  const onSaveCallSettings = async (event: FormEvent) => {
    event.preventDefault();
    setCallSettingsSaving(true);
    setCallSettingsBanner(null);
    const { error } = await updateCrmOrgPipelineCallSettings({
      outboundCallPipelineStageEnabled: autoStageEnabled,
      outboundCallPipelineStage: autoStageSlug || null
    });
    setCallSettingsSaving(false);
    if (error) {
      setCallSettingsBanner(crmErrorBanner(error));
      return;
    }
    setCallSettingsBanner(crmSuccessBanner("Outbound call settings saved."));
  };

  return (
    <section className="crmCard crmPipelineSettingsCard" aria-labelledby="crm-pipeline-settings-heading">
      <h2 id="crm-pipeline-settings-heading" className="crmCardTitle">
        Pipeline stages
      </h2>
      <p className="crmMuted crmPipelineSettingsIntro">
        Customize stage names, badge colors, and priority order for the whole team. “Lost” stays automatic when a
        customer is marked lost.
      </p>

      {pipeline.error ? (
        <p className="crmBanner" role="alert">
          {pipeline.error}
        </p>
      ) : null}

      <div className="crmPipelineSettingsList">
        {editableStages.map((stage, index) => (
          <PipelineStageRow
            key={stage.slug}
            stage={stage}
            index={stage.slug === "lost" ? pipeline.selectableStages.length : index}
            total={pipeline.selectableStages.length}
            reassignOptions={pipeline.selectableStages}
            disabled={controlsDisabled}
            onMove={(direction) => pipeline.moveStage(stage.slug, direction)}
            onSaveLabel={(label) => pipeline.updateStageLabel(stage.slug, label)}
            onSaveColor={(color) => pipeline.updateStageColor(stage.slug, color)}
            onToggleCreditApp={(value) => pipeline.updateStageRequiresCreditApp(stage.slug, value)}
            onDelete={(reassignToSlug) => pipeline.deleteStage(stage.slug, reassignToSlug)}
          />
        ))}
      </div>

      <form className="crmPipelineSettingsCreate" onSubmit={(event) => void onCreate(event)}>
        <h3 className="crmPipelineSettingsCreateTitle">Add stage</h3>
        <div className="crmPipelineSettingsCreateFields">
          <PipelineStageColorPicker
            value={newColor}
            disabled={controlsDisabled}
            label="New stage color"
            onChange={setNewColor}
          />
          <input
            type="text"
            className="crmInput"
            placeholder="Stage name"
            value={newLabel}
            disabled={controlsDisabled}
            onChange={(event) => setNewLabel(event.target.value)}
          />
          <button type="submit" className="topBarSheetButton" disabled={controlsDisabled || !newLabel.trim()}>
            Add stage
          </button>
        </div>
      </form>

      <form className="crmPipelineSettingsOutboundCalls" onSubmit={(event) => void onSaveCallSettings(event)}>
        <h3 className="crmPipelineSettingsCreateTitle">Outbound calls</h3>
        <p className="crmMuted crmPipelineSettingsOutboundIntro">
          When a CRM user clicks Call on a customer, automatically move that customer to the selected pipeline stage
          only if their current stage is lower in the pipeline list (never downgrades a further-along stage).
        </p>

        {callSettingsBanner ? (
          <p
            className={crmBannerClassName(callSettingsBanner.tone)}
            role={callSettingsBanner.tone === "success" ? "status" : "alert"}
          >
            {callSettingsBanner.message}
          </p>
        ) : null}

        {callSettingsLoading ? (
          <p className="crmMuted">Loading outbound call settings…</p>
        ) : (
          <>
            <label className="crmCheckboxRow">
              <input
                type="checkbox"
                checked={autoStageEnabled}
                disabled={controlsDisabled || callSettingsSaving}
                onChange={(event) => setAutoStageEnabled(event.target.checked)}
              />
              <span>Automatically assign a pipeline stage on outbound call</span>
            </label>

            <OutboundPipelineStagePicker
              value={autoStageSlug}
              stages={pipeline.selectableStages}
              disabled={controlsDisabled || callSettingsSaving || !autoStageEnabled}
              onChange={setAutoStageSlug}
            />

            <div className="crmPipelineSettingsOutboundActions">
              <button
                type="submit"
                className="topBarSheetButton"
                disabled={controlsDisabled || callSettingsSaving || (autoStageEnabled && !autoStageSlug)}
              >
                {callSettingsSaving ? "Saving…" : "Save outbound call settings"}
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  );
}
