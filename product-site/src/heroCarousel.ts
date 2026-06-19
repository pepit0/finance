import homepage1 from "./assets/homepage1.png";
import homepage2 from "./assets/homepage2.png";
import { el } from "./dom";
import { siteConfig } from "./site.config";

const heroSlides = [
  { src: homepage1, alt: `${siteConfig.productName} — customer pipeline view` },
  { src: homepage2, alt: `${siteConfig.productName} — customer detail view` }
] as const;

const AUTO_ADVANCE_MS = 5000;

function setActiveSlide(root: HTMLElement, index: number): void {
  const slides = root.querySelectorAll<HTMLElement>("[data-hero-slide]");
  const dots = root.querySelectorAll<HTMLButtonElement>("[data-hero-dot]");

  slides.forEach((slide, i) => {
    const isActive = i === index;
    slide.classList.toggle("heroCarouselSlide--active", isActive);
    slide.hidden = !isActive;
  });

  dots.forEach((dot, i) => {
    const isActive = i === index;
    dot.classList.toggle("heroCarouselDot--active", isActive);
    dot.setAttribute("aria-selected", isActive ? "true" : "false");
    dot.tabIndex = isActive ? 0 : -1;
  });

  root.dataset.heroActive = String(index);
}

function initHeroCarousel(root: HTMLElement): void {
  let index = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  const advance = (next: number): void => {
    index = (next + heroSlides.length) % heroSlides.length;
    setActiveSlide(root, index);
  };

  const startTimer = (): void => {
    if (timer) clearInterval(timer);
    timer = setInterval(() => advance(index + 1), AUTO_ADVANCE_MS);
  };

  root.querySelectorAll<HTMLButtonElement>("[data-hero-dot]").forEach((dot) => {
    dot.addEventListener("click", () => {
      advance(Number(dot.dataset.heroDot));
      startTimer();
    });
  });

  root.addEventListener("mouseenter", () => {
    if (timer) clearInterval(timer);
    timer = null;
  });

  root.addEventListener("mouseleave", startTimer);

  startTimer();
}

export function renderHeroCarousel(): HTMLElement {
  const root = el("div", {
    class: "heroCarousel",
    "aria-label": "Product screenshots",
    "aria-roledescription": "carousel"
  });

  const track = el("div", { class: "heroCarouselTrack" });
  const dots = el("div", {
    class: "heroCarouselDots",
    role: "tablist",
    "aria-label": "Screenshot slides"
  });

  heroSlides.forEach((slide, i) => {
    const isActive = i === 0;
    track.append(
      el("div", {
        class: `heroCarouselSlide${isActive ? " heroCarouselSlide--active" : ""}`,
        role: "group",
        "aria-roledescription": "slide",
        "aria-label": `${i + 1} of ${heroSlides.length}`,
        "data-hero-slide": String(i),
        ...(isActive ? {} : { hidden: "true" })
      }, [
        el("img", {
          src: slide.src,
          alt: slide.alt,
          loading: i === 0 ? "eager" : "lazy",
          decoding: "async",
          draggable: "false"
        })
      ])
    );

    dots.append(
      el("button", {
        type: "button",
        class: `heroCarouselDot${isActive ? " heroCarouselDot--active" : ""}`,
        role: "tab",
        "aria-label": `Show screenshot ${i + 1}`,
        "aria-selected": isActive ? "true" : "false",
        "data-hero-dot": String(i),
        tabindex: isActive ? "0" : "-1"
      })
    );
  });

  root.append(el("div", { class: "heroCarouselFrame" }, [track, dots]));
  initHeroCarousel(root);
  return root;
}
