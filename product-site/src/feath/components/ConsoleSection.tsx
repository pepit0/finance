import { Boxes, LayoutGrid, Smartphone, Users } from "lucide-react";
import { useState } from "react";
import { Reveal } from "../Reveal";
import {
  AppStoreBadge,
  C,
  ConsoleWindow,
  LeadTable,
  PhoneMock,
  ScoreRing,
  SectionHeader,
  Sparkline,
  SpeedupBars,
  StatCard,
} from "./console/ui";

type ViewId = "websites" | "webapps" | "mobile" | "crm";

const MODULES: { id: ViewId; n: string; icon: typeof LayoutGrid; title: string; tab: string; sub: string }[] = [
  { id: "websites", n: "01", icon: LayoutGrid, title: "Websites", tab: "Websites", sub: "Modern sites that turn visitors into customers." },
  { id: "webapps", n: "02", icon: Boxes, title: "Web apps & tools", tab: "Web apps", sub: "Custom tools that take the busywork out of your day." },
  { id: "mobile", n: "03", icon: Smartphone, title: "Mobile apps", tab: "Mobile", sub: "iPhone and Android apps, like Burd. Live on the App Store." },
  { id: "crm", n: "04", icon: Users, title: "CRM (optional)", tab: "CRM", sub: "Add it to your site when you want it. Optional." },
];

const TABS = MODULES.map((m) => ({ id: m.id, label: m.tab }));

function WebsitesView() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="First paint" value="0.4s" delta="0.3s faster" />
        <StatCard label="Conversion" value="+38%" delta="vs. old site" spark={[4, 5, 5, 6, 7, 9, 11]} />
        <StatCard label="Uptime" value="99.97%" />
        <StatCard label="Lighthouse" value="100" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-xl p-4" style={{ background: C.inset, border: `1px solid ${C.borderSoft}` }}>
        <div className="flex gap-4 sm:gap-5">
          <ScoreRing value={99} label="Perf" />
          <ScoreRing value={100} label="SEO" />
          <ScoreRing value={100} label="A11y" />
          <ScoreRing value={100} label="Best" />
        </div>
        <div className="text-left sm:text-right">
          <div className="font-mono text-[10px] uppercase tracking-wider mb-1" style={{ color: C.faint }}>Load time · 7d</div>
          <Sparkline data={[9, 7, 8, 6, 5, 6, 4]} width={130} height={34} />
        </div>
      </div>
      <p className="text-sm" style={{ color: C.dim }}>Every site we ship scores 95 or higher for speed and search.</p>
    </div>
  );
}

function WebAppsView() {
  return (
    <div className="space-y-5">
      <SpeedupBars
        rows={[
          { label: "Loan decision", before: "4 hrs", after: "8 min", pct: 92 },
          { label: "Quote → invoice", before: "45 min", after: "3 min", pct: 88 },
          { label: "Weekly report", before: "2 days", after: "5 min", pct: 95 },
        ]}
      />
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Tasks automated" value="1,240/mo" />
        <StatCard label="Hours saved" value="320/mo" />
        <StatCard label="Active users" value="86" />
      </div>
      <p className="text-sm" style={{ color: C.dim }}>Tools and dashboards that replace spreadsheets and long email threads.</p>
    </div>
  );
}

function MobileView() {
  return (
    <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-center">
      <PhoneMock />
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <AppStoreBadge />
          <span className="font-mono text-[11px]" style={{ color: C.faint }}>iOS · Android</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Rating" value="4.8" />
          <StatCard label="Downloads" value="12k" />
          <StatCard label="Category" value="Nature" />
        </div>
        <p className="text-sm" style={{ color: C.dim }}>
          Burd is a bird-watching app with a live sightings feed. We designed, built, and shipped it to the App Store.
        </p>
      </div>
    </div>
  );
}

function CrmView() {
  return (
    <div className="space-y-4">
      <span
        className="inline-flex font-mono text-[10px] uppercase tracking-wider px-2 py-1 rounded-md"
        style={{ background: C.warnSoft, color: C.warn }}
      >
        Optional add-on
      </span>
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="New leads" value="128" delta="18% wk" />
        <StatCard label="Avg reply" value="0.6s" />
        <StatCard label="Pipeline" value="$84k" />
      </div>
      <LeadTable
        rows={[
          ["Emma R.", "AI chat", "Booking", "New"],
          ["Marcus L.", "Website form", "Callback", "Qualified"],
          ["Priya S.", "Referral", "Quote", "Booked"],
        ]}
      />
      <p className="text-sm" style={{ color: C.dim }}>Our CRM plugs into your site when you want it. It is optional, and your site works fine without it.</p>
    </div>
  );
}

export function ConsoleSection() {
  const [active, setActive] = useState<ViewId>("websites");
  const view = {
    websites: <WebsitesView />,
    webapps: <WebAppsView />,
    mobile: <MobileView />,
    crm: <CrmView />,
  }[active];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-28">
      <Reveal className="mb-10 md:mb-16">
        <SectionHeader
          index="02"
          eyebrow="What we build"
          title={
            <>
              Whatever your business needs. <span className="text-primary">Built.</span>
            </>
          }
          sub="Websites, mobile apps, and the tools that keep your business running. If your current software is slow or out of date, we replace it with something better."
        />
      </Reveal>

      <Reveal>
        <div className="grid lg:grid-cols-[280px_1fr] gap-6 lg:gap-8 items-start">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0 pb-1">
            {MODULES.map((m) => {
              const on = active === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActive(m.id)}
                  aria-pressed={on}
                  className="group relative text-left rounded-xl px-3.5 py-3 transition-colors flex-shrink-0 min-w-[220px] lg:min-w-0"
                  style={{
                    background: on ? "var(--color-secondary)" : "transparent",
                    border: `1px solid ${on ? "var(--color-border)" : "transparent"}`,
                  }}
                >
                  <span
                    className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full transition-opacity"
                    style={{ background: "var(--color-primary)", opacity: on ? 1 : 0 }}
                  />
                  <div className="flex items-center gap-2 mb-1">
                    <m.icon size={15} className={on ? "text-primary" : "text-muted-foreground"} />
                    <span className="font-mono text-[10px] text-muted-foreground/60">{m.n}</span>
                  </div>
                  <div
                    className={`font-bold text-sm ${on ? "text-foreground" : "text-muted-foreground"}`}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {m.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{m.sub}</div>
                </button>
              );
            })}
          </div>

          <ConsoleWindow
            title="feath.console"
            tabs={TABS}
            active={active}
            onTab={(id) => setActive(id as ViewId)}
            footer={
              <>
                <span>STACK · React / Node</span>
                <span>BUILD · 3-4 WKS</span>
                <span>OWNERSHIP · 100% YOURS</span>
                <span>UPTIME · 99.97%</span>
              </>
            }
          >
            {view}
          </ConsoleWindow>
        </div>
      </Reveal>
    </section>
  );
}
