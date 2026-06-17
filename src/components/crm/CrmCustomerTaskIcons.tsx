import type { CrmActivityKind, CrmCustomerTaskType } from "../../types/crm";

type IconProps = {
  className?: string;
};

export function CallTaskIcon({ className = "crmCustomerTaskIconSvg" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 3 5.2 2 2 0 0 1 5 4z" />
    </svg>
  );
}

export function AppointmentTaskIcon({ className = "crmCustomerTaskIconSvg" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
      <path d="M8 14h4M8 18h8" />
    </svg>
  );
}

export function OtherTaskIcon({ className = "crmCustomerTaskIconSvg" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

export function CommentActivityIcon({ className = "crmCustomerTaskIconSvg" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

export function TextActivityIcon({ className = "crmCustomerTaskIconSvg" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M21 6H3v12h18V6z" />
      <path d="M7 10h10" />
      <path d="M7 14h6" />
    </svg>
  );
}

export function ActivityKindIcon({
  kind,
  className
}: {
  kind: CrmActivityKind;
  className?: string;
}) {
  switch (kind) {
    case "call":
      return <CallTaskIcon className={className} />;
    case "comment":
      return <CommentActivityIcon className={className} />;
    case "text":
      return <TextActivityIcon className={className} />;
  }
}

export function CustomerTaskTypeIcon({
  taskType,
  className
}: {
  taskType: CrmCustomerTaskType;
  className?: string;
}) {
  switch (taskType) {
    case "call":
      return <CallTaskIcon className={className} />;
    case "appointment":
      return <AppointmentTaskIcon className={className} />;
    default:
      return <OtherTaskIcon className={className} />;
  }
}

export const CUSTOMER_TASK_TYPE_LABELS: Record<CrmCustomerTaskType, string> = {
  call: "Call",
  appointment: "Appointment",
  other: "Other"
};
