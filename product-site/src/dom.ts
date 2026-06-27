/** Split marker in copy strings; rendered as a styled dot, not this character. */
export const DOT_SPLIT = " · ";

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  children: (Node | string)[] = []
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "className") {
      node.className = value;
    } else {
      node.setAttribute(key, value);
    }
  }
  for (const child of children) {
    node.append(child instanceof Node ? child : document.createTextNode(child));
  }
  return node;
}

export function appendProseWithDots(container: HTMLElement, text: string): void {
  const parts = text.split(DOT_SPLIT);
  parts.forEach((part, index) => {
    if (index > 0) {
      container.append(el("span", { class: "textDot", "aria-hidden": "true" }));
    }
    container.append(document.createTextNode(part));
  });
}

export function pWithDots(className: string, text: string): HTMLParagraphElement {
  const p = document.createElement("p");
  p.className = className;
  appendProseWithDots(p, text);
  return p;
}

export function buttonLink(
  href: string,
  label: string,
  className: string,
  external = false
): HTMLAnchorElement {
  const attrs: Record<string, string> = { href, class: className };
  if (external) {
    attrs.target = "_blank";
    attrs.rel = "noopener noreferrer";
  }
  return el("a", attrs, [label]);
}
