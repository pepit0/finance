import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Check,
  Database,
  Globe,
  Lock,
  Users,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlowButton } from "../components/GlowButton";
import { Reveal } from "../Reveal";

const crmFeatures = [
  { icon: Users, title: "Contact Management", desc: "Centralise every lead, client, and deal in one clean interface." },
  { icon: Workflow, title: "Pipeline Automation", desc: "Custom pipelines with automated triggers, reminders, and stage actions." },
  { icon: Bell, title: "Smart Notifications", desc: "AI surfaces the right contact at the right time so you never miss a follow-up." },
  { icon: BarChart3, title: "Revenue Analytics", desc: "Live dashboards with pipeline value, conversion rates, and team metrics." },
  { icon: Lock, title: "Role-Based Access", desc: "Granular permissions so reps see their book and managers see everything." },
  { icon: Globe, title: "Website Integration", desc: "Forms, chat, and events from your Feath site flow in with zero config." },
];

type Stage = {
  label: string;
  count: number;
  value: number;
  bar: string;
  text: string;
  bump: boolean;
};

export function CRMPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"pipeline" | "contacts" | "analytics">("pipeline");
  const tabs = [
    { id: "pipeline" as const, label: "Pipeline" },
    { id: "contacts" as const, label: "Contacts" },
    { id: "analytics" as const, label: "Analytics" },
  ];

  const [stages, setStages] = useState<Stage[]>([
    { label: "New Lead", count: 12, value: 48, bar: "bg-sky-500/20 border-sky-500/20", text: "text-sky-400", bump: false },
    { label: "Qualified", count: 7, value: 92, bar: "bg-primary/20 border-primary/20", text: "text-primary", bump: false },
    { label: "Proposal", count: 4, value: 120, bar: "bg-amber-500/20 border-amber-500/20", text: "text-amber-400", bump: false },
    { label: "Closed", count: 9, value: 310, bar: "bg-emerald-500/20 border-emerald-500/20", text: "text-emerald-400", bump: false },
  ]);

  const addDeal = (i: number) => {
    setStages((s) =>
      s.map((st, idx) =>
        idx === i
          ? { ...st, count: st.count + 1, value: st.value + Math.round(8 + Math.random() * 20), bump: true }
          : st
      )
    );
    setTimeout(() => {
      setStages((s) => s.map((st, idx) => (idx === i ? { ...st, bump: false } : st)));
    }, 400);
  };

  const contacts = [
    { name: "Priya Mehta", co: "Sunrise Clinic", val: "$18k", time: "2h ago" },
    { name: "Tom Bradley", co: "Apex Logistics", val: "$42k", time: "5h ago" },
    { name: "Sara Kim", co: "Bloom Studio", val: "$9k", time: "1d ago" },
    { name: "James Okafor", co: "NorthEdge Tech", val: "$65k", time: "2d ago" },
  ];

  return (
    <div className="pt-16">
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 border border-primary/20">
                <Database size={12} /> Feath CRM
              </div>
              <h1
                className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight mb-6 tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <span className="whitespace-nowrap">Your entire pipeline.</span>
                <br />
                <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">One place.</span>
              </h1>
              <p className="text-muted-foreground leading-relaxed mb-7 text-lg">
                Every form fill, chat, and page visit from your website flows into a clean pipeline your team can action
                immediately. No imports, no manual work.
              </p>
              <ul className="space-y-3.5 mb-9">
                {[
                  "Connects natively to your Feath website",
                  "AI follow-up reminders & lead scoring",
                  "Real-time pipeline and revenue reporting",
                  "Custom fields, stages, and team workflows",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                    <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
                      <Check size={11} className="text-primary" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-3">
                <GlowButton onClick={() => navigate("/contact/")}>
                  Get a demo <ArrowRight size={15} />
                </GlowButton>
                <GlowButton variant="outline" onClick={() => navigate("/contact/")}>
                  See pricing
                </GlowButton>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <div className="relative">
              <div
                className="absolute -inset-4 rounded-3xl opacity-20 pointer-events-none"
                style={{ background: "radial-gradient(ellipse, #3db870 0%, transparent 70%)", filter: "blur(30px)" }}
              />
              <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
                <div className="border-b border-border flex bg-secondary/20">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={`flex-1 px-4 py-3.5 text-xs font-semibold transition-all ${
                        activeTab === t.id
                          ? "text-primary border-b-2 border-primary bg-primary/5"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {activeTab === "pipeline" && (
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {stages.map((s, i) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => addDeal(i)}
                        className={`rounded-xl p-4 border text-left transition-all duration-150 hover:brightness-110 active:scale-95 ${s.bar}`}
                        style={s.bump ? { animation: "dealIn 0.25s ease" } : undefined}
                      >
                        <div className={`text-xs font-bold mb-1.5 ${s.text}`}>{s.label}</div>
                        <div
                          className="text-2xl font-extrabold text-foreground mb-0.5 tabular-nums"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          ${s.value}k
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {s.count} deals · <span className="text-primary/70">+ add</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === "contacts" && (
                  <div className="divide-y divide-border">
                    {contacts.map((c) => (
                      <div key={c.name} className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {c.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">{c.name}</div>
                            <div className="text-xs text-muted-foreground">{c.co}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-foreground">{c.val}</div>
                          <div className="text-xs text-muted-foreground">{c.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "analytics" && (
                  <div className="p-5 space-y-5">
                    {[
                      { label: "Conversion rate", val: "34%", change: "+4.2%", w: "34%" },
                      { label: "Avg deal size", val: "$28k", change: "+11%", w: "68%" },
                      { label: "Pipeline value", val: "$570k", change: "+23%", w: "82%" },
                    ].map((m) => (
                      <div key={m.label}>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-muted-foreground font-medium">{m.label}</span>
                          <span className="font-bold text-foreground">
                            {m.val} <span className="text-primary font-semibold">{m.change}</span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-700"
                            style={{ width: m.w }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-border px-5 py-3 flex items-center justify-between bg-secondary/10">
                  <span className="text-xs text-muted-foreground">Updated just now</span>
                  <span className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Live
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section
        className="py-20 border-y border-border overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(61,184,112,0.03) 0%, transparent 50%, rgba(61,184,112,0.04) 100%)" }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Every lead, automatically handled.
            </h2>
            <p className="text-muted-foreground text-sm">Watch how a form submission becomes a closed deal.</p>
          </Reveal>

          <Reveal>
            <div className="hidden md:grid md:grid-cols-4 gap-0 mb-16 relative">
              {[
                { icon: Globe, label: "Your Website", sub: "Visitor fills a form", color: "bg-sky-500/15 border-sky-500/25 text-sky-400" },
                { icon: Bot, label: "Feath AI", sub: "Qualifies the lead", color: "bg-primary/15 border-primary/25 text-primary" },
                { icon: Database, label: "CRM Pipeline", sub: "Deal auto-created", color: "bg-violet-500/15 border-violet-500/25 text-violet-400" },
                { icon: Users, label: "Your Team", sub: "Notified instantly", color: "bg-amber-500/15 border-amber-500/25 text-amber-400" },
              ].map((node, i, nodes) => (
                <div key={node.label} className="relative z-10 flex flex-col items-center gap-3 text-center px-4">
                  {i < nodes.length - 1 && (
                    <>
                      <div
                        className="absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px pointer-events-none"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(61,184,112,0.2), transparent)" }}
                      />
                      <div
                        className="absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px pointer-events-none"
                        style={{
                          background: "linear-gradient(90deg, transparent 0%, #3db870 50%, transparent 100%)",
                          backgroundSize: "200% 100%",
                          animation: "leadTravel 2.4s ease-in-out infinite",
                          animationDelay: `${i * 0.35}s`,
                        }}
                      />
                    </>
                  )}
                  <div
                    className={`relative z-10 w-16 h-16 rounded-2xl border-2 ${node.color} flex items-center justify-center flex-shrink-0`}
                    style={{ animation: `floatNode 3s ease-in-out ${i * 0.4}s infinite alternate` }}
                  >
                    <node.icon size={26} />
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {node.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{node.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex md:hidden flex-col items-center gap-6 mb-12">
              {[
                { icon: Globe, label: "Your Website", sub: "Visitor fills a form", color: "bg-sky-500/15 border-sky-500/25 text-sky-400" },
                { icon: Bot, label: "Feath AI", sub: "Qualifies the lead", color: "bg-primary/15 border-primary/25 text-primary" },
                { icon: Database, label: "CRM Pipeline", sub: "Deal auto-created", color: "bg-violet-500/15 border-violet-500/25 text-violet-400" },
                { icon: Users, label: "Your Team", sub: "Notified instantly", color: "bg-amber-500/15 border-amber-500/25 text-amber-400" },
              ].map((node) => (
                <div key={node.label} className="flex flex-col items-center gap-2 text-center">
                  <div className={`w-14 h-14 rounded-2xl border-2 ${node.color} flex items-center justify-center`}>
                    <node.icon size={22} />
                  </div>
                  <div className="font-bold text-foreground text-sm">{node.label}</div>
                  <div className="text-xs text-muted-foreground">{node.sub}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {crmFeatures.map((f, i) => (
              <Reveal key={f.title} delay={i * 40}>
                <div
                  className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary/25 transition-all duration-200 group cursor-default"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(61,184,112,0.07)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <f.icon size={16} className="text-primary" />
                  </div>
                  <span className="font-semibold text-foreground text-sm">{f.title}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
