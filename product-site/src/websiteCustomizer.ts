import { el } from "./dom";

export type FooterPosition = "top" | "side";
export type CornerShape = "square" | "rounded-sm" | "rounded";
export type FillStyle = "outline" | "filled";

export type WebsiteCustomizerState = {
  footerPosition: FooterPosition;
  shape: CornerShape;
  tabStyle: FillStyle;
  buttonStyle: FillStyle;
  businessName: string;
  accentColor: string;
};

const DEFAULT_BUSINESS_NAME = "Your Business";
const DEFAULT_ACCENT = "#3d6b8c";

const NAV_ITEMS = ["Home", "Services", "About", "Contact"] as const;

const DEFAULT_STATE: WebsiteCustomizerState = {
  footerPosition: "top",
  shape: "rounded-sm",
  tabStyle: "outline",
  buttonStyle: "filled",
  businessName: DEFAULT_BUSINESS_NAME,
  accentColor: DEFAULT_ACCENT
};

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

function renderSegmentedControl<T extends string>(
  label: string,
  options: SegmentedOption<T>[],
  value: T,
  onChange: (next: T) => void
): HTMLFieldSetElement {
  const fieldset = el("fieldset", { class: "wsControl" });
  fieldset.append(el("legend", { class: "wsControlLabel" }, [label]));

  const group = el("div", {
    class: "wsSegmented",
    role: "group",
    "aria-label": label
  });

  for (const option of options) {
    const isActive = option.value === value;
    const btn = el("button", {
      type: "button",
      class: isActive ? "wsSegment wsSegment--active" : "wsSegment",
      "data-value": option.value,
      "aria-pressed": isActive ? "true" : "false"
    }, [option.label]);

    btn.addEventListener("click", () => onChange(option.value));
    group.append(btn);
  }

  fieldset.append(group);
  return fieldset;
}

function renderColorControl(
  label: string,
  value: string,
  onChange: (color: string) => void
): { field: HTMLFieldSetElement; input: HTMLInputElement } {
  const fieldset = el("fieldset", { class: "wsControl" });
  fieldset.append(el("legend", { class: "wsControlLabel" }, [label]));

  const row = el("div", { class: "wsColorRow" });
  const input = el("input", {
    type: "color",
    class: "wsColorInput",
    value,
    "aria-label": label
  }) as HTMLInputElement;
  const valueLabel = el("span", { class: "wsColorValue" }, [value.toUpperCase()]);

  input.addEventListener("input", () => {
    onChange(input.value);
    valueLabel.textContent = input.value.toUpperCase();
  });

  row.append(input, valueLabel);
  fieldset.append(row);
  return { field: fieldset, input };
}

function syncSegmentedGroup(group: HTMLElement, value: string): void {
  group.querySelectorAll<HTMLButtonElement>(".wsSegment").forEach((btn) => {
    const active = btn.dataset.value === value;
    btn.classList.toggle("wsSegment--active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function applyAccentColor(site: HTMLElement, color: string): void {
  site.style.setProperty("--ws-accent", color);
}

function renderEditableBusinessName(
  text: string,
  onChange: (next: string) => void
): HTMLSpanElement {
  const name = el("span", {
    class: "wsMockLogoText wsMockLogoText--editable",
    contenteditable: "true",
    spellcheck: "false",
    role: "textbox",
    "aria-label": "Business name — click to edit",
    tabindex: "0"
  }, [text]);

  name.addEventListener("focus", () => {
    name.dataset.editing = "true";
  });

  name.addEventListener("blur", () => {
    delete name.dataset.editing;
    const next = name.textContent?.replace(/\s+/g, " ").trim() || DEFAULT_BUSINESS_NAME;
    name.textContent = next;
    onChange(next);
  });

  name.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      name.blur();
    }
  });

  name.addEventListener("paste", (event) => {
    event.preventDefault();
    const pasted = event.clipboardData?.getData("text/plain").replace(/\r?\n/g, " ").trim();
    if (!pasted) {
      return;
    }
    document.execCommand("insertText", false, pasted);
  });

  return name;
}

function renderMockNav(activeIndex = 0): HTMLElement {
  const nav = el("nav", { class: "wsMockNav", role: "navigation", "aria-label": "Site pages" });

  NAV_ITEMS.forEach((label, index) => {
    const isActive = index === activeIndex;
    const link = el("button", {
      type: "button",
      class: isActive ? "wsMockNavLink wsMockTab wsMockTab--active" : "wsMockNavLink wsMockTab",
      "aria-current": isActive ? "page" : "false"
    }, [label]);

    link.addEventListener("click", () => {
      nav.querySelectorAll(".wsMockNavLink").forEach((node) => {
        node.classList.remove("wsMockTab--active");
        node.setAttribute("aria-current", "false");
      });
      link.classList.add("wsMockTab--active");
      link.setAttribute("aria-current", "page");
    });

    nav.append(link);
  });

  return nav;
}

function renderMockShowcaseCard(title: string, subtitle: string): HTMLElement {
  return el("article", { class: "wsMockCard" }, [
    el("div", { class: "wsMockCardImage", "aria-hidden": "true" }),
    el("h4", { class: "wsMockCardTitle" }, [title]),
    el("p", { class: "wsMockCardPrice" }, [subtitle])
  ]);
}

type MockSiteParts = {
  site: HTMLElement;
  logoMark: HTMLSpanElement;
};

function renderMockSite(
  state: WebsiteCustomizerState,
  onBusinessNameChange: (next: string) => void
): MockSiteParts {
  const logoMark = el("span", {
    class: "wsMockLogoMark wsMockLogoMark--pickable",
    role: "button",
    tabindex: "0",
    "aria-label": "Brand color — opens color picker"
  });
  const businessName = renderEditableBusinessName(state.businessName, onBusinessNameChange);
  const nav = renderMockNav(1);

  const shell = el("div", { class: "wsMockShell" }, [
    el("header", { class: "wsMockHeader" }, [
      el("div", { class: "wsMockHeaderBrand" }, [logoMark, businessName]),
      nav
    ]),
    el("div", { class: "wsMockViewport" }, [
      el("section", { class: "wsMockHero" }, [
        el("h3", { class: "wsMockHeroTitle" }, ["Grow your business online"]),
        el("p", { class: "wsMockHeroLead" }, ["Showcase your work · reach new customers · get in touch"]),
        el("button", { type: "button", class: "wsMockBtn" }, ["Learn more"])
      ]),
      el("div", { class: "wsMockGrid" }, [
        renderMockShowcaseCard("Consulting", "From $199"),
        renderMockShowcaseCard("Design", "From $499"),
        renderMockShowcaseCard("Support", "From $99")
      ])
    ])
  ]);

  const site = el("div", {
    class: "wsMockSite",
    "data-footer": state.footerPosition,
    "data-shape": state.shape,
    "data-tab-style": state.tabStyle,
    "data-button-style": state.buttonStyle
  }, [shell]);

  applyAccentColor(site, state.accentColor);

  return { site, logoMark };
}

export function renderWebsiteCustomizer(): HTMLElement {
  let state = { ...DEFAULT_STATE };
  const controlRefs: Record<string, HTMLElement> = {};
  let colorInput: HTMLInputElement | null = null;

  const parts = renderMockSite(state, (next) => {
    state = { ...state, businessName: next };
  });
  const previewWrap = el("div", { class: "wsCustomizerPreview" }, [parts.site]);

  const update = (patch: Partial<WebsiteCustomizerState>): void => {
    state = { ...state, ...patch };
    parts.site.dataset.footer = state.footerPosition;
    parts.site.dataset.shape = state.shape;
    parts.site.dataset.tabStyle = state.tabStyle;
    parts.site.dataset.buttonStyle = state.buttonStyle;

    if (patch.accentColor !== undefined) {
      applyAccentColor(parts.site, state.accentColor);
      if (colorInput && colorInput.value !== state.accentColor) {
        colorInput.value = state.accentColor;
      }
    }

    syncSegmentedGroup(controlRefs.footer, state.footerPosition);
    syncSegmentedGroup(controlRefs.shape, state.shape);
    syncSegmentedGroup(controlRefs.tabStyle, state.tabStyle);
    syncSegmentedGroup(controlRefs.buttonStyle, state.buttonStyle);
  };

  const openColorPicker = (): void => {
    colorInput?.click();
  };

  parts.logoMark.addEventListener("click", openColorPicker);
  parts.logoMark.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openColorPicker();
    }
  });

  const colorControl = renderColorControl("Brand color", state.accentColor, (next) => {
    update({ accentColor: next });
  });
  colorInput = colorControl.input;

  const controls = el("div", { class: "wsCustomizerControls" }, [
    el("p", { class: "wsCustomizerHint" }, [
      "Click the business name in the preview to edit · pick a brand color below or click the logo swatch."
    ]),
    colorControl.field,
    (() => {
      const field = renderSegmentedControl(
        "Navigation bar",
        [
          { value: "top", label: "Top bar" },
          { value: "side", label: "Side rail" }
        ],
        state.footerPosition,
        (next) => update({ footerPosition: next })
      );
      controlRefs.footer = field.querySelector(".wsSegmented")!;
      return field;
    })(),
    (() => {
      const field = renderSegmentedControl(
        "Corner shape",
        [
          { value: "square", label: "Square" },
          { value: "rounded-sm", label: "Rounded" },
          { value: "rounded", label: "Pill" }
        ],
        state.shape,
        (next) => update({ shape: next })
      );
      controlRefs.shape = field.querySelector(".wsSegmented")!;
      return field;
    })(),
    (() => {
      const field = renderSegmentedControl(
        "Tabs",
        [
          { value: "outline", label: "Outline" },
          { value: "filled", label: "Filled" }
        ],
        state.tabStyle,
        (next) => update({ tabStyle: next })
      );
      controlRefs.tabStyle = field.querySelector(".wsSegmented")!;
      return field;
    })(),
    (() => {
      const field = renderSegmentedControl(
        "Buttons",
        [
          { value: "outline", label: "Outline" },
          { value: "filled", label: "Filled" }
        ],
        state.buttonStyle,
        (next) => update({ buttonStyle: next })
      );
      controlRefs.buttonStyle = field.querySelector(".wsSegmented")!;
      return field;
    })()
  ]);

  return el("div", { class: "wsCustomizer" }, [controls, previewWrap]);
}
