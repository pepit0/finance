import { Check, Copy, ExternalLink, Feather, Link2, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GlowButton } from "../components/GlowButton";
import { normalizeFigmaEmbedUrl } from "../figmaEmbed";
import { buildShortViewUrl, createPrototypeShare } from "../prototypeShares";
import { Reveal } from "../Reveal";

export function SharePage() {
  const [rawUrl, setRawUrl] = useState("");
  const [title, setTitle] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [copied, setCopied] = useState(false);

  const normalized = useMemo(() => normalizeFigmaEmbedUrl(rawUrl), [rawUrl]);

  // Invalidate short link when inputs change
  useEffect(() => {
    setShareUrl("");
    setCreateError("");
    setCopied(false);
  }, [rawUrl, title]);

  const createLink = async () => {
    if (!normalized.ok || creating) return;
    setCreating(true);
    setCreateError("");
    setCopied(false);

    const result = await createPrototypeShare(normalized.embedSrc, title);
    setCreating(false);

    if (!result.ok) {
      setCreateError(result.error);
      setShareUrl("");
      return;
    }

    setShareUrl(buildShortViewUrl(window.location.origin, result.id));
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="pt-16 min-h-screen">
      <section className="max-w-3xl mx-auto px-6 py-16">
        <Reveal>
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-4">Internal</p>
          <h1
            className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Share a Figma prototype
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-10 max-w-xl">
            Paste a Figma prototype (/proto), Make share link (/make), published *.figma.site URL, or embed link — then
            create a short feath.xyz link. The original Figma URL stays hidden.
          </p>
        </Reveal>

        <Reveal delay={60}>
          <div className="space-y-5 rounded-2xl border border-border bg-card p-6 md:p-8">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                Figma link
              </span>
              <input
                type="url"
                value={rawUrl}
                onChange={(e) => setRawUrl(e.target.value)}
                placeholder="https://www.figma.com/proto/... · /make/... · *.figma.site · or embed"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                Title <span className="font-medium normal-case tracking-normal">(optional)</span>
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Acme homepage prototype"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
            </label>

            {rawUrl.trim() && !normalized.ok && <p className="text-sm text-red-400">{normalized.error}</p>}

            {normalized.ok && (
              <div className="space-y-3 pt-2 border-t border-border">
                {!shareUrl ? (
                  <GlowButton
                    type="button"
                    onClick={createLink}
                    disabled={creating}
                    className="justify-center w-full sm:w-auto"
                  >
                    {creating ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Creating link…
                      </>
                    ) : (
                      <>
                        <Link2 size={15} /> Create short link
                      </>
                    )}
                  </GlowButton>
                ) : (
                  <>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                      Customer link
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        className="flex-1 px-4 py-3 rounded-xl border border-border bg-secondary/40 text-foreground text-sm font-mono"
                      />
                      <GlowButton type="button" onClick={copyLink} className="justify-center shrink-0">
                        {copied ? (
                          <>
                            <Check size={15} /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={15} /> Copy link
                          </>
                        )}
                      </GlowButton>
                    </div>
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline"
                    >
                      Open preview <ExternalLink size={13} />
                    </a>
                  </>
                )}
                {createError && <p className="text-sm text-red-400">{createError}</p>}
              </div>
            )}
          </div>
        </Reveal>

        {normalized.ok && normalized.kind === "iframe" && (
          <Reveal delay={100} className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <Link2 size={14} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live preview</span>
            </div>
            <div className="rounded-2xl border border-border overflow-hidden bg-card" style={{ height: "min(70vh, 640px)" }}>
              <iframe
                title={title.trim() || "Figma prototype preview"}
                src={normalized.embedSrc}
                className="w-full h-full border-0"
                allowFullScreen
              />
            </div>
          </Reveal>
        )}

        {normalized.ok && normalized.kind === "make-launch" && (
          <Reveal delay={100} className="mt-8">
            <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground mb-1">Figma Make share link detected</p>
              Figma blocks Make editor pages inside iframes. Customers will get a Feath page with an Open prototype
              button. For a full in-page embed, publish the Make file and paste the{" "}
              <span className="font-mono text-xs">*.figma.site</span> URL instead.
            </div>
          </Reveal>
        )}

        <p className="mt-10 text-xs text-muted-foreground">
          <Link to="/" className="text-primary hover:underline inline-flex items-center gap-1">
            <Feather size={12} /> Back to Feath
          </Link>
        </p>
      </section>
    </div>
  );
}
