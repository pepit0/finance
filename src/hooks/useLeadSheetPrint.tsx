import { useCallback, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import type { CrmCreditApplicationInfo } from "../types/crm";
import { CrmCreditAppLeadSheetPrint } from "../components/crm/CrmCreditAppLeadSheetPrint";
import { buildCreditAppSummarySections } from "../utils/creditAppSummary";
import { formatCreditAppSaveFilename, sanitizePrintDocumentTitle } from "../utils/creditAppName";
import { formatLeadSheetTimestamp } from "../utils/crmLeadSheetPrint";

export type LeadSheetPrintParams = {
  form: CrmCreditApplicationInfo;
  customerName: string;
  assigneeLabel: string | null;
  sourceLabel: string;
  notes?: string;
};

export function useLeadSheetPrint() {
  const [printJob, setPrintJob] = useState<
    (LeadSheetPrintParams & { printedAt: string }) | null
  >(null);

  const printLeadSheet = useCallback((params: LeadSheetPrintParams) => {
    flushSync(() => {
      setPrintJob({
        ...params,
        notes: params.notes ?? params.form.notes ?? "",
        printedAt: formatLeadSheetTimestamp(new Date())
      });
    });

    const previousTitle = document.title;
    document.title = sanitizePrintDocumentTitle(
      formatCreditAppSaveFilename(params.form, params.customerName)
    );
    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };
    window.addEventListener("afterprint", restoreTitle);
    window.print();
  }, []);

  const printPortal =
    printJob &&
    createPortal(
      <CrmCreditAppLeadSheetPrint
        customerName={printJob.customerName}
        assigneeLabel={printJob.assigneeLabel}
        sourceLabel={printJob.sourceLabel}
        printedAt={printJob.printedAt}
        notes={printJob.notes}
        sections={buildCreditAppSummarySections(printJob.form).filter((section) => section.id !== "notes")}
      />,
      document.body
    );

  return { printLeadSheet, printPortal };
}
