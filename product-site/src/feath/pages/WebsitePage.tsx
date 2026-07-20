import {
  ArrowRight,
  Bot,
  ChevronRight,
  Code2,
  Layers,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AIChatDemo } from "../components/AIChatDemo";
import { FeaturePreviewPanel } from "../components/FeaturePreviewPanel";
import { GlowButton } from "../components/GlowButton";
import { MetricTicker } from "../components/MetricTicker";
import { ParticleCanvas } from "../components/ParticleCanvas";
import { TypewriterHeadline } from "../components/TypewriterHeadline";
import { Reveal } from "../Reveal";
import { useTheme } from "../ThemeContext";

const webFeatures = [
  { icon: Bot, title: "AI Lead Capture", sub: "Capture every inquiry, 24/7", preview: "chat" },
  { icon: Zap, title: "Blazing Performance", sub: "Sub-second load times, guaranteed", preview: "speed" },
  { icon: Code2, title: "Custom-Built", sub: "No templates, ever", preview: "code" },
  { icon: Shield, title: "Enterprise Security", sub: "SSL, GDPR, audits built in", preview: "security" },
  { icon: Layers, title: "Seamless Integrations", sub: "Connect every tool you use", preview: "integrations" },
  { icon: TrendingUp, title: "Conversion-Optimized", sub: "Data-backed design decisions", preview: "conversion" },
];

export function WebsitePage() {
  const navigate = useNavigate();
  const { dark } = useTheme();
  const gridLineColor = dark ? "rgba(226,237,224,0.2)" : "rgba(30,124,74,0.32)";
  const [activeFeature, setActiveFeature] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const switchFeature = (i: number) => {
    setActiveFeature(i);
    setAnimKey((k) => k + 1);
  };

  return (
    <div className="pt-16">
      <section className="relative min-h-[auto] md:min-h-[93vh] flex flex-col justify-center overflow-x-clip overflow-y-visible">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.34,
            backgroundImage:
              `linear-gradient(to right, ${gridLineColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridLineColor} 1px, transparent 1px)`,
            backgroundSize: "42px 42px",
            maskImage: "radial-gradient(ellipse at center, black 45%, transparent 90%)",
          }}
        />
        <ParticleCanvas dark={dark} />
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #3db870 0%, transparent 70%)", filter: "blur(40px)" }}
          />
          <div
            className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full opacity-6"
            style={{ background: "radial-gradient(circle, #3db870 0%, transparent 70%)", filter: "blur(60px)" }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/20 to-transparent pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 md:pt-14 md:pb-28 z-10 w-full -mt-4 md:-mt-12">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-primary text-xs font-semibold mb-4 md:mb-6 backdrop-blur-sm">
              <Sparkles size={11} />
              AI-Integrated business solutions
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1
              className="text-5xl md:text-[5.5rem] font-extrabold text-foreground leading-[1.0] mb-5 tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Websites built to{" "}
              <span className="block mt-1 md:inline">
                <TypewriterHeadline />
              </span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed mb-8">
              Custom, AI-powered websites built for your business. Every visitor tracked, every inquiry captured, every lead
              followed up.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="flex flex-wrap gap-3 md:gap-4 mb-8 md:mb-12">
              <GlowButton onClick={() => navigate("/contact/")} size="lg">
                Book a free consultation <ArrowRight size={17} />
              </GlowButton>
              <GlowButton onClick={() => navigate("/portfolio/")} variant="outline" size="lg">
                See our work
              </GlowButton>
            </div>
          </Reveal>
          <Reveal delay={280}>
            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex -space-x-2.5">
                {["#1e5c35", "#2a7048", "#357d52", "#1a4d2e"].map((c, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-background ring-1 ring-primary/20"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-medium">Trusted by 40+ businesses</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <MetricTicker />

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-28">
        <Reveal className="text-center mb-10 md:mb-16">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-4">What we build</p>
          <h2
            className="text-3xl md:text-5xl font-extrabold text-foreground mb-5 tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Built different.{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Built for you.</span>
          </h2>
        </Reveal>

        <Reveal>
          <div className="grid md:grid-cols-[1fr_1.3fr] gap-6 items-start">
            <div className="space-y-2">
              {webFeatures.map((f, i) => (
                <button
                  key={f.title}
                  type="button"
                  onClick={() => switchFeature(i)}
                  className={`w-full text-left flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-200 ${
                    activeFeature === i ? "border-primary/40 bg-primary/6" : "border-transparent hover:bg-secondary/60"
                  }`}
                  style={
                    activeFeature === i
                      ? { boxShadow: "0 0 0 1px rgba(61,184,112,0.15), 0 4px 20px rgba(61,184,112,0.06)" }
                      : undefined
                  }
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                      activeFeature === i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                    style={activeFeature === i ? { boxShadow: "0 0 14px rgba(61,184,112,0.4)" } : undefined}
                  >
                    <f.icon size={19} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-bold text-sm transition-colors ${activeFeature === i ? "text-foreground" : "text-muted-foreground"}`}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {f.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{f.sub}</div>
                  </div>
                  <ChevronRight
                    size={15}
                    className={`flex-shrink-0 transition-all duration-200 ${activeFeature === i ? "text-primary" : "text-muted-foreground/30"}`}
                  />
                </button>
              ))}
            </div>

            <div className="sticky top-24">
              <div
                className="relative bg-card border border-border rounded-2xl overflow-hidden"
                style={{ height: "380px", boxShadow: "0 0 0 1px rgba(61,184,112,0.08), 0 20px 60px rgba(0,0,0,0.15)" }}
              >
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/50" />
                  </div>
                  <div className="flex-1 mx-3 h-5 bg-secondary rounded-md flex items-center px-2">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      feath.xyz - {webFeatures[activeFeature].title}
                    </span>
                  </div>
                </div>
                <FeaturePreviewPanel key={animKey} type={webFeatures[activeFeature].preview} animKey={animKey} />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <AIChatDemo />

      <section className="relative py-14 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-secondary/40 to-secondary/20" />
        <div className="absolute inset-0 border-y border-border" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              From brief to live in weeks
            </h2>
          </Reveal>
          <div className="relative grid grid-cols-4 gap-2 sm:gap-4 md:gap-8 max-w-5xl mx-auto">
            {[
              { n: "01", label: "Discover", desc: "We learn your business, audience, and goals in a focused strategy session." },
              { n: "02", label: "Design", desc: "Pixel-perfect mockups reviewed before a single line of code is written." },
              { n: "03", label: "Build", desc: "Custom development with AI integrations wired in from the start." },
              { n: "04", label: "Launch", desc: "Go live with full QA, SEO setup, and ongoing support." },
            ].map((s, i, steps) => (
              <Reveal key={s.n} delay={i * 90} className="relative min-w-0">
                {i < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-6 left-[calc(50%+1.5rem)] w-[calc(100%-1rem)] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none"
                  />
                )}
                <div className="relative z-10 text-center">
                  <div className="flex justify-center mb-2 md:mb-4">
                    <div
                      className="w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0"
                      style={{ boxShadow: "0 0 16px rgba(61,184,112,0.1)" }}
                    >
                      <span className="text-primary font-bold text-[11px] md:text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {s.n}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground mb-1 md:mb-2 text-xs sm:text-sm md:text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {s.label}
                  </h3>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground leading-snug md:leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-28">
        <Reveal>
          <div
            className="relative rounded-3xl overflow-hidden p-8 md:p-16 text-center border border-primary/15"
            style={{ background: "linear-gradient(135deg, rgba(61,184,112,0.06) 0%, rgba(61,184,112,0.02) 50%, rgba(61,184,112,0.08) 100%)" }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 opacity-20"
                style={{ background: "radial-gradient(ellipse, #3db870 0%, transparent 70%)", filter: "blur(30px)" }}
              />
            </div>
            <div className="relative">
              <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-4">Get started</p>
              <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Ready to stop losing leads?
              </h2>
              <p className="text-muted-foreground mb-10 max-w-md mx-auto text-lg">
                Free 30-minute consultation. We&apos;ll show you exactly what we&apos;d build.
              </p>
              <GlowButton onClick={() => navigate("/contact/")} size="lg">
                Book free consultation <ArrowRight size={17} />
              </GlowButton>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
