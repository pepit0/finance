const metrics = [
  "40+ businesses served",
  "100% custom code",
  "AI-integrated by default",
  "Sub-second load times",
  "Zero missed leads",
  "CRM built in-house",
];

export function MetricTicker() {
  const repeated = [...metrics, ...metrics, ...metrics];

  return (
    <div className="overflow-hidden border-y border-border bg-secondary/30 py-3">
      <div className="flex w-max items-center gap-10 whitespace-nowrap" style={{ animation: "ticker 26s linear infinite" }}>
        {repeated.map((m, i) => (
          <span key={`${m}-${i}`} className="flex items-center gap-3 text-xs font-medium text-muted-foreground flex-shrink-0">
            <span className="w-1 h-1 rounded-full bg-primary inline-block" />
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
