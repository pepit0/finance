import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  ExternalLink,
  FlipHorizontal2,
  MessageCircle,
  RotateCcw,
  Shuffle,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { GlossaryWord } from "./components/GlossaryWord";
import {
  TRAINING_PRECALL_KEY,
  beforeAfterBySection,
  customerPhrases,
  customerScenarios,
  demoCallouts,
  painFlowNodes,
  preCallChecklist,
  referenceNotes,
  rolePlayPrompts,
  talkTracks,
  trainingSections,
  type CustomerScenario,
} from "./trainingContent";

type JumpFn = (id: string) => void;

export function PreCallChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(TRAINING_PRECALL_KEY);
      if (raw) setChecked(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        sessionStorage.setItem(TRAINING_PRECALL_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const doneCount = preCallChecklist.filter((item) => checked[item.id]).length;

  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5 md:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-1">Before your call</p>
          <p className="text-sm text-muted-foreground">60-second prep. Tap each when you are ready.</p>
        </div>
        <span className="text-xs font-bold text-primary shrink-0 px-2.5 py-1 rounded-full bg-primary/10">
          {doneCount}/{preCallChecklist.length}
        </span>
      </div>
      <div className="space-y-2">
        {preCallChecklist.map((item) => {
          const on = checked[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className={`w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                on ? "border-primary/40 bg-primary/10" : "border-border bg-card hover:bg-secondary/40"
              }`}
            >
              <span
                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                  on ? "bg-primary border-primary text-primary-foreground" : "border-border"
                }`}
              >
                {on && <Check size={12} />}
              </span>
              <span className={`text-sm ${on ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SituationCards({ onJump }: { onJump: JumpFn }) {
  const [active, setActive] = useState<string | null>(customerScenarios[0].id);
  const selected = customerScenarios.find((s) => s.id === active);

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {customerScenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            onClick={() => setActive(scenario.id)}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              active === scenario.id
                ? "border-primary/40 bg-primary/10"
                : "border-border bg-card hover:border-primary/20 hover:bg-secondary/30"
            }`}
          >
            <p className="text-sm font-semibold text-foreground">{scenario.label}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{scenario.pain}</p>
          </button>
        ))}
      </div>
      {selected && <ScenarioDetail scenario={selected} onJump={onJump} />}
    </div>
  );
}

function ScenarioDetail({ scenario, onJump }: { scenario: CustomerScenario; onJump: JumpFn }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-secondary/30 border border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Ask first</p>
          <p className="text-sm text-foreground">{scenario.askFirst}</p>
        </div>
        <div className="rounded-xl bg-secondary/30 border border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Recommend</p>
          <div className="flex flex-wrap gap-2">
            {scenario.recommend.map((tag) => (
              <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Say this</p>
        <p className="text-sm text-foreground leading-relaxed">{scenario.sayThis}</p>
      </div>
      <div className="rounded-xl border border-border p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Avoid</p>
        <p className="text-sm text-muted-foreground">{scenario.avoid}</p>
      </div>
      <button
        type="button"
        onClick={() => onJump(scenario.jumpTo)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        Jump to full section <ChevronRight size={14} />
      </button>
    </div>
  );
}

export function PainFlowTree({ onJump }: { onJump: JumpFn }) {
  const [nodeId, setNodeId] = useState("start");
  const [history, setHistory] = useState<string[]>([]);
  const node = painFlowNodes[nodeId];

  const choose = (next: string) => {
    setHistory((h) => [...h, nodeId]);
    setNodeId(next);
  };

  const reset = () => {
    setNodeId("start");
    setHistory([]);
  };

  const back = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setNodeId(prev);
  };

  if (node.result) {
    const sectionMap: Record<string, string> = {
      "Custom website": "websites",
      "CRM + comms": "crm",
      Integrations: "integration",
      "Custom builds": "custom",
    };
    const firstJump = sectionMap[node.result.recommend[0]] ?? "mission";

    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 md:p-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Suggested path</p>
        <h3 className="text-xl font-extrabold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {node.result.title}
        </h3>
        <p className="text-sm text-muted-foreground">{node.result.summary}</p>
        <div className="flex flex-wrap gap-2">
          {node.result.recommend.map((tag) => (
            <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-card border border-border text-foreground">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={() => onJump(firstJump)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
          >
            Go to section <ArrowRight size={14} />
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <RotateCcw size={14} /> Start over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-4">
      {history.length > 0 && (
        <button type="button" onClick={back} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft size={12} /> Back
        </button>
      )}
      <p className="text-lg font-semibold text-foreground leading-snug">{node.question}</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {node.yes && (
          <button
            type="button"
            onClick={() => choose(node.yes!)}
            className="rounded-xl border border-border bg-secondary/30 px-4 py-4 text-left text-sm font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors"
          >
            {node.yesLabel ?? "Yes"}
          </button>
        )}
        {node.no && (
          <button
            type="button"
            onClick={() => choose(node.no!)}
            className="rounded-xl border border-border bg-secondary/30 px-4 py-4 text-left text-sm font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors"
          >
            {node.noLabel ?? "No"}
          </button>
        )}
      </div>
    </div>
  );
}

export function CustomerPhraseCards() {
  const [open, setOpen] = useState<string | null>(customerPhrases[0].phrase);

  return (
    <div className="space-y-2">
      {customerPhrases.map((item) => {
        const expanded = open === item.phrase;
        return (
          <button
            key={item.phrase}
            type="button"
            onClick={() => setOpen(expanded ? null : item.phrase)}
            className={`w-full rounded-xl border text-left transition-colors ${
              expanded ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:bg-secondary/30"
            }`}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm font-semibold text-foreground">&ldquo;{item.phrase}&rdquo;</span>
              <ChevronRight size={16} className={`shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
            </div>
            {expanded && (
              <div className="px-4 pb-4 grid sm:grid-cols-2 gap-3 border-t border-border pt-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Usually means</p>
                  <p className="text-sm text-foreground">{item.means}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Often sell</p>
                  <p className="text-sm text-foreground">{item.sell}</p>
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function BeforeAfterStrip({ sectionId }: { sectionId: string }) {
  const data = beforeAfterBySection[sectionId];
  const [showAfter, setShowAfter] = useState(false);
  if (!data) return null;

  if (sectionId === "philosophy") {
    return (
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-destructive/35 bg-destructive/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-destructive/20 bg-destructive/10">
            <p className="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-1.5">
              <X size={14} className="shrink-0" />
              {data.beforeLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 p-4">
            {data.beforeSteps.map((step, i) => (
              <span key={step} className="inline-flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-destructive/25 bg-destructive/10 text-destructive line-through decoration-destructive/60">
                  {step}
                </span>
                {i < data.beforeSteps.length - 1 && <ArrowRight size={12} className="text-destructive/50 shrink-0" />}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-primary/35 bg-primary/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-primary/20 bg-primary/10">
            <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Check size={14} className="shrink-0" />
              {data.afterLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 p-4">
            {data.afterSteps.map((step, i) => (
              <span key={step} className="inline-flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-primary/30 bg-primary/10 text-foreground">
                  {step}
                </span>
                {i < data.afterSteps.length - 1 && <ArrowRight size={12} className="text-primary shrink-0" />}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const steps = showAfter ? data.afterSteps : data.beforeSteps;
  const label = showAfter ? data.afterLabel : data.beforeLabel;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-secondary/30 border-b border-border">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <button
          type="button"
          onClick={() => setShowAfter((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <FlipHorizontal2 size={13} />
          {showAfter ? "Show before" : "Show after"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 p-4">
        {steps.map((step, i) => (
          <span key={step} className="inline-flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                showAfter ? "border-primary/30 bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground"
              }`}
            >
              {step}
            </span>
            {i < steps.length - 1 && <ArrowRight size={12} className="text-primary shrink-0" />}
          </span>
        ))}
      </div>
    </div>
  );
}

type TalkTab = "say" | "why" | "ask";

export function TalkTrackTabs({ sectionId }: { sectionId: string }) {
  const track = talkTracks[sectionId];
  const [tab, setTab] = useState<TalkTab>("say");
  if (!track) return null;

  const tabs: { id: TalkTab; label: string }[] = [
    { id: "say", label: "Say this" },
    { id: "why", label: "Why it works" },
    { id: "ask", label: "Ask next" },
  ];

  const content = tab === "say" ? track.say : tab === "why" ? track.why : track.askNext;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 px-3 py-2.5 text-xs font-semibold transition-colors ${
              tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="p-4 text-sm text-foreground leading-relaxed">{content}</p>
    </div>
  );
}

export function RolePlayBlock({ sectionId }: { sectionId: string }) {
  const data = rolePlayPrompts[sectionId];
  const [open, setOpen] = useState(false);
  if (!data) return null;

  return (
    <div className="rounded-xl border border-dashed border-border bg-secondary/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary/40 transition-colors"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <MessageCircle size={16} className="text-primary" />
          Read out loud before your next call
        </span>
        <ChevronRight size={16} className={`text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
          <p className="text-sm font-medium text-foreground italic">&ldquo;{data.prompt}&rdquo;</p>
          <ul className="space-y-1.5">
            {data.followUps.map((q) => (
              <li key={q} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary font-bold">→</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function RolePlayAll() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {trainingSections.map((section) => {
        const data = rolePlayPrompts[section.id];
        if (!data) return null;
        const open = openId === section.id;
        return (
          <div key={section.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : section.id)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary/40 transition-colors"
            >
              <span className="text-sm font-semibold text-foreground">{section.title}</span>
              <ChevronRight size={16} className={`text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
            </button>
            {open && (
              <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                <p className="text-sm font-medium text-foreground italic">&ldquo;{data.prompt}&rdquo;</p>
                <ul className="space-y-1.5">
                  {data.followUps.map((q) => (
                    <li key={q} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary font-bold">→</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DemoCalloutCards() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {demoCallouts.map((demo) => (
        <div key={demo.title} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-foreground text-sm">{demo.title}</h3>
            <a
              href={demo.url}
              target={demo.external ? "_blank" : undefined}
              rel={demo.external ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
            >
              Open {demo.external && <ExternalLink size={12} />}
            </a>
          </div>
          <div className="space-y-2 text-xs">
            <div className="rounded-lg bg-secondary/40 px-3 py-2">
              <span className="font-bold text-muted-foreground uppercase tracking-wider">Point at </span>
              <span className="text-foreground">{demo.pointAt}</span>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/15 px-3 py-2">
              <span className="font-bold text-primary uppercase tracking-wider">Say </span>
              <span className="text-foreground">{demo.say}</span>
            </div>
            <div className="rounded-lg bg-secondary/40 px-3 py-2">
              <span className="font-bold text-muted-foreground uppercase tracking-wider">Avoid </span>
              <span className="text-muted-foreground">{demo.avoid}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ObjectionFlashcards() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const note = referenceNotes[index];

  const next = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % referenceNotes.length);
  };

  const shuffle = () => {
    setFlipped(false);
    setIndex(Math.floor(Math.random() * referenceNotes.length));
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="w-full min-h-[200px] rounded-2xl border border-border bg-card p-6 text-left hover:border-primary/30 transition-colors perspective-1000"
      >
        {!flipped ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Objection</p>
            <p className="text-lg font-semibold text-foreground">
              {note.title.includes("CRM") ? (
                <>
                  They already have a <GlossaryWord term="crm" />
                </>
              ) : (
                note.title
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-6">Tap to flip</p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Your move</p>
            <p className="text-sm text-foreground leading-relaxed mb-4">{note.body}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Ask next</p>
            <p className="text-sm text-foreground">{note.followUp}</p>
          </div>
        )}
      </button>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {index + 1} of {referenceNotes.length}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={shuffle}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <Shuffle size={13} /> Shuffle
          </button>
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold"
          >
            Next <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
