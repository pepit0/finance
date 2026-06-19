import { el } from "./dom";
import { siteConfig, type HeroDifferentiatorIcon } from "./site.config";

const cardIcons: Record<HeroDifferentiatorIcon, string> = {
  support: `<svg class="heroCardIconSvg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.25" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="M12 8v4.5l3 2" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  design: `<svg class="heroCardIconSvg" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="M8 9.5h8M8 13h5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>`,
  updates: `<svg class="heroCardIconSvg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v4M12 16v4M4 12h4M16 12h4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><path d="M8.5 8.5 6 6M18 18l-2.5-2.5M15.5 8.5 18 6M6 18l2.5-2.5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.75"/></svg>`,
  custom: `<svg class="heroCardIconSvg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4 7v6c0 4.2 3.4 6.9 8 8 4.6-1.1 8-3.8 8-8V7l-8-4Z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><circle cx="12" cy="11" r="2.25" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="M12 13.25v2.5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>`,
  dealers: `<svg class="heroCardIconSvg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10l4-2.5V20M10 20V7.5L14 5v15M16 20V10.5L20 8.5V20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M3 20h18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>`
};

function buildCard(item: (typeof siteConfig.heroDifferentiators)[number], index: number): HTMLButtonElement {
  const card = el("button", {
    type: "button",
    class: `heroCard heroCard--${index + 1}`,
    "data-hero-card": String(index),
    "aria-pressed": "false"
  });

  const iconWrap = el("span", { class: "heroCardIcon", "aria-hidden": "true" });
  iconWrap.innerHTML = cardIcons[item.icon];

  card.append(
    iconWrap,
    el("span", { class: "heroCardTitle" }, [item.title]),
    el("span", { class: "heroCardBlurb" }, [item.blurb]),
    el("span", { class: "heroCardDetail" }, [
      el("span", { class: "heroCardDetailInner" }, [item.detail])
    ])
  );

  return card;
}

function setActiveCard(root: HTMLElement, index: number | null): void {
  const cards = root.querySelectorAll<HTMLButtonElement>("[data-hero-card]");
  cards.forEach((card, i) => {
    const isActive = index === i;
    card.classList.toggle("heroCard--active", isActive);
    card.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function initHeroCards(root: HTMLElement): void {
  const cards = root.querySelectorAll<HTMLButtonElement>("[data-hero-card]");
  const stage = root.querySelector<HTMLElement>(".heroCardsStage");
  if (!stage) return;

  cards.forEach((card, index) => {
    card.addEventListener("click", () => {
      const isActive = card.classList.contains("heroCard--active");
      setActiveCard(root, isActive ? null : index);
    });

    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--tilt-x", `${(-y * 10).toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${(x * 12).toFixed(2)}deg`);
      card.style.setProperty("--lift", "-6px");
    });

    card.addEventListener("mouseleave", () => {
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
      card.style.removeProperty("--lift");
    });
  });

  stage.addEventListener("mousemove", (event) => {
    const rect = stage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
    stage.style.setProperty("--parallax-x", `${x.toFixed(2)}px`);
    stage.style.setProperty("--parallax-y", `${y.toFixed(2)}px`);
  });

  stage.addEventListener("mouseleave", () => {
    stage.style.removeProperty("--parallax-x");
    stage.style.removeProperty("--parallax-y");
  });

  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setActiveCard(root, null);
    }
  });
}

export function renderHeroCards(): HTMLElement {
  const root = el("div", { class: "heroCards", "aria-label": "Why we're different" });
  const stage = el("div", { class: "heroCardsStage" });
  const grid = el("div", { class: "heroCardsGrid" });

  for (const [index, item] of siteConfig.heroDifferentiators.entries()) {
    grid.append(buildCard(item, index));
  }

  stage.append(
    el("div", { class: "heroCardsGlow heroCardsGlow--a", "aria-hidden": "true" }),
    el("div", { class: "heroCardsGlow heroCardsGlow--b", "aria-hidden": "true" }),
    grid
  );

  root.append(stage);
  initHeroCards(root);
  return root;
}
