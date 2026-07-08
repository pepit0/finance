import {
  ArrowRight,
  Building2,
  Calendar,
  Check,
  Database,
  Globe,
  Layers,
  MessageSquare,
  Puzzle,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { siteConfig } from "../../site.config";
import { GlowButton } from "../components/GlowButton";
import { ParticleCanvas } from "../components/ParticleCanvas";
import { Reveal } from "../Reveal";
import { useTheme } from "../ThemeContext";

const tierMeta: Record<string, { icon: LucideIcon; visual: "website" | "bundle" | "stack" }> = {
  Website: { icon: Globe, visual: "website" },
  "Website + CRM": { icon: Layers, visual: "bundle" },
  "Full growth stack": { icon: Puzzle, visual: "stack" },
};

const trustPills = [
  { icon: Wallet, label: "Flexible plans" },
  { icon: Shield, label: "No contract" },
  { icon: Calendar, label: "Free quote" },
] as const;

const valueIcons = [Building2, Globe, Users] as const;

function MockWindow({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-border/80 bg-background/70 overflow-hidden ${className}`}>
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border/60 bg-muted/20">
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400/70" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
        </div>
        <span className="text-[9px] font-semibold text-muted-foreground truncate">{title}</span>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 px-1 text-primary flex-shrink-0">
      <ArrowRight size={14} />
      <span className="text-[8px] font-bold uppercase tracking-wide text-center leading-tight max-w-[52px]">
        {label}
      </span>
    </div>
  );
}

/** Website only: homepage with hero and contact CTA */
function WebsiteOnlyVisual() {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground mb-2">Your business website</p>
      <MockWindow title="yourbusiness.com">
        <div className="space-y-1.5">
          <div className="flex gap-1 mb-1">
            <div className="h-1 w-6 rounded bg-muted/50" />
            <div className="h-1 w-4 rounded bg-muted/40" />
            <div className="h-1 w-4 rounded bg-muted/40 ml-auto" />
          </div>
          <div className="h-8 rounded-md bg-primary/15 border border-primary/25 flex items-center justify-center">
            <span className="text-[8px] font-bold text-primary">Your headline here</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div className="h-6 rounded bg-muted/30 border border-border/40" />
            <div className="h-6 rounded bg-muted/30 border border-border/40" />
            <div className="h-6 rounded bg-muted/30 border border-border/40" />
          </div>
          <div className="h-4 rounded bg-primary/25 border border-primary/35 flex items-center justify-center">
            <span className="text-[8px] font-bold text-primary">Contact us</span>
          </div>
        </div>
      </MockWindow>
    </div>
  );
}

/** Website + CRM: site captures lead, CRM add-on receives it */
function WebsiteCrmFlowVisual() {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground mb-2">Site captures leads. CRM add-on follows up.</p>
      <div className="flex items-stretch h-24">
        <MockWindow title="Your website" className="flex-1">
          <div className="space-y-1">
            <div className="h-1.5 w-full rounded bg-muted/50" />
            <div className="h-1.5 w-3/4 rounded bg-muted/40" />
            <div className="mt-2 h-5 rounded bg-primary/30 border border-primary/40 flex items-center justify-center">
              <span className="text-[8px] font-bold text-primary">Contact / Apply</span>
            </div>
          </div>
        </MockWindow>
        <FlowArrow label="New lead" />
        <MockWindow title="CRM add-on" className="flex-1">
          <div className="flex items-center gap-1.5 p-1 rounded bg-primary/10 border border-primary/30">
            <div className="w-4 h-4 rounded-full bg-primary/30 flex-shrink-0" />
            <div className="flex-1 space-y-0.5">
              <div className="h-1 w-full rounded bg-primary/40" />
              <div className="h-1 w-2/3 rounded bg-muted/50" />
            </div>
          </div>
          <div className="mt-1 h-3 rounded bg-muted/30 border border-border/30" />
        </MockWindow>
      </div>
    </div>
  );
}

/** Full stack: website base, CRM add-on, custom extras */
function FullStackVisual() {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground mb-2">Website at the center</p>
      <div className="flex flex-col gap-1 h-24 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <Globe size={12} className="text-primary" />
          </div>
          <div className="flex-1 h-7 rounded-md border border-primary/30 bg-primary/10 flex items-center px-2">
            <span className="text-[9px] font-semibold text-foreground">Website</span>
            <span className="text-[8px] text-primary ml-auto font-bold">Core</span>
          </div>
        </div>
        <div className="ml-3.5 w-px h-2 bg-primary/30" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <Database size={12} className="text-emerald-400" />
          </div>
          <div className="flex-1 h-7 rounded-md border border-border/60 bg-muted/20 flex items-center px-2">
            <span className="text-[9px] font-medium text-foreground">CRM add-on</span>
          </div>
        </div>
        <div className="ml-3.5 w-px h-2 bg-primary/30" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
            <Puzzle size={12} className="text-violet-400" />
          </div>
          <div className="flex-1 h-7 rounded-md border border-dashed border-violet-500/35 bg-violet-500/5 flex items-center px-2">
            <span className="text-[9px] font-medium text-foreground">Custom add-ons</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TierVisual({ kind }: { kind: "website" | "bundle" | "stack" }) {
  if (kind === "website") return <WebsiteOnlyVisual />;
  if (kind === "bundle") return <WebsiteCrmFlowVisual />;
  return <FullStackVisual />;
}

/** Hero: website-first plan builder */
function PlanBuilderHero() {
  const blocks = [
    { icon: Globe, label: "Website", sub: "Custom site on your domain", solid: true, tag: "Core" },
    { icon: Database, label: "CRM add-on", sub: "Track leads & follow up", solid: false, tag: "Add-on" },
    { icon: Puzzle, label: "Custom extras", sub: "Workflows & integrations", solid: false, tag: "Optional" },
  ];

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div
        className="absolute inset-0 rounded-3xl opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 40%, rgba(61,184,112,0.18), transparent 65%)" }}
      />
      <div className="relative rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-5 shadow-xl">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Start with a website</p>
        <p className="text-sm font-semibold text-foreground mb-4">Add CRM when you're ready for it.</p>

        <div className="space-y-2 mb-4">
          {blocks.map((block) => (
            <div
              key={block.label}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                block.tag === "Core"
                  ? "border-primary/35 bg-primary/5"
                  : block.tag === "Add-on"
                    ? "border-border bg-background/60"
                    : "border-dashed border-violet-500/30 bg-violet-500/5"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  block.tag === "Core" ? "bg-primary/15" : block.tag === "Add-on" ? "bg-emerald-500/10" : "bg-violet-500/10"
                }`}
              >
                <block.icon
                  size={16}
                  className={
                    block.tag === "Core" ? "text-primary" : block.tag === "Add-on" ? "text-emerald-400" : "text-violet-400"
                  }
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-foreground">{block.label}</div>
                <div className="text-[11px] text-muted-foreground">{block.sub}</div>
              </div>
              <span
                className={`text-[9px] font-bold uppercase flex-shrink-0 ${
                  block.tag === "Core" ? "text-primary" : block.tag === "Add-on" ? "text-emerald-400" : "text-violet-400"
                }`}
              >
                {block.tag}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 flex items-center gap-3">
          <MessageSquare size={18} className="text-primary flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-foreground">Monthly quote on a call</p>
            <p className="text-[10px] text-muted-foreground">Website first, add-ons when you need them</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PricingPage() {
  const navigate = useNavigate();
  const { dark } = useTheme();

  return (
    <div className="pt-16">
      <section className="relative overflow-hidden">
        <ParticleCanvas dark={dark} />
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 30%, rgba(61,184,112,0.15) 0%, transparent 50%)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <Reveal>
              <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-4">Website pricing</p>
              <h1
                className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight mb-5 tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Websites for small and growing businesses.{" "}
                <span className="whitespace-nowrap bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                  CRM optional.
                </span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-3">{siteConfig.pricingIntro}</p>
              <p className="text-sm text-foreground/80 mb-8">{siteConfig.pricingFlexMessage}</p>
              <div className="flex flex-wrap gap-3 mb-8">
                {trustPills.map((pill) => (
                  <div
                    key={pill.label}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-border bg-card/80 text-sm font-medium text-foreground"
                  >
                    <pill.icon size={14} className="text-primary" />
                    {pill.label}
                  </div>
                ))}
              </div>
              <GlowButton onClick={() => navigate("/contact/")}>
                Get a quote <ArrowRight size={15} />
              </GlowButton>
            </Reveal>
            <Reveal delay={100}>
              <PlanBuilderHero />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-4 mb-16">
          {siteConfig.pricingValues.map((value, i) => {
            const Icon = valueIcons[i] ?? Building2;
            return (
              <Reveal key={value.title} delay={i * 50}>
                <div className="flex items-start gap-4 p-5 bg-card border border-border rounded-2xl">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-primary" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground text-sm mb-1">{value.title}</h2>
                    <p className="text-sm text-muted-foreground leading-snug">{value.description}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mb-10 text-center">
          <h2
            className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Pick a starting point
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">Every plan starts with a website. CRM is optional.</p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {siteConfig.pricingTiers.map((tier, i) => {
            const meta = tierMeta[tier.name] ?? { icon: Globe, visual: "website" as const };
            const TierIcon = meta.icon;
            return (
              <Reveal key={tier.name} delay={i * 80}>
                <div
                  className={`relative h-full flex flex-col p-6 rounded-2xl border transition-all duration-300 ${
                    tier.featured
                      ? "bg-gradient-to-b from-primary/10 to-card border-primary/40 shadow-lg shadow-primary/5"
                      : "bg-card border-border hover:border-primary/20"
                  }`}
                >
                  {tier.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                      Most picked
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <TierIcon size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3
                        className="text-lg font-extrabold text-foreground"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {tier.name}
                      </h3>
                      <p className="text-xs text-primary font-semibold">{tier.priceLabel}</p>
                    </div>
                  </div>
                  <TierVisual kind={meta.visual} />
                  <p className="text-sm text-muted-foreground leading-snug my-4">{tier.description}</p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {tier.highlights.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                        <Check size={14} className="text-primary flex-shrink-0" strokeWidth={2.5} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <GlowButton
                    onClick={() => navigate("/contact/")}
                    variant={tier.featured ? "primary" : "outline"}
                    className="w-full justify-center"
                  >
                    Get a quote <ArrowRight size={15} />
                  </GlowButton>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  {siteConfig.pricingNotice}
                </p>
                <h2
                  className="text-2xl md:text-3xl font-extrabold text-foreground mb-3 tracking-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Not sure yet?
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  30 minutes, free. We'll show you what we'd build and give you a straight number.
                </p>
                <GlowButton onClick={() => navigate("/contact/")} size="lg" className="self-start">
                  Book a call <ArrowRight size={17} />
                </GlowButton>
              </div>
              <div className="bg-primary/5 border-t md:border-t-0 md:border-l border-border p-8 md:p-10 flex items-center justify-center">
                <div className="w-full max-w-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 text-center">
                    What the call looks like
                  </p>
                  <div className="space-y-2">
                    {[
                      { step: "1", text: "You tell us about your business" },
                      { step: "2", text: "We walk through your site and CRM add-on" },
                      { step: "3", text: "You get a monthly number" },
                    ].map((item) => (
                      <div
                        key={item.step}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-background/60 border border-border/60"
                      >
                        <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {item.step}
                        </span>
                        <span className="text-xs text-foreground font-medium">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
