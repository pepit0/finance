import { ArrowRight, BookOpen, Check, Lock, PhoneCall } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { FeathLogoMark } from "../components/FeathLogoMark";
import { GlowButton } from "../components/GlowButton";
import { GlossaryWord } from "../components/GlossaryWord";
import { Reveal } from "../Reveal";
import {
  BeforeAfterStrip,
  CustomerPhraseCards,
  DemoCalloutCards,
  ObjectionFlashcards,
  PainFlowTree,
  PreCallChecklist,
  RolePlayAll,
  SituationCards,
  TalkTrackTabs,
} from "../TrainingInteractive";
import {
  TRAINING_AUTH_KEY,
  TRAINING_PASSWORD,
  callPrepNav,
  crmDepthTags,
  guideNav,
  outcomeCards,
  trainingAnchorLine,
  trainingPillars,
  trainingSections,
} from "../trainingContent";

type TrainingTab = "guide" | "call-prep";

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
            Sales guide
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

const SCROLL_SPY_OFFSET = 160;

export function TrainingPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<TrainingTab>("guide");
  const [activeGuideSection, setActiveGuideSection] = useState(guideNav[0].id);
  const [pendingGuideJump, setPendingGuideJump] = useState<string | null>(null);
  const [pendingCallPrepJump, setPendingCallPrepJump] = useState<string | null>(null);

  useEffect(() => {
    try {
      setUnlocked(sessionStorage.getItem(TRAINING_AUTH_KEY) === "1");
    } catch {
      setUnlocked(false);
    }
    document.title = "Sales guide · Feath";
    const meta = document.querySelector('meta[name="robots"]') ?? document.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex, nofollow");
    if (!meta.parentElement) document.head.appendChild(meta);
  }, []);

  useEffect(() => {
    if (activeTab !== "guide" || !pendingGuideJump) return;
    const id = pendingGuideJump;
    setPendingGuideJump(null);
    setActiveGuideSection(id);
    requestAnimationFrame(() => {
      document.getElementById(`guide-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [activeTab, pendingGuideJump]);

  useEffect(() => {
    if (activeTab !== "call-prep" || !pendingCallPrepJump) return;
    const id = pendingCallPrepJump;
    setPendingCallPrepJump(null);
    requestAnimationFrame(() => {
      document.getElementById(`callprep-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [activeTab, pendingCallPrepJump]);

  useEffect(() => {
    if (!unlocked || activeTab !== "guide") return;

    const markers = guideNav
      .map((item) => ({
        id: item.id,
        el: document.getElementById(`guide-${item.id}`),
      }))
      .filter((marker): marker is { id: string; el: HTMLElement } => marker.el !== null);

    const updateActiveSection = () => {
      let current = guideNav[0].id;
      for (const marker of markers) {
        if (marker.el.getBoundingClientRect().top <= SCROLL_SPY_OFFSET) {
          current = marker.id;
        }
      }
      setActiveGuideSection(current);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [unlocked, activeTab]);

  const switchTab = (tab: TrainingTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const jumpToGuide = (id: string) => {
    if (activeTab !== "guide") {
      setPendingGuideJump(id);
      setActiveTab("guide");
      return;
    }
    setActiveGuideSection(id);
    document.getElementById(`guide-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const jumpToCallPrep = (id: string) => {
    if (activeTab !== "call-prep") {
      setPendingCallPrepJump(id);
      setActiveTab("call-prep");
      return;
    }
    document.getElementById(`callprep-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!unlocked) {
    return <TrainingGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="pt-16 pb-24">
      <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Internal sales guide</p>
              <p className="text-sm text-muted-foreground hidden md:block">{trainingAnchorLine}</p>
            </div>
            <div className="inline-flex rounded-lg border border-border p-1 bg-secondary/30 self-start">
              <button
                type="button"
                onClick={() => switchTab("guide")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                  activeTab === "guide"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen size={14} className={activeTab === "guide" ? "text-primary" : undefined} />
                Reference guide
              </button>
              <button
                type="button"
                onClick={() => switchTab("call-prep")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                  activeTab === "call-prep"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <PhoneCall size={14} className={activeTab === "call-prep" ? "text-primary" : undefined} />
                Call prep
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeTab === "guide" ? (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-3">Reference guide</p>
            <h1
              className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight max-w-3xl"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              What we offer,{" "}
              <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                in plain language.
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl leading-relaxed mb-8">
              Read this like a handbook. Come back anytime you need a refresher on what we sell and how to explain it.
              Green terms have quick definitions on hover.
            </p>
          </Reveal>

          <Reveal delay={40}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
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
                    jumpToGuide(map[pillar.label] ?? "mission");
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
              <div className="lg:sticky lg:top-36 space-y-1 max-h-[calc(100vh-10rem)] overflow-y-auto">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3 px-2">On this page</p>
                {guideNav.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => jumpToGuide(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeGuideSection === item.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </aside>

            <div className="flex-1 space-y-8">
              {trainingSections.map((section, i) => (
                <Reveal key={section.id} delay={i * 30}>
                  <article
                    id={`guide-${section.id}`}
                    className="rounded-2xl border border-border bg-card scroll-mt-36 overflow-hidden"
                  >
                    <div className="p-6 md:p-8 border-b border-border bg-secondary/20">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <section.icon size={20} />
                        </div>
                        <div className="min-w-0">
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
                          <p className="text-muted-foreground mt-2 leading-relaxed text-sm">
                            {section.id === "crm" ? (
                              <>
                                Their <GlossaryWord term="pipeline" />, their branding, calls and texts in one place.
                              </>
                            ) : section.id === "integration" ? (
                              <>
                                Forms, <GlossaryWord term="crm" />, and existing tools share data with no re-typing{" "}
                                <GlossaryWord term="lead" children="leads" />.
                              </>
                            ) : (
                              section.summary
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-5">
                      <BeforeAfterStrip sectionId={section.id} />

                      <ul className="grid sm:grid-cols-1 gap-2">
                        {section.highlights.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                            <Check size={15} className="text-primary shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      <TalkTrackTabs sectionId={section.id} />

                      {section.id === "crm" && (
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
                      )}

                      {section.id === "integration" && (
                        <div className="grid sm:grid-cols-3 gap-3">
                          {[
                            { text: <>Visitor on site</> },
                            { text: <><GlossaryWord term="lead" /> in <GlossaryWord term="crm" /></> },
                            { text: <>Team follows up</> },
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
                <div id="guide-outcomes" className="scroll-mt-36 rounded-2xl border border-border bg-card p-6 md:p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-1">Summary</p>
                  <h2
                    className="text-2xl font-extrabold text-foreground mb-2"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    What the customer gets
                  </h2>
                  <p className="text-sm text-muted-foreground mb-5">
                    The payoff in plain terms. Use these when you need to explain why any of this matters.
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {outcomeCards.map((card) => (
                      <div key={card.title} className="rounded-xl border border-border p-4">
                        <card.icon size={18} className="text-primary mb-2" />
                        <h3 className="font-bold text-foreground mb-1 text-sm">{card.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{card.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      ) : (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">Call prep</p>
            <h1
              className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Before and during a call
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl mb-10">
              Interactive tools for the moment you are on the phone. Switch to Reference guide anytime for the full
              handbook.
            </p>
          </Reveal>

          <div className="flex flex-wrap gap-2 mb-10">
            {callPrepNav.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => jumpToCallPrep(item.id)}
                className="rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="space-y-14">
            <Reveal>
              <div id="callprep-precall" className="scroll-mt-36">
                <PreCallChecklist />
              </div>
            </Reveal>

            <Reveal>
              <div id="callprep-playbook" className="scroll-mt-36 space-y-4">
                <div>
                  <h3
                    className="text-xl font-extrabold text-foreground"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Pick the situation
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Match the customer. Get what to ask, what to recommend, and what to say.
                  </p>
                </div>
                <SituationCards onJump={jumpToGuide} />
              </div>
            </Reveal>

            <Reveal>
              <div id="callprep-pain-flow" className="scroll-mt-36 space-y-4">
                <div>
                  <h3
                    className="text-xl font-extrabold text-foreground"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Pain finder
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Tap through to land on a starting recommendation.</p>
                </div>
                <PainFlowTree onJump={jumpToGuide} />
              </div>
            </Reveal>

            <Reveal>
              <div id="callprep-phrases" className="scroll-mt-36 space-y-4">
                <div>
                  <h3
                    className="text-xl font-extrabold text-foreground"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    What they say vs what they mean
                  </h3>
                </div>
                <CustomerPhraseCards />
              </div>
            </Reveal>

            <Reveal>
              <div id="callprep-demos" className="scroll-mt-36 space-y-4">
                <div>
                  <h3
                    className="text-xl font-extrabold text-foreground"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Demo callouts
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">What to point at, say, and avoid when you share a demo.</p>
                </div>
                <DemoCalloutCards />
              </div>
            </Reveal>

            <Reveal>
              <div id="callprep-practice" className="scroll-mt-36 space-y-4">
                <div>
                  <h3
                    className="text-xl font-extrabold text-foreground"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Practice prompts
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Read these out loud before your next call.</p>
                </div>
                <RolePlayAll />
              </div>
            </Reveal>

            <Reveal>
              <div id="callprep-reference" className="scroll-mt-36 space-y-4">
                <div>
                  <h3
                    className="text-xl font-extrabold text-foreground"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    When you are stuck
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Flip through common objections on the call.</p>
                </div>
                <ObjectionFlashcards />
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </div>
  );
}
