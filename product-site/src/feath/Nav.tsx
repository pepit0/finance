import { Feather, Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { isWebsiteHome, tryOpenFeathBoard } from "./boardAccess";
import { useTheme } from "./ThemeContext";

const links = [
  { to: "/crm/", label: "CRM", book: false },
  { to: "/portfolio/", label: "Portfolio", book: false },
  { to: "/about/", label: "About", book: false },
  { to: "/contact/", label: "Book", book: true },
] as const;

function isActive(pathname: string, to: string) {
  const normalized = pathname.replace(/\/$/, "") || "/";
  const target = to.replace(/\/$/, "") || "/";
  return normalized === target;
}

export function Nav() {
  const { pathname } = useLocation();
  const { dark, setDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border bg-background/95 backdrop-blur-xl shadow-lg shadow-black/10"
          : "bg-background/80 backdrop-blur-md"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 group"
          onClick={(e) => {
            if (e.altKey && isWebsiteHome(pathname)) {
              e.preventDefault();
              tryOpenFeathBoard();
            }
          }}
        >
          <div
            className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-all group-hover:scale-105"
            style={{ boxShadow: "0 0 12px rgba(61,184,112,0.4)" }}
          >
            <Feather size={15} className="text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Feath
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-0.5">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                l.book
                  ? "ml-3 bg-primary text-primary-foreground hover:brightness-110"
                  : isActive(pathname, l.to)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
              style={l.book ? { boxShadow: "0 0 14px rgba(61,184,112,0.3)" } : undefined}
            >
              {!l.book && isActive(pathname, l.to) && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-px bg-primary rounded-full" />
              )}
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark(!dark)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background/98 px-6 py-4 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className={`text-left px-4 py-3 rounded-md text-sm font-medium ${
                isActive(pathname, l.to)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
