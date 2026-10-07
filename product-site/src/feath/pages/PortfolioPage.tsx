import { ArrowRight, ExternalLink, LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import burdPortfolioShot from "../../assets/burd-portfolio.png";
import carterLewisPortfolioShot from "../../assets/carterlewis-portfolio.png";
import imitationStarPortfolioShot from "../../assets/imitation-star-portfolio.png";
import kamrPortfolioShot from "../../assets/kamr-portfolio.png";
import meysMediaPortfolioShot from "../../assets/meysmedia-portfolio.png";
import wheelChatPortfolioShot from "../../assets/wheel-chat-portfolio.png";
import { CRMMockupPreview } from "../components/CRMMockupPreview";
import { FinanceDecisionMockupPreview } from "../components/FinanceDecisionMockupPreview";
import { GlowButton } from "../components/GlowButton";
import { Reveal } from "../Reveal";

const PORTFOLIO = [
  {
    name: "Feath CRM",
    category: "In-house Product",
    year: "2026",
    desc: "Our own CRM built from the ground up with native website integration, AI lead scoring, and real-time pipeline visibility for teams of any size.",
    tags: ["CRM", "AI", "Automation"],
    url: null,
    urlLabel: null,
    accent: "#3db870",
    screenshotUrl: null,
    preview: "crm" as const,
  },
  {
    name: "Finance Decision Engine",
    category: "In-house Product",
    year: "2026",
    desc: "A subprime lender decision tool that helps finance managers choose which banks to submit customers to based on their credit bureau situation. Guideline matching, approval calculators, and booking guides in one place.",
    tags: ["Finance", "Decision Engine", "Lenders"],
    url: null,
    urlLabel: null,
    accent: "#38bdf8",
    screenshotUrl: null,
    preview: "finance" as const,
  },
  {
    name: "Wheel Chat",
    category: "In-house Product",
    year: "2026",
    desc: "An AI BDC agent for car dealerships that answers every call and text in seconds, re-engages old leads sitting in the CRM, and books appointments while your team sleeps.",
    tags: ["AI", "Automotive", "SMS"],
    url: "https://wheel-chat.com",
    urlLabel: "wheel-chat.com",
    accent: "#a78bfa",
    screenshotUrl: wheelChatPortfolioShot,
    preview: "image" as const,
  },
  {
    name: "Kamr",
    category: "Consumer App",
    year: "2026",
    desc: "A gathering app for any occasion. Create an event in seconds, invite guests by QR code, link, or AirDrop, and watch the guest list update live. Guests do not need to download anything.",
    tags: ["Events", "Mobile Web", "Guest Invites"],
    url: "https://kamr.app",
    urlLabel: "kamr.app",
    accent: "#7a5c3a",
    screenshotUrl: kamrPortfolioShot,
    preview: "image" as const,
  },
  {
    name: "Burd",
    category: "Mobile App",
    year: "2026",
    desc: "A nature-forward bird watching community app with field journal, species guide, live sighting feed, and an editorial UI built for enthusiasts. Live on the App Store.",
    tags: ["App Store", "iOS", "Community"],
    url: "https://burdapp.com",
    urlLabel: "burdapp.com",
    accent: "#5aad7c",
    screenshotUrl: burdPortfolioShot,
    preview: "image" as const,
  },
  {
    name: "Imitation Star",
    category: "Game",
    year: "2026",
    desc: "A voice dubbing game where you record movie scenes your own way. Play it straight, or swing it for laughs, then post your takes for other players to rate. No AI judges here. Just people voting.",
    tags: ["Game", "Voice Dubbing", "Community"],
    url: "https://imitation.site",
    urlLabel: "imitation.site",
    accent: "#ff5252",
    screenshotUrl: imitationStarPortfolioShot,
    preview: "image" as const,
  },
  {
    name: "Meys Media",
    category: "Photography",
    year: "2026",
    desc: "A portfolio and enquiry site for a Vancouver photographer and photo/video editor. Brand, product, and portrait work, with graphic design and commercial retouching, all aimed at turning visual work into booked clients.",
    tags: ["Photography", "Portfolio", "Branding"],
    url: "https://meysmedia.pics",
    urlLabel: "meysmedia.pics",
    accent: "#c76f95",
    screenshotUrl: meysMediaPortfolioShot,
    preview: "image" as const,
  },
  {
    name: "Carter Lewis Realty",
    category: "Real Estate",
    year: "2026",
    desc: "A Phoenix multifamily advisory site for a commercial real estate professional. Market insights, off-market opportunities, and a bi-weekly investor newsletter, built to earn trust and turn relationships into deals.",
    tags: ["Real Estate", "Website", "Newsletter"],
    url: null,
    urlLabel: null,
    accent: "#c9a227",
    screenshotUrl: carterLewisPortfolioShot,
    preview: "image" as const,
  },
  {
    name: "Temptation Motorsports",
    category: "Automotive",
    year: "2026",
    desc: "High-performance brand site for a motorsports dealership that's bold, fast, and engineered to drive leads directly into a custom sales pipeline.",
    tags: ["Website", "Lead Gen", "CRM"],
    url: "https://temptmotorsports.com",
    urlLabel: "temptmotorsports.com",
    accent: "#e06832",
    screenshotUrl: "https://image.thum.io/get/width/1200/crop/750/https://temptmotorsports.com",
    preview: "image" as const,
  },
];

export function PortfolioPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "grid">("list");

  return (
    <div className="pt-16">
      <section className="max-w-6xl mx-auto px-6 py-20">
        <Reveal className="mb-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-4">Our work</p>
              <h1
                className="text-4xl md:text-6xl font-extrabold text-foreground mb-5 tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Built with{" "}
                <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">intention.</span>
              </h1>
              <p className="text-muted-foreground max-w-xl text-lg">Check out our projects. Every aspect designed to your liking.</p>
            </div>

            <div
              className="flex items-center gap-1 p-1 rounded-lg border border-border bg-secondary/40"
              role="group"
              aria-label="Portfolio view"
            >
              <button
                type="button"
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List size={14} />
                List
              </button>
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-pressed={view === "grid"}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  view === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid size={14} />
                Grid
              </button>
            </div>
          </div>
        </Reveal>

        <div className={view === "list" ? "space-y-8" : "grid gap-6 sm:grid-cols-2"}>
          {PORTFOLIO.map((p, i) => (
            <Reveal key={p.name} delay={i * 80} className={view === "grid" ? "h-full" : undefined}>
              <div
                className={`group bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 ${
                  view === "grid" ? "h-full flex flex-col" : ""
                }`}
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
                <div className={view === "list" ? "grid md:grid-cols-[1.2fr_1fr] min-h-[300px]" : "flex flex-col flex-1"}>
                  <div className={`relative overflow-hidden bg-secondary/50 ${view === "list" ? "min-h-[220px] md:min-h-0" : "aspect-[16/10]"}`}>
                    {p.preview === "crm" ? (
                      <CRMMockupPreview />
                    ) : p.preview === "finance" ? (
                      <FinanceDecisionMockupPreview />
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

                  <div className={view === "list" ? "p-8 md:p-10 flex flex-col justify-center" : "p-6 flex flex-col flex-1"}>
                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-md"
                        style={{ backgroundColor: `${p.accent}18`, color: p.accent }}
                      >
                        {p.category}
                      </span>
                      <span className="text-xs text-muted-foreground">{p.year}</span>
                    </div>
                    <h2 className={`font-extrabold text-foreground mb-3 ${view === "list" ? "text-2xl md:text-3xl" : "text-xl"}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
            style={{ background: "linear-gradient(135deg, rgba(61,184,112,0.05) 0%, transparent 60%, rgba(61,184,112,0.03) 100%)" }}
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
