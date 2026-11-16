import { ArrowRight, LayoutGrid, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ConsoleSection } from "../components/ConsoleSection";
import { GlowButton } from "../components/GlowButton";
import { ApertureLogo, FacetLogo, HelixLogo, PrismLogo } from "../components/PartnerLogos";
import { ParticleCanvas } from "../components/ParticleCanvas";
import { TypewriterHeadline } from "../components/TypewriterHeadline";
import { Reveal } from "../Reveal";
import { useTheme } from "../ThemeContext";

export function WebsitePage() {
  const navigate = useNavigate();
  const { dark } = useTheme();
  const gridLineColor = dark ? "rgba(226,237,224,0.17)" : "rgba(30,124,74,0.45)";

  return (
    <div className="pt-16">
      <section className="relative min-h-[auto] md:min-h-[93vh] flex flex-col justify-center overflow-x-clip overflow-y-visible">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: dark ? 0.4 : 0.55,
            backgroundImage:
              `linear-gradient(to right, ${gridLineColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridLineColor} 1px, transparent 1px)`,
            backgroundSize: "42px 42px",
            maskImage: "radial-gradient(ellipse at center, black 45%, transparent 90%)",
          }}
        />
        <ParticleCanvas dark={dark} />
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full"
            style={{ opacity: dark ? 0.06 : 0.1, background: "radial-gradient(circle, #3db870 0%, transparent 70%)", filter: "blur(40px)" }}
          />
          <div
            className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full"
            style={{ opacity: dark ? 0.04 : 0.06, background: "radial-gradient(circle, #3db870 0%, transparent 70%)", filter: "blur(60px)" }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/20 to-transparent pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 md:pt-14 md:pb-28 z-10 w-full -mt-4 md:-mt-12">
          <Reveal>
            <div className="inline-flex items-center gap-2.5 rounded-lg border border-border bg-secondary/40 py-1 pl-1 pr-3.5 mb-4 md:mb-6 backdrop-blur-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/12 text-primary">
                <LayoutGrid size={13} strokeWidth={2.25} />
              </span>
              <span className="text-xs font-medium tracking-wide text-foreground/80">
                Independent Software Studio
              </span>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1
              className="text-5xl md:text-[5.5rem] font-extrabold text-foreground leading-[1.0] mb-5 tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              We love making{" "}
              <span className="block mt-1 md:inline">
                <TypewriterHeadline />
              </span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed mb-8">
              We build mobile apps, web tools & programs, engineered to solve real problems.
            </p>
          </Reveal>
          <Reveal delay={220}>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-8 md:mb-12">
              <GlowButton onClick={() => navigate("/contact/")} size="lg">
                Connect with us <ArrowRight size={17} />
              </GlowButton>
              <GlowButton onClick={() => navigate("/products/")} variant="outline" size="lg">
                See our work
              </GlowButton>
            </div>
          </Reveal>
          <Reveal delay={280}>
            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex -space-x-2.5">
                {[
                  { name: "Aperture", Logo: ApertureLogo },
                  { name: "Prism", Logo: PrismLogo },
                  { name: "Facet", Logo: FacetLogo },
                  { name: "Helix", Logo: HelixLogo },
                ].map(({ name, Logo }) => (
                  <span
                    key={name}
                    title={name}
                    aria-label={name}
                    className="flex w-8 h-8 md:w-9 md:h-9 items-center justify-center rounded-full border-2 border-background bg-card shadow-sm ring-1 ring-border"
                  >
                    <Logo className="w-[18px] h-[18px] text-foreground" />
                  </span>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-medium">Check out our products</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <ConsoleSection />
    </div>
  );
}
