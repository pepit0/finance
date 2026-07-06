export function initWebsiteFigmaReveal(): void {
  const nodes = document.querySelectorAll<HTMLElement>("[data-fw-reveal]");
  if (!nodes.length) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    nodes.forEach((node) => node.classList.add("fwReveal--visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("fwReveal--visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12 }
  );

  nodes.forEach((node) => observer.observe(node));
}
