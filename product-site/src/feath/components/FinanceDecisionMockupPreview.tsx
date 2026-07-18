import { Building2, CheckCircle2, Scale, Search } from "lucide-react";

const LENDERS = [
  { name: "Santander", tier: "Near-prime", outcome: "Eligible", score: "620+" },
  { name: "iA Auto", tier: "Subprime", outcome: "Eligible", score: "540+" },
  { name: "Source One", tier: "Subprime", outcome: "Conditional", score: "500+" },
] as const;

export function FinanceDecisionMockupPreview() {
  return (
    <div className="w-full h-full bg-[#0c1218] flex flex-col p-4 font-mono text-xs overflow-hidden">
      <div className="flex gap-2 mb-4 opacity-60">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
      </div>

      <div className="flex gap-3 flex-1 overflow-hidden min-h-0">
        <div className="w-[38%] flex flex-col gap-2 flex-shrink-0">
          <div className="text-[10px] text-sky-400/70 font-bold tracking-widest mb-0.5">CREDIT BUREAU</div>
          <div className="bg-white/5 rounded-lg p-2.5 border border-white/5 space-y-2">
            <div className="flex items-center gap-1.5 text-white/50 text-[8px]">
              <Search size={10} className="text-sky-400/80" />
              Customer situation
            </div>
            {[
              ["Score band", "540–619"],
              ["Province", "ON"],
              ["Bankruptcy", "Discharged"],
              ["LTV target", "115%"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-2">
                <span className="text-white/35 text-[8px]">{label}</span>
                <span className="text-white/80 text-[8px] font-semibold">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[8px] text-white/40 mt-1">
            <Scale size={10} className="text-sky-400/70" />
            Guideline match
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2 overflow-hidden min-h-0">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-sky-400/70 font-bold tracking-widest">LENDER MATCHES</div>
            <div className="text-[8px] text-white/30">3 submit</div>
          </div>
          <div className="space-y-1.5 overflow-hidden">
            {LENDERS.map((lender) => (
              <div
                key={lender.name}
                className={`rounded-lg p-2 border flex items-start gap-2 ${
                  lender.outcome === "Eligible"
                    ? "bg-emerald-500/10 border-emerald-500/25"
                    : "bg-amber-500/10 border-amber-500/25"
                }`}
              >
                <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Building2 size={12} className="text-white/40" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-white/85 font-bold text-[10px] truncate">{lender.name}</span>
                    <span
                      className={`text-[8px] font-semibold flex items-center gap-0.5 ${
                        lender.outcome === "Eligible" ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      <CheckCircle2 size={9} />
                      {lender.outcome}
                    </span>
                  </div>
                  <div className="text-white/35 text-[8px] mt-0.5">
                    {lender.tier} · min {lender.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
