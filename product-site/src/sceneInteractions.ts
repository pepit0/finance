const TYPING_PHRASES = [
  "I need a quote for…",
  "Can someone call me?",
  "Book a consultation"
];

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initTypingLoop(root: HTMLElement): void {
  const target = root.querySelector<HTMLElement>("[data-scene-typing] .sceneTypingText");
  if (!target || prefersReducedMotion()) {
    return;
  }

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const tick = () => {
    const phrase = TYPING_PHRASES[phraseIndex];
    if (!deleting) {
      charIndex += 1;
      target.textContent = phrase.slice(0, charIndex);
      if (charIndex >= phrase.length) {
        deleting = true;
        window.setTimeout(tick, 1800);
        return;
      }
      window.setTimeout(tick, 55 + Math.random() * 40);
      return;
    }

    charIndex -= 1;
    target.textContent = phrase.slice(0, charIndex);
    if (charIndex <= 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % TYPING_PHRASES.length;
      window.setTimeout(tick, 400);
      return;
    }
    window.setTimeout(tick, 30);
  };

  window.setTimeout(tick, 800);
}

function initLeadToast(root: HTMLElement): void {
  const toast = root.querySelector<HTMLElement>("[data-scene-lead]");
  if (!toast || prefersReducedMotion()) {
    return;
  }

  const pulse = () => {
    toast.classList.add("sceneLeadToast--show");
    window.setTimeout(() => {
      toast.classList.remove("sceneLeadToast--show");
      window.setTimeout(pulse, 3200);
    }, 2400);
  };

  window.setTimeout(pulse, 1200);
}

function initLeadFlow(root: HTMLElement): void {
  if (prefersReducedMotion()) {
    return;
  }

  const run = () => {
    root.classList.add("leadFlowDemo--animate");
    window.setTimeout(() => {
      root.classList.remove("leadFlowDemo--animate");
      window.setTimeout(run, 2800);
    }, 3200);
  };

  window.setTimeout(run, 600);
}

export function initPageScenes(): void {
  const hero = document.querySelector<HTMLElement>(".heroShowcase");
  if (hero) {
    initTypingLoop(hero);
    initLeadToast(hero);
  }

  const leadFlow = document.querySelector<HTMLElement>("[data-lead-flow]");
  if (leadFlow) {
    initLeadFlow(leadFlow);
  }
}
