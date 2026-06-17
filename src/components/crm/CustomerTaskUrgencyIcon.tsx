import type { CustomerTaskUrgency } from "../../utils/customerTaskUrgency";

type CustomerTaskUrgencyIconProps = {
  urgency: CustomerTaskUrgency;
};

export function CustomerTaskUrgencyIcon({ urgency }: CustomerTaskUrgencyIconProps) {
  const label = urgency === "upcoming" ? "Upcoming task" : "Missed task";

  return (
    <span
      className={`crmCustomerTaskUrgencyIcon crmCustomerTaskUrgencyIcon-${urgency}`}
      title={label}
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5a1.25 1.25 0 1 1 0 2.5A1.25 1.25 0 0 1 12 7Zm-1.25 4.5h2.5v7h-2.5v-7Z"
        />
      </svg>
    </span>
  );
}
