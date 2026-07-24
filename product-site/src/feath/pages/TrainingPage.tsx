import { ArrowRight, Check, ChevronDown, Lock } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { FeathLogoMark } from "../components/FeathLogoMark";
import { GlowButton } from "../components/GlowButton";
import { GlossaryWord } from "../components/GlossaryWord";
import { Reveal } from "../Reveal";
import {
  TRAINING_AUTH_KEY,
  TRAINING_PASSWORD,
  crmDepthTags,
  outcomeCards,
  referenceNotes,
  trainingPillars,
  trainingSections,
} from "../trainingContent";

function TrainingGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (password === TRAINING_PASSWORD) {
      try {
        sessionStorage.setItem(TRAINING_AUTH_KEY, "1");
      } catch {
        /* ignore */
      }
      onUnlock();
      return;
    }
    setError("Wrong password. Ask your team lead.");
  };

  return (
    <div className="pt-16 min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
      <Reveal className="w-full max-w-md">
        <div
          className="rounded-2xl border border-border bg-card p-8 md:p-10 text-center"
          style={{
            background:
              "linear-gradient(160deg, rgba(61,184,112,0.08) 0%, transparent 55%, rgba(61,184,112,0.04) 100%)",
          }}
        >
          <div className="flex justify-center mb-5">
            <FeathLogoMark className="w-12 h-12" />
          </div>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
            <Lock size={20} />
          </div>
          <h1
            className="text-2xl font-extrabold text-foreground mb-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Sales reference
          </h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Internal only. Enter the team password to open the guide.
          </p>
          <form onSubmit={submit} className="space-y-3 text-left">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              autoComplete="current-password"
              className="w-full rounded-lg border border-border bg-input-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              placeholder="Team password"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <GlowButton type="submit" className="w-full justify-center mt-2">
              Open guide <ArrowRight size={15} />
            </GlowButton>
          </form>
        </div>
      </Reveal>
    </div>
  );
}

function ReferenceAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {referenceNotes.map((note, i) => {
        const open = openIndex === i;
        return (
          <div key={note.title} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-secondary/40 transition-colors"
            >
              <span className="font-semibold text-foreground text-sm">
                {note.title.includes("CRM") ? (
                  <>
                    They already have a <GlossaryWord term="crm" />
                  </>
                ) : (
                  note.title
                )}
              </span>
              <ChevronDown size={16} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
              <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                {note.body}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TrainingPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [activeSection, setActiveSection] = useState(trainingSections[0].id);

  useEffect(() => {
    try {
      setUnlocked(sessionStorage.getItem(TRAINING_AUTH_KEY) === "1");
    } catch {
      setUnlocked(false);
    }
    document.title = "Sales reference · Feath";
    const meta = document.querySelector('meta[name="robots"]') ?? document.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex, nofollow");
    if (!meta.parentElement) document.head.appendChild(meta);
  }, []);

  const jumpTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(`training-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!unlocked) {
    return <TrainingGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="pt-16 pb-24">
      <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Internal sales reference</p>
          <p className="text-sm text-muted-foreground">Bookmark this page when you need a refresher before a call.</p>
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20">
        <Reveal>
          <h1
            className="text-4xl md:text-5xl font-extrabold text-foreground mb-5 tracking-tight max-w-3xl"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            What we offer,{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
              in plain language.
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed mb-4">
            We help customers swap outdated, clunky setups for fast, modern systems that work together. Less missed
            leads, less manual work, stronger first impressions. Read through once, then come back whenever you are stuck
            on a call.
          </p>
          <p className="text-sm text-muted-foreground mb-10">
            Some terms are highlighted in green. Hover or tap them for a quick explanation.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
            {trainingPillars.map((pillar) => (
              <button
                key={pillar.label}
                type="button"
                onClick={() => {
                  const map: Record<string, string> = {
                    "Custom websites": "websites",
                    "CRM + comms": "crm",
                    "Custom builds": "custom",
                    Integrations: "integration",
                  };
                  jumpTo(map[pillar.label] ?? "mission");
                }}
                className="rounded-xl border border-border bg-card p-4 text-center hover:border-primary/30 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: `${pillar.color}18`, color: pillar.color }}
                >
                  <pillar.icon size={18} />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {pillar.label === "CRM + comms" ? (
                    <>
                      <GlossaryWord term="crm" /> + comms
                    </>
                  ) : pillar.label === "Integrations" ? (
                    <GlossaryWord term="integration" children="Integrations" />
                  ) : (
                    pillar.label
                  )}
                </p>
              </button>
            ))}
          </div>
        </Reveal>

        <div className="flex flex-col lg:flex-row gap-10">
          <aside className="lg:w-56 shrink-0">
            <div className="lg:sticky lg:top-36 space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 px-2">On this page</p>
              {trainingSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => jumpTo(section.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {section.title}
                </button>
              ))}
              <button
                type="button"
                onClick={() => document.getElementById("training-reference")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                When you are stuck
              </button>
            </div>
          </aside>

          <div className="flex-1 space-y-8">
            {trainingSections.map((section, i) => (
              <Reveal key={section.id} delay={i * 40}>
                <article
                  id={`training-${section.id}`}
                  className="rounded-2xl border border-border bg-card scroll-mt-36"
                  onMouseEnter={() => setActiveSection(section.id)}
                >
                  <div className="p-6 md:p-8 border-b border-border bg-secondary/20 rounded-t-2xl">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <section.icon size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-1">
                          {section.eyebrow}
                        </p>
                        <h2
                          className="text-2xl font-extrabold text-foreground"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          {section.id === "crm" ? (
                            <>
                              Feath <GlossaryWord term="crm" />
                            </>
                          ) : (
                            section.title
                          )}
                        </h2>
                        <p className="text-muted-foreground mt-2 leading-relaxed">
                          {section.id === "crm" ? (
                            <>
                              A <GlossaryWord term="crm" /> they can shape around their{" "}
                              <GlossaryWord term="pipeline" />, their team, and their look. Calling and texting are
                              built in.
                            </>
                          ) : section.id === "integration" ? (
                            <>
                              Website forms, <GlossaryWord term="crm" />, and their existing tools can share data so
                              nobody re-types the same <GlossaryWord term="lead" /> twice.
                            </>
                          ) : (
                            section.summary
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 space-y-5 rounded-b-2xl">
                    <ul className="space-y-2">
                      {section.id === "crm"
                        ? [
                            <>
                              <GlossaryWord term="branding" /> and layout go deep: logo, colors, header, the works
                            </>,
                            <>
                              <GlossaryWord term="pipeline" /> stages match how they actually sell, not a generic
                              funnel
                            </>,
                            <>
                              <GlossaryWord term="permissions" /> control who sees what
                            </>,
                            "Calls and texts live in the same place as customer records",
                          ].map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-foreground">
                              <Check size={15} className="text-primary shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))
                        : section.highlights.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                              <Check size={15} className="text-primary shrink-0 mt-0.5" />
                              <span>
                                {section.id === "integration" && item.startsWith("A form on their site") ? (
                                  <>
                                    A form on their site can drop <GlossaryWord term="lead" children="leads" /> straight
                                    into the <GlossaryWord term="crm" />
                                  </>
                                ) : (
                                  item
                                )}
                              </span>
                            </li>
                          ))}
                    </ul>
                    <p className="text-sm text-muted-foreground leading-relaxed">{section.detail}</p>

                    {section.id === "crm" && (
                      <div className="pt-2">
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
                          What we can customize
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {crmDepthTags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-secondary text-foreground border border-border"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.id === "integration" && (
                      <div className="grid sm:grid-cols-3 gap-3 pt-2">
                        {[
                          { text: <>Visitor on the site</> },
                          { text: <><GlossaryWord term="lead" /> captured</> },
                          { text: <>Team follows up in <GlossaryWord term="crm" /></> },
                        ].map((step, idx) => (
                          <div
                            key={idx}
                            className="relative rounded-xl border border-border bg-secondary/30 p-4 text-center"
                          >
                            <div className="text-xs font-bold text-primary mb-1">{idx + 1}</div>
                            <div className="text-sm font-semibold text-foreground">{step.text}</div>
                            {idx < 2 && (
                              <ArrowRight
                                size={14}
                                className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 text-primary z-10"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              </Reveal>
            ))}

            <Reveal>
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <h2
                  className="text-2xl font-extrabold text-foreground mb-2"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  What the customer gets out of it
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Keep these in your back pocket when you need to explain the payoff.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {outcomeCards.map((card) => (
                    <div key={card.title} className="rounded-xl border border-border p-4">
                      <card.icon size={18} className="text-primary mb-2" />
                      <h3 className="font-bold text-foreground mb-1">{card.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{card.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div id="training-reference" className="scroll-mt-36">
                <h2
                  className="text-2xl font-extrabold text-foreground mb-2"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  When you are stuck
                </h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Common situations on calls. Expand any of these for a quick reminder of how to handle it.
                </p>
                <ReferenceAccordion />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
