import { Feather } from "lucide-react";
import { Link } from "react-router-dom";
import { mailtoHref, siteConfig, telHref } from "../site.config";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div
                className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"
                style={{ boxShadow: "0 0 12px rgba(61,184,112,0.4)" }}
              >
                <Feather size={15} className="text-primary-foreground" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-lg text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Feath
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Custom-built digital solutions for businesses that can't afford to miss a lead.
            </p>
          </div>
          <div>
            <div className="text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-5">Solutions</div>
            <ul className="space-y-3">
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
                <Link to="/about/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold text-foreground uppercase tracking-[0.15em] mb-5">Company</div>
            <ul className="space-y-3">
              <li>
                <Link to="/contact/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Book a consultation
                </Link>
              </li>
              <li>
                <a
                  href={mailtoHref()}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
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
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground">© 2026 Feath. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Built with precision.</p>
        </div>
      </div>
    </footer>
  );
}
