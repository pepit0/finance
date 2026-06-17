type CrmLeadSheetPrintButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
};

export function CrmLeadSheetPrintButton({
  onClick,
  disabled = false,
  className,
  label = "Print lead sheet"
}: CrmLeadSheetPrintButtonProps) {
  const buttonClassName = className ? `crmCreditAppPrintBtn ${className}` : "crmCreditAppPrintBtn";

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <svg className="crmCreditAppPrintIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M19 8H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3Zm-1 10h-2v-4H8v4H6v-5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5Zm2-7a1 1 0 1 1 0-2 1 1 0 0 1 0 2ZM18 3H6v4h12V3Z"
        />
      </svg>
    </button>
  );
}
