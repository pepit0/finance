import { Bot, Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Reveal } from "../Reveal";

const CHAT_SCRIPT = [
  { role: "bot" as const, text: "Hi! I'm Feath AI 👋 How can I help you today?" },
  { role: "user" as const, text: "I need a website for my dental practice." },
  { role: "bot" as const, text: "Great! A few quick questions: how many locations do you have?" },
  { role: "user" as const, text: "Just one, in downtown Chicago." },
  { role: "bot" as const, text: "Got it. Do you want online booking built in?" },
  { role: "user" as const, text: "Yes, definitely." },
  { role: "bot" as const, text: "Perfect. I've captured your info ✓. A Feath team member will reach out shortly to get started!" },
];

export function AIChatDemo() {
  const [messages, setMessages] = useState<typeof CHAT_SCRIPT>([]);
  const [typing, setTyping] = useState(false);
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const container = el.closest(".overflow-y-auto");
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, typing]);

  const advance = useCallback(() => {
    if (step >= CHAT_SCRIPT.length) return;
    const msg = CHAT_SCRIPT[step];
    if (msg.role === "bot") {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMessages((m) => [...m, msg]);
        setStep((s) => s + 1);
      }, 1200);
    } else {
      setMessages((m) => [...m, msg]);
      setStep((s) => s + 1);
    }
  }, [step]);

  useEffect(() => {
    if (!started) return;
    if (step === 0 || (step < CHAT_SCRIPT.length && CHAT_SCRIPT[step - 1]?.role === "user")) {
      const t = setTimeout(advance, step === 0 ? 400 : 600);
      return () => clearTimeout(t);
    }
  }, [started, step, advance]);

  const done = step >= CHAT_SCRIPT.length && !typing;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-14 md:pb-20">
      <Reveal>
        <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
          <div>
            <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-4">Live demo</p>
            <h2
              className="text-3xl md:text-4xl font-extrabold text-foreground mb-5 leading-tight tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              See the AI in action.
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Every Feath website comes with an AI chat agent that qualifies leads, answers questions, and captures contact
              info, automatically logged into your CRM.
            </p>
            <div className="space-y-3">
              {[
                "Responds in under 1 second",
                "Qualifies leads before they reach your team",
                "Works 24/7, never misses a message",
                "Auto-creates CRM records on every chat",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-foreground">
                  <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
                    <Check size={10} className="text-primary" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div
              className="absolute -inset-3 rounded-3xl opacity-15 pointer-events-none"
              style={{ background: "radial-gradient(ellipse, #3db870 0%, transparent 70%)", filter: "blur(25px)" }}
            />
            <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Feath AI
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Online
                  </div>
                </div>
                <div className="ml-auto text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">Your website</div>
              </div>

              <div className="h-64 overflow-y-auto p-4 space-y-3 scroll-smooth" style={{ scrollbarWidth: "none" }}>
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    style={{ animation: "fadeUp 0.3s ease both" }}
                  >
                    <div
                      className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed font-medium ${
                        m.role === "bot"
                          ? i === messages.length - 1 && done
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground"
                          : "bg-foreground/10 text-foreground border border-border"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-start" style={{ animation: "fadeUp 0.3s ease both" }}>
                    <div className="bg-secondary px-4 py-3 rounded-2xl flex gap-1.5 items-center">
                      {[0, 150, 300].map((d) => (
                        <span
                          key={d}
                          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
                          style={{ animation: `blink 1s ease ${d}ms infinite` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {!started && (
                  <div className="flex justify-start" style={{ animation: "fadeUp 0.3s ease both" }}>
                    <div className="bg-secondary px-3.5 py-2.5 rounded-2xl text-xs text-muted-foreground font-medium">
                      Click &quot;Start demo&quot; below to see me in action ↓
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-border p-3 flex items-center gap-2 bg-secondary/20">
                {!started ? (
                  <button
                    type="button"
                    onClick={() => setStarted(true)}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold transition-all hover:brightness-110"
                    style={{ boxShadow: "0 0 14px rgba(61,184,112,0.3)" }}
                  >
                    Start demo →
                  </button>
                ) : done ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMessages([]);
                      setStep(0);
                      setStarted(false);
                      setTyping(false);
                    }}
                    className="flex-1 py-2.5 border border-border text-muted-foreground rounded-xl text-xs font-semibold hover:text-foreground hover:border-primary/30 transition-all"
                  >
                    Restart demo
                  </button>
                ) : CHAT_SCRIPT[step]?.role === "user" ? (
                  <button
                    type="button"
                    onClick={advance}
                    className="flex-1 py-2.5 bg-foreground/8 border border-border text-foreground rounded-xl text-xs font-semibold hover:bg-secondary transition-all text-left px-3"
                  >
                    &quot;{CHAT_SCRIPT[step].text}&quot;
                  </button>
                ) : (
                  <div className="flex-1 py-2.5 text-center text-xs text-muted-foreground">AI is responding…</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
