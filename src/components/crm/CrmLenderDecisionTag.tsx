import type { CrmLenderOutcomeEntry, CrmLenderSlug } from "../../types/crm";
import type { CrmLenderDecisionTag as CrmLenderDecisionTagValue } from "../../utils/lenderOutcomeTag";
import {
  aggregateLenderDecisionTag,
  lenderDecisionTagClass,
  lenderDecisionTagLabel
} from "../../utils/lenderOutcomeTag";

type CrmLenderDecisionTagProps = {
  outcomes?: Partial<Record<CrmLenderSlug, CrmLenderOutcomeEntry>>;
  tag?: CrmLenderDecisionTagValue | null;
  className?: string;
};

export function CrmLenderDecisionTag({ outcomes, tag: tagProp, className = "" }: CrmLenderDecisionTagProps) {
  const tag = tagProp ?? (outcomes ? aggregateLenderDecisionTag(outcomes) : null);
  if (!tag) {
    return null;
  }
  return (
    <span className={`crmLenderDecisionTag ${lenderDecisionTagClass(tag)} ${className}`.trim()}>{lenderDecisionTagLabel(tag)}</span>
  );
}
