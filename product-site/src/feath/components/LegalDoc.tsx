import type { ReactNode } from "react";
import { LEGAL_LAST_UPDATED } from "../../site.config";
import { Reveal } from "../Reveal";

/** Shared chrome for legal pages (privacy, terms, cookies). */
export function LegalDoc({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="pt-16">
      <section className="max-w-3xl mx-auto px-6 py-16 md:py-20">
        <Reveal>
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-4">{eyebrow}</p>
          <h1
            className="text-3xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mb-12">Last updated {LEGAL_LAST_UPDATED}</p>
        </Reveal>
        <div className="space-y-10">{children}</div>
      </section>
    </div>
  );
}

/** Numbered section with prose styling. Body content is plain semantic HTML. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Reveal>
      <section>
        <h2
          className="text-lg md:text-xl font-bold text-foreground mb-3"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {title}
        </h2>
        <div className="legalProse">{children}</div>
      </section>
    </Reveal>
  );
}
