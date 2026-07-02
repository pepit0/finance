import { el } from "./dom";

export type BurdScreen = "explore" | "animal" | "habitat";

const SCREENS: BurdScreen[] = ["explore", "animal", "habitat"];

function phoneStatusBar(): HTMLElement {
  return el("div", { class: "burdPhoneStatus", "aria-hidden": "true" }, [
    el("span", { class: "burdPhoneTime" }, ["9:41"]),
    el("span", { class: "burdPhoneIsland" }),
    el("span", { class: "burdPhoneSignal" }, [
      el("span", { class: "burdPhoneSignalBar" }),
      el("span", { class: "burdPhoneSignalBar" }),
      el("span", { class: "burdPhoneSignalBar" }),
      el("span", { class: "burdPhoneBattery" })
    ])
  ]);
}

function tabBar(active: BurdScreen): HTMLElement {
  const items: { id: BurdScreen | "log" | "profile"; label: string; icon: string }[] = [
    { id: "explore", label: "Explore", icon: "◎" },
    { id: "log", label: "Log", icon: "+" },
    { id: "animal", label: "Scan", icon: "⌖" },
    { id: "profile", label: "You", icon: "◉" }
  ];

  const nav = el("nav", { class: "burdTabBar", "aria-label": "App navigation" });
  for (const item of items) {
    const isActive = item.id === active || (active === "habitat" && item.id === "animal");
    nav.append(
      el("button", {
        type: "button",
        class: isActive ? "burdTab burdTab--active" : "burdTab",
        "data-burd-tab": item.id,
        "aria-pressed": isActive ? "true" : "false"
      }, [
        el("span", { class: "burdTabIcon", "aria-hidden": "true" }, [item.icon]),
        el("span", { class: "burdTabLabel" }, [item.label])
      ])
    );
  }
  return nav;
}

function exploreScreen(): HTMLElement {
  return el("div", { class: "burdScreen burdScreen--explore", "data-burd-screen": "explore" }, [
    el("header", { class: "burdExploreHeader" }, [
      el("span", { class: "burdAppMark", "aria-hidden": "true" }, ["🪶"]),
      el("h3", { class: "burdExploreTitle" }, ["Nearby sightings"])
    ]),
    el("div", { class: "burdFeed" }, [
      el("article", { class: "burdSightingCard burdSightingCard--featured" }, [
        el("div", { class: "burdSightingPhoto burdSightingPhoto--owl", "aria-hidden": "true" }),
        el("div", { class: "burdSightingBody" }, [
          el("span", { class: "burdSightingSpecies" }, ["Tawny Owl"]),
          el("span", { class: "burdSightingMeta" }, ["Strix aluco · 2h ago"])
        ])
      ]),
      el("article", { class: "burdSightingCard" }, [
        el("div", { class: "burdSightingPhoto burdSightingPhoto--robin", "aria-hidden": "true" }),
        el("div", { class: "burdSightingBody" }, [
          el("span", { class: "burdSightingSpecies" }, ["American Robin"]),
          el("span", { class: "burdSightingMeta" }, ["Turdus migratorius · 5h ago"])
        ])
      ]),
      el("article", { class: "burdSightingCard" }, [
        el("div", { class: "burdSightingPhoto burdSightingPhoto--finch", "aria-hidden": "true" }),
        el("div", { class: "burdSightingBody" }, [
          el("span", { class: "burdSightingSpecies" }, ["House Finch"]),
          el("span", { class: "burdSightingMeta" }, ["Haemorhous mexicanus · yesterday"])
        ])
      ])
    ])
  ]);
}

function scannerScreen(kind: "animal" | "habitat"): HTMLElement {
  const isAnimal = kind === "animal";
  return el("div", {
    class: `burdScreen burdScreen--scanner burdScreen--${kind}`,
    "data-burd-screen": kind
  }, [
    el("div", { class: "burdScannerViewport" }, [
      el("div", { class: `burdScannerScene burdScannerScene--${kind}`, "aria-hidden": "true" }, [
        el("div", { class: "burdScannerReticle" }, [
          el("span", { class: "burdScannerCorner burdScannerCorner--tl" }),
          el("span", { class: "burdScannerCorner burdScannerCorner--tr" }),
          el("span", { class: "burdScannerCorner burdScannerCorner--bl" }),
          el("span", { class: "burdScannerCorner burdScannerCorner--br" })
        ]),
        el("span", { class: "burdScannerHint" }, [isAnimal ? "Point at an animal" : "Scan habitat"])
      ]),
      el("div", { class: "burdScannerTop" }, [
        el("span", { class: "burdScannerMode" }, [isAnimal ? "Animal Scanner" : "Habitat Scanner"])
      ]),
      el("article", { class: "burdIdCard" }, [
        el("div", { class: "burdIdCardMain" }, [
          el("h4", { class: "burdIdName" }, [isAnimal ? "Tawny Owl" : "Oak Eggar Moth"]),
          el("p", { class: "burdIdLatin" }, [isAnimal ? "Strix aluco" : "Lasiocampa quercus"]),
          el("p", { class: "burdIdHabitat" }, [
            isAnimal ? "Deciduous woodland · Nocturnal" : "Woodland edge · Oak bark camouflage"
          ])
        ]),
        el("div", { class: "burdIdMatch" }, [
          el("span", { class: "burdIdMatchValue" }, [isAnimal ? "94%" : "87%"]),
          el("span", { class: "burdIdMatchLabel" }, ["match"])
        ])
      ])
    ])
  ]);
}

function renderPhone(active: BurdScreen): HTMLElement {
  const body = el("div", { class: "burdPhoneBody" }, [
    exploreScreen(),
    scannerScreen("animal"),
    scannerScreen("habitat")
  ]);

  const phone = el("div", { class: "burdPhone", "data-burd-active": active }, [
    el("div", { class: "burdPhoneBezel" }, [
      phoneStatusBar(),
      body,
      tabBar(active)
    ])
  ]);

  setActiveScreen(phone, active);
  return phone;
}

function setActiveScreen(phone: HTMLElement, screen: BurdScreen): void {
  phone.dataset.burdActive = screen;
  phone.querySelectorAll<HTMLElement>("[data-burd-screen]").forEach((node) => {
    const on = node.dataset.burdScreen === screen;
    node.classList.toggle("burdScreen--active", on);
    node.hidden = !on;
  });
  phone.querySelectorAll<HTMLButtonElement>("[data-burd-tab]").forEach((btn) => {
    const tab = btn.dataset.burdTab;
    let isActive = false;
    if (screen === "explore") {
      isActive = tab === "explore";
    } else if (screen === "animal" || screen === "habitat") {
      isActive = tab === "animal";
    }
    btn.classList.toggle("burdTab--active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

export function renderBurdPhone(active: BurdScreen = "animal"): HTMLElement {
  return renderPhone(active);
}

export function renderBurdHeroDemo(): HTMLElement {
  return el("div", { class: "burdHeroDemo", "data-burd-root": "true" }, [
    renderPhone("animal")
  ]);
}

export function renderBurdScannerSection(): HTMLElement {
  const section = el("section", {
    class: "burdScannerSection",
    "data-burd-scanner-section": "true",
    "data-burd-root": "true"
  }, [
    el("div", { class: "burdScannerSectionIntro" }, [
      el("p", { class: "burdScannerEyebrow" }, ["New · Coming soon to Burd"]),
      el("h2", { class: "burdScannerTitle" }, ["The wild, fully identified."]),
      el("p", { class: "burdScannerLead" }, [
        "Two powerful scanners bring real-time identification of every animal, tree, nest, and egg you encounter in the field."
      ])
    ]),
    el("div", { class: "burdScannerToggle", role: "tablist", "aria-label": "Scanner type" }, [
      el("button", {
        type: "button",
        class: "burdScannerToggleBtn burdScannerToggleBtn--active",
        role: "tab",
        "aria-selected": "true",
        "data-burd-scanner": "animal"
      }, ["Animal Scanner"]),
      el("button", {
        type: "button",
        class: "burdScannerToggleBtn",
        role: "tab",
        "aria-selected": "false",
        "data-burd-scanner": "habitat"
      }, ["Habitat Scanner"])
    ]),
    el("div", { class: "burdScannerSplit" }, [
      el("div", { class: "burdScannerPhoneWrap" }, [renderPhone("animal")]),
      el("div", { class: "burdScannerFeatures" }, [
        el("span", { class: "burdScannerIndex", "data-burd-feature-index": "true" }, ["01 — Animal Scanner"]),
        el("h3", { class: "burdScannerFeatureTitle", "data-burd-feature-title": "true" }, [
          "Every creature, identified."
        ]),
        el("p", { class: "burdScannerFeatureLead", "data-burd-feature-lead": "true" }, [
          "Point your phone at any animal and Burd identifies it in real time — photo ID, sound ID, and live detection with confidence scores."
        ]),
        el("ul", { class: "burdScannerFeatureList", "data-burd-feature-list": "true" }, [
          el("li", {}, ["Photo ID — point your camera for instant identification"]),
          el("li", {}, ["Sound ID — identify species by calls and songs"]),
          el("li", {}, ["Real-time detection with live bounding boxes"]),
          el("li", {}, ["10,000+ species across the animal kingdom"])
        ])
      ])
    ])
  ]);

  return section;
}

const FEATURE_COPY: Record<
  "animal" | "habitat",
  { index: string; title: string; lead: string; items: string[] }
> = {
  animal: {
    index: "01 — Animal Scanner",
    title: "Every creature, identified.",
    lead: "Point your phone at any animal and Burd identifies it in real time — photo ID, sound ID, and live detection with confidence scores.",
    items: [
      "Photo ID — point your camera for instant identification",
      "Sound ID — identify species by calls and songs",
      "Real-time detection with live bounding boxes",
      "10,000+ species across the animal kingdom"
    ]
  },
  habitat: {
    index: "02 — Habitat Scanner",
    title: "Read the landscape.",
    lead: "Scan trees, nests, eggs, and burrows to understand which species live, breed, and pass through an environment.",
    items: [
      "Tree & plant ID from bark, leaf, or silhouette",
      "Nest identification by structure and materials",
      "Egg recognition by size, colour, and pattern",
      "Burrows and shelter structure recognition"
    ]
  }
};

export function initBurdAppShowcase(): void {
  document.querySelectorAll<HTMLElement>("[data-burd-root]").forEach((root) => {
    bindPhone(root);
  });

  const scannerSection = document.querySelector<HTMLElement>("[data-burd-scanner-section]");
  if (scannerSection) {
    bindScannerSection(scannerSection);
  }
}

function bindPhone(root: HTMLElement): void {
  const phone = root.querySelector<HTMLElement>(".burdPhone");
  if (!phone) {
    return;
  }

  root.querySelectorAll<HTMLButtonElement>(".burdPhone [data-burd-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.burdTab;
      if (tab === "explore") {
        setActiveScreen(phone, "explore");
      } else if (tab === "animal") {
        setActiveScreen(phone, "animal");
      }
    });
  });
}

function bindScannerSection(section: HTMLElement): void {
  const phone = section.querySelector<HTMLElement>(".burdPhone");
  const indexEl = section.querySelector<HTMLElement>("[data-burd-feature-index]");
  const titleEl = section.querySelector<HTMLElement>("[data-burd-feature-title]");
  const leadEl = section.querySelector<HTMLElement>("[data-burd-feature-lead]");
  const listEl = section.querySelector<HTMLElement>("[data-burd-feature-list]");
  if (!phone || !indexEl || !titleEl || !leadEl || !listEl) {
    return;
  }

  section.querySelectorAll<HTMLButtonElement>("[data-burd-scanner]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.burdScanner as "animal" | "habitat";
      if (!mode || !SCREENS.includes(mode)) {
        return;
      }

      section.querySelectorAll<HTMLButtonElement>("[data-burd-scanner]").forEach((other) => {
        const on = other === btn;
        other.classList.toggle("burdScannerToggleBtn--active", on);
        other.setAttribute("aria-selected", on ? "true" : "false");
      });

      setActiveScreen(phone, mode);
      const copy = FEATURE_COPY[mode];
      indexEl.textContent = copy.index;
      titleEl.textContent = copy.title;
      leadEl.textContent = copy.lead;
      listEl.replaceChildren(...copy.items.map((text) => el("li", {}, [text])));
    });
  });
}
