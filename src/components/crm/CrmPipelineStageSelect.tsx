import { useEffect, useRef, useState } from "react";
import type { CrmCustomer, CrmPipelineStage } from "../../types/crm";
import { updateCustomerPipelineStage } from "../../lib/crmApi";
import { useCrmPipelineStagesContext } from "../../context/CrmPipelineStagesContext";

type CrmPipelineStageSelectProps = {
  customer: CrmCustomer;
  onStageChanged: (customer: CrmCustomer) => void;
  onBanner: (message: string | null) => void;
};

export function CrmPipelineStageSelect({ customer, onStageChanged, onBanner }: CrmPipelineStageSelectProps) {
  const pipeline = useCrmPipelineStagesContext();
  const [stage, setStage] = useState(customer.pipeline_stage);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const readonly = customer.status === "lost";

  useEffect(() => {
    setStage(customer.pipeline_stage);
  }, [customer.id, customer.pipeline_stage]);

  useEffect(() => {
    setOpen(false);
  }, [customer.id]);

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

  const onPick = async (nextStage: CrmPipelineStage) => {
    if (readonly || nextStage === stage || saving) {
      setOpen(false);
      return;
    }
    setSaving(true);
    onBanner(null);
    const { error, missingLabels } = await updateCustomerPipelineStage(customer.id, nextStage);
    setSaving(false);
    setOpen(false);
    const nextStageLabel = pipeline.formatLabel(nextStage);
    if (missingLabels && missingLabels.length > 0) {
      setStage(customer.pipeline_stage);
      const list = missingLabels.map((label) => `• ${label}`).join("\n");
      window.alert(
        `Cannot move to ${nextStageLabel} — ${missingLabels.length} required credit app field${missingLabels.length === 1 ? " is" : "s are"} still missing:\n\n${list}\n\nComplete the credit application first.`
      );
      return;
    }
    if (error) {
      setStage(customer.pipeline_stage);
      onBanner(error);
      return;
    }
    setStage(nextStage);
    onStageChanged({ ...customer, pipeline_stage: nextStage });
  };

  const badgeStyle = pipeline.badgeStyle(stage);
  const stageLabel = pipeline.formatLabel(stage);

  if (readonly) {
    return (
      <span className="crmPipelineBadge crmPipelineBadgeThemed" style={badgeStyle}>
        {stageLabel}
      </span>
    );
  }

  return (
    <div className="crmPipelineStagePicker" ref={wrapRef}>
      <button
        type="button"
        className="crmPipelineBadgeBtn crmPipelineBadgeThemed"
        style={badgeStyle}
        disabled={saving}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Pipeline stage: ${stageLabel}. Click to change.`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="crmPipelineBadgeLabel">{stageLabel}</span>
        <span className="crmPipelineBadgeChevron" aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? (
        <div className="crmPipelineStageMenu" role="listbox" aria-label="Choose pipeline stage">
          <p className="crmPipelineStageMenuHint">Pipeline stage</p>
          <div className="crmPipelineStageMenuGrid">
            {pipeline.selectableStages.map((opt) => (
              <button
                key={opt.slug}
                type="button"
                role="option"
                aria-selected={opt.slug === stage}
                className={`crmPipelineStageOption crmPipelineBadgeThemed${
                  opt.slug === stage ? " crmPipelineStageOptionActive" : ""
                }`}
                style={pipeline.badgeStyle(opt.slug)}
                disabled={saving}
                onClick={() => void onPick(opt.slug)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
