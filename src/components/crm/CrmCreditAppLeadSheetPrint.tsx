import { CrmCreditAppLeadSheet, type CrmCreditAppLeadSheetProps } from "./CrmCreditAppLeadSheet";

type CrmCreditAppLeadSheetPrintProps = Omit<CrmCreditAppLeadSheetProps, "variant" | "printedAt"> & {
  printedAt: string;
};

export function CrmCreditAppLeadSheetPrint(props: CrmCreditAppLeadSheetPrintProps) {
  return (
    <div className="crmLeadSheetPrintRoot" aria-hidden="true">
      <CrmCreditAppLeadSheet {...props} variant="print" />
    </div>
  );
}
