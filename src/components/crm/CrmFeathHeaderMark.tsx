type CrmFeathHeaderMarkProps = {
  className?: string;
};

/** Feath product-site mark — colors follow CRM light/dark via CSS (see temptation-theme.css). */
export function CrmFeathHeaderMark({ className = "" }: CrmFeathHeaderMarkProps) {
  return (
    <svg
      className={["crmFeathHeaderMark", className].filter(Boolean).join(" ")}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect className="crmFeathHeaderMarkTile" width="32" height="32" rx="8" />
      <g
        className="crmFeathHeaderMarkFeather"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        transform="translate(8.5 8.5) scale(0.625)"
      >
        <path d="M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z" />
        <path d="M16 8 2 22" />
        <path d="M17.5 15H9" />
      </g>
    </svg>
  );
}
