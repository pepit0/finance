import { el } from "./dom";
import { siteConfig } from "./site.config";

const DEFAULT_INTERVAL_MS = 2800;
const TRANSITION_MS = 450;

function longestWord(words: string[]): string {
  return words.reduce((longest, word) => (word.length > longest.length ? word : longest), words[0] ?? "");
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initHeroRotatingText(root: HTMLElement, words: string[], intervalMs: number): void {
  const wordEl = root.querySelector<HTMLElement>("[data-hero-rotating-word]");
  if (!wordEl || words.length <= 1 || prefersReducedMotion()) {
    return;
  }

  let index = 0;
  let timer: number | null = null;
  let transitioning = false;

  const showWord = (nextIndex: number) => {
    if (transitioning) {
      return;
    }
    transitioning = true;
    wordEl.classList.add("heroRotatingTextWord--exit");

    window.setTimeout(() => {
      index = nextIndex;
      wordEl.textContent = words[index];
      wordEl.classList.remove("heroRotatingTextWord--exit");
      wordEl.classList.add("heroRotatingTextWord--enter");
      void wordEl.offsetWidth;
      wordEl.classList.remove("heroRotatingTextWord--enter");
      transitioning = false;
    }, TRANSITION_MS);
  };

  const schedule = () => {
    timer = window.setTimeout(() => {
      showWord((index + 1) % words.length);
      schedule();
    }, intervalMs);
  };

  schedule();

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden && timer != null) {
        window.clearTimeout(timer);
        timer = null;
      } else if (!document.hidden && timer == null) {
        schedule();
      }
    },
    { passive: true }
  );
}

export function renderHeroTitle(): HTMLParagraphElement {
  const { before, rotatingWords, intervalMs = DEFAULT_INTERVAL_MS } = siteConfig.heroTagline;
  const words = rotatingWords.map((word) => word.trim()).filter(Boolean);
  const activeWord = words[0] ?? "";
  const sizerWord = longestWord(words);

  const rotating = el("span", { class: "heroRotatingText", "aria-live": "polite" }, [
    el("span", { class: "heroRotatingTextSizer", "aria-hidden": "true" }, [sizerWord]),
    el("span", { class: "heroRotatingTextWord", "data-hero-rotating-word": "true" }, [activeWord])
  ]);

  const title = el("p", { class: "heroTagline" }, [
    el("span", { class: "heroTitleLead" }, [`${before.trim()} `]),
    rotating
  ]);

  if (words.length > 1) {
    initHeroRotatingText(title, words, intervalMs);
  }

  return title;
}
