import { ArrowRight, Bot, Code2, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import danielImage from "../../assets/daniel.jpg";
import modiImage from "../../assets/modi.png";
import sahandImage from "../../assets/sahand.png";
import { AnimatedCount } from "../components/AnimatedCount";
import { FounderCard, type FounderSlot } from "../components/FounderCard";
import { GlowButton } from "../components/GlowButton";
import { Reveal } from "../Reveal";

const founders: FounderSlot[] = [
  { name: "Daniel Sharifian", role: "Co-founder & CEO", img: danielImage },
  { name: "Modi Jaridly", role: "Co-founder & CTO", img: modiImage },
  { name: "Sahand Abdi", role: "Co-founder & CFO", img: sahandImage },
];

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="pt-16">
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <Reveal>
            <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-4">About us</p>
            <h1
              className="text-4xl md:text-6xl font-extrabold text-foreground mb-6 leading-tight tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <span className="whitespace-nowrap">We build the digital</span>
              <br />
              <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                infrastructure you deserve.
              </span>
            </h1>
            <p className="text-muted-foreground leading-relaxed text-lg mb-8">
              Feath was founded by a team of developers and designers who got tired of watching great businesses lose leads
              to slow, generic websites. We set out to build something better.
            </p>
            <GlowButton onClick={() => navigate("/contact/")}>
              Work with us <ArrowRight size={15} />
            </GlowButton>
          </Reveal>

          <Reveal delay={120}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { val: 40, suffix: "+", label: "Clients served" },
                { val: 3, suffix: " yrs", label: "Building" },
                { val: 100, suffix: "%", label: "Custom code" },
                { val: 24, suffix: "/7", label: "AI uptime" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="group p-6 bg-card border border-border rounded-2xl hover:border-primary/30 transition-all duration-300 text-center"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(61,184,112,0.07)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  <div className="text-4xl font-extrabold text-primary mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <AnimatedCount target={s.val} suffix={s.suffix} />
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal className="mb-24">
          <h2 className="text-2xl font-extrabold text-foreground mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            How we work
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { label: "No templates.", body: "Every line of code we write is unique to your brand, your goals, and your customers.", icon: Code2 },
              { label: "AI-first.", body: "We don't bolt on AI after the fact. It's baked into every website and CRM workflow we build.", icon: Bot },
              { label: "Long-term partners.", body: "We don't disappear after launch. Your growth is our roadmap.", icon: Users },
            ].map((v, i) => (
              <Reveal key={v.label} delay={i * 60}>
                <div
                  className="p-7 bg-card border border-border rounded-2xl group hover:border-primary/25 transition-all duration-300"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 24px rgba(61,184,112,0.07)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <v.icon size={19} className="text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {v.label}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <Reveal className="mb-10">
          <h2 className="text-2xl font-extrabold text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            The founders
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-24">
          {founders.map((f, i) => (
            <Reveal key={i} delay={i * 70}>
              <FounderCard founder={f} />
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
