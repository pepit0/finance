import { Facebook, Instagram } from "lucide-react";
import { siteConfig } from "../../site.config";

type SocialLinksProps = {
  className?: string;
  iconSize?: number;
};

const linkClassName =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export function SocialLinks({ className = "", iconSize = 18 }: SocialLinksProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-label="Social media">
      <a
        href={siteConfig.socialInstagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Feath on Instagram"
        className={linkClassName}
      >
        <Instagram size={iconSize} strokeWidth={1.75} aria-hidden="true" />
      </a>
      {siteConfig.socialFacebookUrl ? (
        <a
          href={siteConfig.socialFacebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Feath on Facebook"
          className={linkClassName}
        >
          <Facebook size={iconSize} strokeWidth={1.75} aria-hidden="true" />
        </a>
      ) : (
        <button
          type="button"
          aria-label="Facebook (coming soon)"
          aria-disabled="true"
          disabled
          className="inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full border border-border text-muted-foreground/40 focus-visible:outline-none"
          title="Coming soon"
        >
          <Facebook size={iconSize} strokeWidth={1.75} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
