import { ArrowRight, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CRMMockupPreview } from "../components/CRMMockupPreview";
import { GlowButton } from "../components/GlowButton";
import { Reveal } from "../Reveal";

const PORTFOLIO = [
  {
    name: "Feath CRM",
    category: "In-house Product",
    year: "2025",
    desc: "Our own CRM built from the ground up with native website integration, AI lead scoring, and real-time pipeline visibility for teams of any size.",
    tags: ["CRM", "AI", "Automation"],
    url: null,
    urlLabel: null,
    accent: "#3db870",
    screenshotUrl: null,
    isCRM: true,
  },
  {
    name: "Burd",
    category: "Consumer App",
    year: "2024",
    desc: "A nature-forward bird watching community app with field journal, species guide, live sighting feed, and an editorial UI built for enthusiasts.",
    tags: ["Mobile Web", "Community", "Maps"],
    url: "https://burdapp.com",
    urlLabel: "burdapp.com",
    accent: "#5aad7c",
    screenshotUrl: "https://image.thum.io/get/width/1200/crop/750/https://burdapp.com",
    isCRM: false,
  },
  {
    name: "Temptation Motorsports",
    category: "Automotive",
    year: "2024",
    desc: "High-performance brand site for a motorsports dealership that's bold, fast, and engineered to drive leads directly into a custom sales pipeline.",
    tags: ["Website", "Lead Gen", "CRM"],
    url: "https://temptmotorsports.com",
    urlLabel: "temptmotorsports.com",
    accent: "#e06832",
    screenshotUrl: "https://image.thum.io/get/width/1200/crop/750/https://temptmotorsports.com",
    isCRM: false,
  },
];

export function PortfolioPage() {
  const navigate = useNavigate();

  return (
    <div className="pt-16">
      <section className="max-w-6xl mx-auto px-6 py-20">
        <Reveal className="mb-16">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-4">Our work</p>
          <h1
            className="text-4xl md:text-6xl font-extrabold text-foreground mb-5 tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Built with{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">intention.</span>
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg">Three projects. Each one a collaboration built to last.</p>
        </Reveal>

        <div className="space-y-8">
          {PORTFOLIO.map((p, i) => (
            <Reveal key={p.name} delay={i * 80}>
              <div
                className="group bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300"
                style={{ transformStyle: "preserve-3d", willChange: "transform" }}
                onMouseMove={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const x = (e.clientX - r.left) / r.width - 0.5;
                  const y = (e.clientY - r.top) / r.height - 0.5;
                  e.currentTarget.style.transform = `perspective(900px) rotateX(${-y * 4}deg) rotateY(${x * 5}deg) translateZ(2px)`;
                  e.currentTarget.style.boxShadow = `${-x * 12}px ${-y * 12}px 40px ${p.accent}15, 0 0 0 1px ${p.accent}25`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <div className="grid md:grid-cols-[1.2fr_1fr] min-h-[300px]">
                  <div className="relative overflow-hidden bg-secondary/50 min-h-[220px] md:min-h-0">
                    {p.isCRM ? (
                      <CRMMockupPreview />
                    ) : (
                      <>
                        <img
                          src={p.screenshotUrl!}
                          alt={`${p.name} website screenshot`}
                          className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-background/0 to-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </>
                    )}
                    <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: p.accent }} />
                  </div>

                  <div className="p-8 md:p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-md"
                        style={{ backgroundColor: `${p.accent}18`, color: p.accent }}
                      >
                        {p.category}
                      </span>
                      <span className="text-xs text-muted-foreground">{p.year}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {p.name}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-5 text-sm">{p.desc}</p>
                    <div className="flex flex-wrap gap-2 mb-5">
                      {p.tags.map((t) => (
                        <span key={t} className="px-2.5 py-1 rounded-md text-xs font-semibold bg-secondary text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors group/link w-fit"
                        style={{ color: p.accent }}
                      >
                        <span className="underline underline-offset-2 decoration-transparent group-hover/link:decoration-current transition-all">
                          {p.urlLabel}
                        </span>
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-16">
          <div
            className="relative rounded-2xl overflow-hidden p-10 border border-primary/15 text-center"
            style={{ background: "linear-gradient(135deg, rgba(61,184,112,0.06) 0%, transparent 60%, rgba(61,184,112,0.04) 100%)" }}
          >
            <h3 className="font-extrabold text-foreground mb-2 text-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Want to see your project here?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">Let's talk about what we can build together.</p>
            <GlowButton onClick={() => navigate("/contact/")}>
              Start a project <ArrowRight size={15} />
            </GlowButton>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
