import {
  ArrowRight,
  Bot,
  Code2,
  Layers,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GlowButton } from "../components/GlowButton";
import { MetricTicker } from "../components/MetricTicker";
import { ParticleCanvas } from "../components/ParticleCanvas";
import { TypewriterHeadline } from "../components/TypewriterHeadline";
import { Reveal } from "../Reveal";
import { useTheme } from "../ThemeContext";

const webFeatures = [
  { icon: Bot, title: "AI-Powered Lead Capture", desc: "Intelligent agents qualify and capture leads around the clock, even while you sleep." },
  { icon: Zap, title: "Blazing Performance", desc: "Sub-second load times. We obsess over Core Web Vitals so you rank higher and convert faster." },
  { icon: Code2, title: "Custom-Built, Not Templated", desc: "Every line of code written for your brand. No drag-and-drop compromise." },
  { icon: Shield, title: "Enterprise Security", desc: "SSL, GDPR compliance, and routine security audits baked in from day one." },
  { icon: Layers, title: "Seamless Integrations", desc: "Connect to your CRM, email platform, analytics, and third-party tools with zero friction." },
  { icon: TrendingUp, title: "Conversion-Optimized", desc: "Design decisions backed by data. Every page is built to turn visitors into customers." },
];

export function WebsitePage() {
  const navigate = useNavigate();
  const { dark } = useTheme();
  const gridLineColor = dark ? "rgba(226,237,224,0.14)" : "rgba(30,124,74,0.24)";

  return (
    <div className="pt-16">
      <section className="relative min-h-[93vh] flex flex-col justify-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.28,
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

        <div className="relative max-w-6xl mx-auto px-6 py-28 z-10 w-full">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-primary text-xs font-semibold mb-8 backdrop-blur-sm">
              <Sparkles size={11} />
              AI-integrated web solutions
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1
              className="text-5xl md:text-[5.5rem] font-extrabold text-foreground leading-[1.0] mb-6 tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Websites built to{" "}
              <span className="block mt-1 md:inline">
                <TypewriterHeadline />
              </span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed mb-10">
              Custom, AI-powered websites built for your business. Every visitor tracked, every inquiry captured,
              every lead followed up.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="flex flex-wrap gap-4 mb-14">
              <GlowButton onClick={() => navigate("/contact/")} size="lg">
                Book a free consultation <ArrowRight size={17} />
              </GlowButton>
              <GlowButton onClick={() => navigate("/portfolio/")} variant="outline" size="lg">
                See our work
              </GlowButton>
            </div>
          </Reveal>
          <Reveal delay={280}>
            <div className="flex items-center gap-6">
              <div className="flex -space-x-2.5">
                {["#1e5c35", "#2a7048", "#357d52", "#1a4d2e"].map((c, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 border-background ring-1 ring-primary/20"
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

      <section className="max-w-6xl mx-auto px-6 py-28">
        <Reveal className="text-center mb-16">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-4">What we build</p>
          <h2
            className="text-3xl md:text-5xl font-extrabold text-foreground mb-5 tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Built different.{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
              Built for you.
            </span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg">
            No templates. No shortcuts. Engineered from the ground up.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-4">
          {webFeatures.map((f, i) => (
            <Reveal key={f.title} delay={i * 55}>
              <div
                className="group relative bg-card border border-border rounded-2xl p-7 h-full overflow-hidden transition-all duration-300 hover:-translate-y-1"
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 0 1px rgba(61,184,112,0.2), 0 8px 32px rgba(61,184,112,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <div
                  className="absolute top-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "radial-gradient(circle at top right, rgba(61,184,112,0.12), transparent 70%)" }}
                />
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <f.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2.5 text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-secondary/40 to-secondary/20" />
        <div className="absolute inset-0 border-y border-border" />
        <div className="relative max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              From brief to live in weeks
            </h2>
          </Reveal>
          <div className="relative grid md:grid-cols-4 gap-8">
            <div className="hidden md:block absolute top-6 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            {[
              { n: "01", label: "Discover", desc: "We learn your business, audience, and goals in a focused strategy session." },
              { n: "02", label: "Design", desc: "Pixel-perfect mockups reviewed before a single line of code is written." },
              { n: "03", label: "Build", desc: "Custom development with AI integrations wired in from the start." },
              { n: "04", label: "Launch", desc: "Go live with full QA, SEO setup, and ongoing support." },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 90}>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0"
                      style={{ boxShadow: "0 0 16px rgba(61,184,112,0.1)" }}
                    >
                      <span className="text-primary font-bold text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {s.n}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {s.label}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-28">
        <Reveal>
          <div
            className="relative rounded-3xl overflow-hidden p-12 md:p-16 text-center border border-primary/15"
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
                Free 30-minute consultation. We'll show you exactly what we'd build.
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
