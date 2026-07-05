import { ArrowRight, Check, ChevronRight, Clock, MousePointer, Users } from "lucide-react";
import { useState } from "react";
import { formspreeEndpoint } from "../../site.config";
import { CalendarPicker } from "../components/CalendarPicker";
import { GlowButton } from "../components/GlowButton";
import { Reveal } from "../Reveal";

export function BookPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    service: "",
    message: "",
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const dateLabel =
    selectedDate && selectedTime
      ? `${selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at ${selectedTime}`
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      preferredDate: selectedDate?.toISOString().slice(0, 10) ?? "",
      preferredTime: selectedTime,
      preferredSlot: dateLabel ?? "",
    };
    const endpoint = formspreeEndpoint();
    if (endpoint) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          setSubmitted(true);
        }
      } catch {
        // stay on form
      }
    } else {
      setSubmitted(true);
    }
  };

  const inputCls =
    "w-full px-4 py-2.5 rounded-lg bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all text-sm";

  return (
    <div className="pt-16">
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <Reveal>
              <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-4">Free consultation</p>
              <h1
                className="text-4xl md:text-5xl font-extrabold text-foreground mb-5 leading-tight tracking-tight"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Let's talk about
                <br />
                <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">your business.</span>
              </h1>
              <p className="text-muted-foreground leading-relaxed mb-10 text-lg">
                Free 30-minute call. We'll understand your goals and show you exactly what we'd build. No obligation,
                no pitch deck.
              </p>
            </Reveal>
            <Reveal delay={80}>
              <div className="space-y-4 mb-10">
                {[
                  { icon: Clock, label: "30 minutes", sub: "Focused and respectful of your time" },
                  { icon: Users, label: "Meet the team", sub: "Talk directly to who builds your project" },
                  { icon: MousePointer, label: "No commitment", sub: "You're free to walk away anytime." },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon size={17} className="text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.sub}</div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground ml-auto" />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={60}>
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-5 py-16">
                <div
                  className="w-20 h-20 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center mb-2"
                  style={{ boxShadow: "0 0 40px rgba(61,184,112,0.2)" }}
                >
                  <Check size={32} className="text-primary" />
                </div>
                <h2 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  We got your request.
                </h2>
                {dateLabel && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-sm text-primary font-semibold">
                    <Clock size={14} /> {dateLabel}
                  </div>
                )}
                <p className="text-muted-foreground max-w-xs">
                  You'll hear from us within a few hours to confirm your slot.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-8 space-y-5">
                <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Book your free session
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Full name *</label>
                    <input value={form.name} onChange={set("name")} required placeholder="Jane Smith" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Email *</label>
                    <input type="email" value={form.email} onChange={set("email")} required placeholder="jane@co.com" className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Company</label>
                    <input value={form.company} onChange={set("company")} placeholder="Acme Inc." className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Phone</label>
                    <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+1 555 000 0000" className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">I'm interested in *</label>
                  <select value={form.service} onChange={set("service")} required className={inputCls}>
                    <option value="">Select a service…</option>
                    <option>Custom website</option>
                    <option>Feath CRM</option>
                    <option>Website + CRM bundle</option>
                    <option>AI integration only</option>
                    <option>Something else</option>
                  </select>
                </div>

                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                    Pick a date & time{" "}
                    {dateLabel && (
                      <span className="text-primary normal-case tracking-normal font-semibold">· {dateLabel}</span>
                    )}
                  </p>
                  <CalendarPicker
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    onDateChange={setSelectedDate}
                    onTimeChange={setSelectedTime}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Tell us about your project</label>
                  <textarea
                    value={form.message}
                    onChange={set("message")}
                    rows={3}
                    placeholder="What are you trying to build? What's not working right now?"
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <GlowButton type="submit" size="lg" className="w-full justify-center">
                  Request consultation <ArrowRight size={16} />
                </GlowButton>
                <p className="text-center text-xs text-muted-foreground">We'll confirm within 24 hours. No spam, ever.</p>
              </form>
            )}
          </Reveal>
        </div>
      </section>
    </div>
  );
}
