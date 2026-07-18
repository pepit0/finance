import { Bot, Check, Feather, Shield, TrendingUp, User } from "lucide-react";
import { useEffect, useState } from "react";

function BarRiser({ targetH, delay }: { targetH: string; delay: number }) {
  const [h, setH] = useState("0%");
  useEffect(() => {
    const t = setTimeout(() => setH(targetH), delay + 50);
    return () => clearTimeout(t);
  }, [targetH, delay]);
  return (
    <div
      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary to-emerald-400 rounded-t-lg"
      style={{ height: h, transition: "height 0.65s cubic-bezier(.22,.68,0,1.2)" }}
    />
  );
}

function WidthRiser({ targetW, delay, className }: { targetW: string; delay: number; className: string }) {
  const [w, setW] = useState("0%");
  useEffect(() => {
    const t = setTimeout(() => setW(targetW), delay + 60);
    return () => clearTimeout(t);
  }, [targetW, delay]);
  return <div className={className} style={{ width: w, transition: "width 0.9s cubic-bezier(.22,.68,0,1.2)" }} />;
}

export function FeaturePreviewPanel({ type, animKey }: { type: string; animKey: number }) {
  const base = "absolute inset-0 flex flex-col items-center justify-center p-6";

  if (type === "chat") {
    return (
      <div className={base} key={animKey}>
        <div className="w-full max-w-xs space-y-3">
          {[
            { side: "left", text: "Hi! I'm interested in a new website.", delay: 0 },
            { side: "right", text: "Great! What's your main goal?", delay: 350 },
            { side: "left", text: "Generate more leads for our clinic.", delay: 700 },
            { side: "right", text: "✓ Lead captured & added to CRM!", delay: 1050, green: true },
          ].map((m, i) => (
            <div
              key={i}
              className={`flex ${m.side === "right" ? "justify-end" : "justify-start"}`}
              style={{ animation: `fadeUp 0.4s ease ${m.delay}ms both` }}
            >
              <div className={`flex items-center gap-2 max-w-[88%] ${m.side === "right" ? "flex-row-reverse" : ""}`}>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 self-center ${
                    m.side === "right"
                      ? "bg-primary/20 border border-primary/40"
                      : "bg-secondary border border-border"
                  }`}
                >
                  {m.side === "right" ? (
                    <Bot size={12} className="text-primary" />
                  ) : (
                    <User size={12} className="text-muted-foreground" />
                  )}
                </div>
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-medium leading-relaxed ${
                    m.green
                      ? "bg-primary text-primary-foreground"
                      : m.side === "right"
                        ? "bg-secondary text-foreground"
                        : "bg-card border border-border text-foreground"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "speed") {
    return (
      <div className={base} key={animKey}>
        <div className="w-full max-w-xs space-y-5">
          {[
            { label: "Before Feath", w: "88%", delay: 0, time: "6.4s", barCls: "h-full bg-red-500 rounded-full", txt: "text-red-400" },
            { label: "After Feath", w: "11%", delay: 350, time: "0.8s", barCls: "h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full", txt: "text-primary font-bold" },
          ].map((r) => (
            <div key={r.label}>
              <div className="flex justify-between text-xs mb-2 font-medium">
                <span className="text-muted-foreground">{r.label}</span>
                <span className={r.txt}>{r.time} load</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <WidthRiser targetW={r.w} delay={r.delay} className={r.barCls} />
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-1 pt-4 border-t border-border">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-primary font-semibold">8× faster, guaranteed.</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "code") {
    return (
      <div className={base} key={animKey}>
        <div className="w-full max-w-sm bg-[#0a1208] rounded-xl border border-primary/15 overflow-hidden font-mono text-xs">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#0d1a0b] border-b border-primary/10">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-primary/50" />
            </div>
            <span className="text-muted-foreground/50 text-[10px] ml-1">site.config.ts</span>
          </div>
          <div className="p-3 space-y-1">
            {[
              { ln: "1", code: "// Sunrise Dental, built by Feath", color: "text-muted-foreground/60", delay: 0 },
              { ln: "2", code: "", color: "", delay: 80 },
              { ln: "3", code: "export default {", color: "text-foreground/80", delay: 140 },
              { ln: "4", code: '  client:  "Sunrise Dental",', color: "text-sky-400/90", delay: 220 },
              { ln: "5", code: '  goal:    "Lead generation",', color: "text-sky-400/90", delay: 300 },
              { ln: "6", code: "  ai:      true,", color: "text-primary", delay: 400 },
              { ln: "7", code: "  booking: true,", color: "text-primary", delay: 480 },
              { ln: "8", code: '  crm:     "feath-crm",', color: "text-violet-400/90", delay: 560 },
              { ln: "9", code: "  perf:    { score: 99, lcp: 0.8 },", color: "text-amber-400/80", delay: 640 },
              { ln: "10", code: "};", color: "text-foreground/80", delay: 740 },
            ].map((l, i) => (
              <div key={i} className="flex gap-3" style={{ animation: `fadeUp 0.28s ease ${l.delay}ms both` }}>
                <span className="text-muted-foreground/25 select-none w-4 text-right flex-shrink-0">{l.ln}</span>
                <span className={`${l.color} whitespace-pre`}>{l.code}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === "security") {
    return (
      <div className={base} key={animKey}>
        <div className="mb-6 flex justify-center">
          <div
            className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center"
            style={{ animation: "pulseGlow 2s ease-in-out infinite" }}
          >
            <Shield size={36} className="text-primary" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2.5">
          {["SSL Certificate", "GDPR Compliant", "Security Audits", "DDoS Protection"].map((item, i) => (
            <div
              key={item}
              className="flex items-center gap-2.5 bg-secondary/50 border border-border rounded-lg px-4 py-2 w-48"
              style={{ animation: `fadeUp 0.35s ease ${i * 160}ms both` }}
            >
              <span className="w-4 h-4 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Check size={9} className="text-primary" />
              </span>
              <span className="text-xs font-medium text-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "integrations") {
    const C = 120;
    const R = 88;
    const nodes = [
      { label: "CRM", angle: -90 },
      { label: "Email", angle: -30 },
      { label: "Stripe", angle: 30 },
      { label: "Slack", angle: 90 },
      { label: "Calendar", angle: 150 },
      { label: "Analytics", angle: 210 },
    ].map((n) => ({
      ...n,
      x: C + Math.cos((n.angle * Math.PI) / 180) * R,
      y: C + Math.sin((n.angle * Math.PI) / 180) * R,
    }));

    return (
      <div className={base} key={animKey}>
        <div className="relative flex-shrink-0" style={{ width: 240, height: 240 }}>
          <svg width={240} height={240} className="absolute inset-0" style={{ overflow: "visible" }}>
            {nodes.map((n, i) => (
              <line
                key={i}
                x1={C}
                y1={C}
                x2={n.x}
                y2={n.y}
                stroke="rgba(61,184,112,0.22)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                style={{ animation: `fadeUp 0.35s ease ${i * 70}ms both` }}
              />
            ))}
            {nodes.map((n, i) => (
              <circle key={`d${i}`} r="3" fill="#3db870" opacity="0.85">
                <animateMotion
                  dur={`${2 + i * 0.28}s`}
                  repeatCount="indefinite"
                  begin={`${i * 0.38}s`}
                  path={`M ${C} ${C} L ${n.x} ${n.y}`}
                />
              </circle>
            ))}
          </svg>
          <div className="absolute z-20" style={{ left: C, top: C, transform: "translate(-50%, -50%)" }}>
            <div
              className="w-14 h-14 rounded-2xl bg-primary/20 border-2 border-primary/50 flex items-center justify-center"
              style={{ boxShadow: "0 0 22px rgba(61,184,112,0.3)" }}
            >
              <Feather size={22} className="text-primary" />
            </div>
          </div>
          {nodes.map((n, i) => (
            <div
              key={n.label}
              className="absolute z-10"
              style={{ width: 56, height: 26, left: n.x - 28, top: n.y - 13, animation: `fadeUp 0.3s ease ${i * 80}ms both` }}
            >
              <div className="w-full h-full rounded-lg bg-card border border-border flex items-center justify-center hover:border-primary/50 transition-colors">
                <span className="text-[9px] font-bold text-muted-foreground text-center leading-none">{n.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const bars = [
    { label: "Jan", h: "38%", delay: 0 },
    { label: "Feb", h: "52%", delay: 80 },
    { label: "Mar", h: "45%", delay: 160 },
    { label: "Apr", h: "68%", delay: 240 },
    { label: "May", h: "80%", delay: 320 },
    { label: "Jun", h: "100%", delay: 400 },
  ];

  return (
    <div className={base} key={animKey}>
      <div className="w-full max-w-xs">
        <div className="flex items-end gap-2 mb-1" style={{ height: 140 }}>
          {bars.map((b) => (
            <div key={b.label} className="flex-1 h-full flex flex-col">
              <div className="flex-1 relative rounded-lg overflow-hidden bg-secondary/50">
                <BarRiser targetH={b.h} delay={b.delay} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-4">
          {bars.map((b) => (
            <div key={b.label} className="flex-1 text-center">
              <span className="text-[9px] text-muted-foreground font-medium">{b.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-3 border-t border-border">
          <TrendingUp size={13} className="text-primary flex-shrink-0" />
          <span className="text-xs text-primary font-semibold">+148% conversion growth</span>
        </div>
      </div>
    </div>
  );
}
