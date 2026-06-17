import { FormEvent, useEffect, useMemo, useState } from "react";
import { countCustomersOnPipelineStage } from "../../lib/crmApi";
import type { CrmPipelineStageConfig } from "../../types/crm";
import { normalizeHexColor } from "../../utils/crmThemeColor";
import { pipelineStageBadgeStyle } from "../../utils/pipelineStage";
import { useCrmPipelineStagesContext } from "../../context/CrmPipelineStagesContext";

type CrmPipelineSettingsPanelProps = {
  disabled?: boolean;
};

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
    setDeleteOpen(true);
    const result = await countCustomersOnPipelineStage(stage.slug);
    setCustomerCount(result.error ? 0 : result.count);
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

      <label className="crmPipelineSettingsColorField">
        <span className="crmVisuallyHidden">Color for {stage.label}</span>
        <input
          type="color"
          value={normalizeHexColor(colorDraft) ?? stage.color}
          disabled={disabled}
          onChange={(event) => void saveColor(event.target.value)}
        />
      </label>

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
        <button
          type="button"
          className="topBarSheetButton crmPipelineSettingsDeleteBtn"
          disabled={disabled}
          onClick={() => void openDelete()}
        >
          Delete
        </button>
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
            <button type="button" className="topBarSheetButton" disabled={disabled} onClick={() => setDeleteOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="topBarSheetButton crmPipelineSettingsDeleteConfirm"
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

  const editableStages = useMemo(() => {
    const lostStage = pipeline.stages.find((stage) => stage.slug === "lost");
    return lostStage ? [...pipeline.selectableStages, lostStage] : pipeline.selectableStages;
  }, [pipeline.selectableStages, pipeline.stages]);

  const controlsDisabled = disabled || pipeline.loading || pipeline.saving;

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await pipeline.createStage(newLabel, newColor);
    if (ok) {
      setNewLabel("");
      setNewColor("#2563eb");
    }
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
          <label className="crmPipelineSettingsColorField">
            <span className="crmVisuallyHidden">New stage color</span>
            <input
              type="color"
              value={newColor}
              disabled={controlsDisabled}
              onChange={(event) => setNewColor(event.target.value)}
            />
          </label>
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
    </section>
  );
}
