import { presenceStatusLabel, type CrmPresenceStatus } from "../../lib/crmPresence";

type CrmPresenceDotProps = {
  status: CrmPresenceStatus;
};

export function CrmPresenceDot({ status }: CrmPresenceDotProps) {
  const label = presenceStatusLabel(status);
  return (
    <span
      className={`crmPresenceDot crmPresenceDot--${status}`}
      title={label}
      aria-label={label}
      role="img"
    />
  );
}
