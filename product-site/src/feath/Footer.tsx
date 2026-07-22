import { Link } from "react-router-dom";
import { mailtoHref, siteConfig, telHref } from "../site.config";
import { FeathLogoMark } from "./components/FeathLogoMark";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-4 gap-8 md:gap-10 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <FeathLogoMark className="w-8 h-8" />
              <span className="font-bold text-lg text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Feath
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Custom-built digital solutions for businesses that can&apos;t afford to miss a lead.
            </p>
          </div>
          {/* Side-by-side on mobile; join the 4-col grid on desktop */}
          <div className="grid grid-cols-2 gap-6 md:contents">
            <div>
              <div className="text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-4 md:mb-5">Solutions</div>
              <ul className="space-y-2.5 md:space-y-3">
                <li>
                  <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Website
                  </Link>
                </li>
                <li>
                  <Link to="/crm/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    CRM
                  </Link>
                </li>
                <li>
                  <Link to="/portfolio/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Portfolio
                  </Link>
                </li>
                <li>
                  <Link to="/pricing/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/about/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    About
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-4 md:mb-5">Company</div>
              <ul className="space-y-2.5 md:space-y-3">
                <li>
                  <Link to="/contact/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Book a consultation
                  </Link>
                </li>
                <li>
                  <a
                    href={mailtoHref()}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors break-all"
                  >
                    {siteConfig.contactEmail}
                  </a>
                </li>
                <li>
                  <a
                    href={telHref()}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {siteConfig.contactPhone}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground">© 2026 Feath. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Built with precision.</p>
        </div>
      </div>
    </footer>
  );
}
