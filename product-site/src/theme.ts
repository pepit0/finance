import { el } from "./dom";

export type SiteTheme = "light" | "dark";

const STORAGE_KEY = "tempt-site-theme";

const ICONS = {
  sun: `<svg class="themeToggleSvg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.25" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>`,
  moon: `<svg class="themeToggleSvg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 14.5A7.5 7.5 0 0 1 9.5 4 6.5 6.5 0 1 0 20 14.5Z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/></svg>`
} as const;

export type ThemeToggleVariant = "header" | "footer";

export function getStoredTheme(): SiteTheme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

export function getActiveTheme(): SiteTheme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function syncThemeToggleButtons(theme: SiteTheme): void {
  const isDark = theme === "dark";
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]")) {
    button.setAttribute("aria-pressed", isDark ? "true" : "false");
    button.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");

    const label = button.querySelector<HTMLElement>("[data-theme-toggle-label]");
    if (label) {
      label.textContent = isDark ? "Light mode" : "Dark mode";
    }

    const icon = button.querySelector<HTMLElement>(".themeToggleIcon");
    if (icon) {
      icon.innerHTML = isDark ? ICONS.sun : ICONS.moon;
    }
  }
}

export function applyTheme(theme: SiteTheme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore storage errors */
  }
  syncThemeToggleButtons(theme);
}

export function toggleTheme(): void {
  applyTheme(getActiveTheme() === "dark" ? "light" : "dark");
}

export function initTheme(): void {
  const stored = getStoredTheme();
  const theme: SiteTheme = stored ?? "light";
  applyTheme(theme);
}

export function renderThemeToggle(variant: ThemeToggleVariant = "footer"): HTMLButtonElement {
  const isDark = (getStoredTheme() ?? getActiveTheme()) === "dark";
  const icon = el("span", { class: "themeToggleIcon", "aria-hidden": "true" });
  icon.innerHTML = isDark ? ICONS.sun : ICONS.moon;

  const button = el("button", {
    type: "button",
    class: `themeToggle themeToggle--${variant}`,
    "data-theme-toggle": "true",
    "aria-pressed": isDark ? "true" : "false",
    "aria-label": isDark ? "Switch to light mode" : "Switch to dark mode"
  }, [
    icon,
    el("span", {
      class: "themeToggleLabel",
      "data-theme-toggle-label": "true"
    }, [isDark ? "Light mode" : "Dark mode"])
  ]);

  button.addEventListener("click", () => toggleTheme());
  return button;
}
