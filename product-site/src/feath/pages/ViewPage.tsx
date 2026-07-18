import { ExternalLink, Feather } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { resolveViewFromSearchParams, normalizeFigmaEmbedUrl, type FigmaEmbedResult } from "../figmaEmbed";
import { loadPrototypeShare } from "../prototypeShares";

type ViewState =
  | { status: "loading" }
  | { status: "ready"; result: Extract<FigmaEmbedResult, { ok: true }>; title: string }
  | { status: "error"; error: string };

function FeathBar({ title }: { title?: string }) {
  return (
    <header className="h-12 border-b border-border flex items-center justify-between px-4 gap-3 shrink-0 bg-background/95 backdrop-blur-sm z-10">
      <Link to="/" className="flex items-center gap-2 group shrink-0">
        <div
          className="w-7 h-7 rounded-md bg-primary flex items-center justify-center transition-transform group-hover:scale-105"
          style={{ boxShadow: "0 0 10px rgba(61,184,112,0.35)" }}
        >
          <Feather size={13} className="text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-bold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Feath
        </span>
      </Link>
      {title ? (
        <p className="text-sm font-medium text-muted-foreground truncate text-center flex-1 min-w-0 px-2">{title}</p>
      ) : (
        <span className="flex-1" />
      )}
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 shrink-0 hidden sm:inline">
        Prototype
      </span>
    </header>
  );
}

export function ViewPage() {
  const { shareId } = useParams<{ shareId?: string }>();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<ViewState>({ status: "loading" });

  const legacy = useMemo(() => resolveViewFromSearchParams(searchParams), [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (shareId) {
        setState({ status: "loading" });
        const loaded = await loadPrototypeShare(shareId);
        if (cancelled) return;
        if (!loaded.ok) {
          setState({ status: "error", error: loaded.error });
          return;
        }
        const result = normalizeFigmaEmbedUrl(loaded.share.embedSrc);
        if (!result.ok) {
          setState({ status: "error", error: result.error });
          return;
        }
        setState({ status: "ready", result, title: loaded.share.title });
        return;
      }

      if (searchParams.get("e") || searchParams.get("u") || searchParams.get("s")) {
        const shortId = searchParams.get("s");
        if (shortId && !searchParams.get("e") && !searchParams.get("u")) {
          setState({ status: "loading" });
          const loaded = await loadPrototypeShare(shortId);
          if (cancelled) return;
          if (!loaded.ok) {
            setState({ status: "error", error: loaded.error });
            return;
          }
          const result = normalizeFigmaEmbedUrl(loaded.share.embedSrc);
          if (!result.ok) {
            setState({ status: "error", error: result.error });
            return;
          }
          setState({ status: "ready", result, title: loaded.share.title });
          return;
        }

        if (!legacy.result.ok) {
          setState({ status: "error", error: legacy.result.error });
          return;
        }
        setState({ status: "ready", result: legacy.result, title: legacy.title });
        return;
      }

      setState({ status: "error", error: "This link is missing a prototype." });
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [shareId, searchParams, legacy]);

  const title = state.status === "ready" ? state.title : "";
  const result = state.status === "ready" ? state.result : null;

  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} · Feath` : "Prototype · Feath";
    return () => {
      document.title = prev;
    };
  }, [title]);

  if (state.status === "loading") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <FeathBar />
        <div className="flex-1 flex items-center justify-center px-6">
          <p className="text-sm text-muted-foreground">Loading prototype…</p>
        </div>
      </div>
    );
  }

  if (state.status === "error" || !result) {
    const message = state.status === "error" ? state.error : "Prototype unavailable";
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <FeathBar />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <h1 className="text-xl font-extrabold text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Prototype unavailable
            </h1>
            <p className="text-sm text-muted-foreground mb-6">{message}</p>
            <Link to="/" className="text-sm text-primary font-semibold hover:underline">
              Go to feath.xyz
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Figma Make editor links can't be iframed (Figma CSP). Branded launcher instead.
  if (result.kind === "make-launch") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <FeathBar title={title} />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <h1
              className="text-2xl font-extrabold text-foreground mb-3 tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {title || "Figma Make prototype"}
            </h1>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Figma blocks Make editor links inside embeds. Open the prototype below — or publish the Make file and share
              the <span className="font-mono text-xs">*.figma.site</span> URL for a full in-page preview.
            </p>
            <a
              href={result.embedSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all"
              style={{ boxShadow: "0 0 24px rgba(61,184,112,0.35)" }}
            >
              Open prototype <ExternalLink size={15} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <FeathBar title={title} />
      <iframe
        title={title || "Figma prototype"}
        src={result.embedSrc}
        className="flex-1 w-full border-0 min-h-0"
        allowFullScreen
      />
    </div>
  );
}
