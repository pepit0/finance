import { BarChart3, Bell, Database, Users } from "lucide-react";

export function CRMMockupPreview() {
  return (
    <div className="w-full h-full bg-[#0f1a0d] flex flex-col p-4 font-mono text-xs overflow-hidden">
      <div className="flex gap-2 mb-4 opacity-60">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
      </div>
      <div className="flex gap-3 flex-1 overflow-hidden">
        <div className="w-14 flex flex-col gap-2 flex-shrink-0">
          {[Database, Users, BarChart3, Bell].map((Icon, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 0 ? "bg-primary/30" : "bg-white/5"}`}
            >
              <Icon size={14} className={i === 0 ? "text-primary" : "text-white/30"} />
            </div>
          ))}
        </div>
        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
          <div className="text-[10px] text-primary/60 font-bold tracking-widest mb-1">PIPELINE</div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              ["New Lead", "$48k", "12"],
              ["Qualified", "$92k", "7"],
              ["Proposal", "$120k", "4"],
              ["Closed", "$310k", "9"],
            ].map(([l, v, c]) => (
              <div key={l} className="bg-white/5 rounded-lg p-2 border border-white/5">
                <div className="text-primary/50 text-[8px] mb-0.5">{l}</div>
                <div className="text-white/80 font-bold text-xs">{v}</div>
                <div className="text-white/30 text-[8px]">{c} deals</div>
              </div>
            ))}
          </div>
          <div className="mt-1 space-y-1">
            {[
              ["Priya Mehta", "Sunrise Clinic", "$18k"],
              ["Tom Bradley", "Apex Logistics", "$42k"],
              ["Sara Kim", "Bloom Studio", "$9k"],
            ].map(([n, c, v]) => (
              <div key={n} className="flex items-center justify-between bg-white/5 rounded px-2 py-1.5 border border-white/5">
                <div>
                  <div className="text-white/70 text-[9px] font-semibold">{n}</div>
                  <div className="text-white/30 text-[8px]">{c}</div>
                </div>
                <div className="text-primary text-[9px] font-bold">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
