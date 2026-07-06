import { el } from "./dom";
import type { PortfolioProject } from "./site.config";

export type ServiceSceneKind = "website" | "crm" | "portfolio";

export type SceneOptions = {
  /** Smaller preview for cards — no overlapping widgets */
  compact?: boolean;
  /** Full hero showcase with animations */
  hero?: boolean;
};

function browserDots(): HTMLElement {
  return el("div", { class: "sceneBrowserDots", "aria-hidden": "true" }, [
    el("span", { class: "sceneBrowserDot sceneBrowserDot--r" }),
    el("span", { class: "sceneBrowserDot sceneBrowserDot--y" }),
    el("span", { class: "sceneBrowserDot sceneBrowserDot--g" })
  ]);
}

function browserChrome(url: string, body: HTMLElement): HTMLElement {
  return el("div", { class: "sceneBrowser" }, [
    el("div", { class: "sceneBrowserBar" }, [
      browserDots(),
      el("span", { class: "sceneBrowserUrl" }, [url])
    ]),
    el("div", { class: "sceneBrowserBody" }, [body])
  ]);
}

export function renderAmbientBackdrop(): HTMLElement {
  return el("div", { class: "pageAmbience", "aria-hidden": "true" }, [
    el("div", { class: "pageAmbienceBlob pageAmbienceBlob--a" }),
    el("div", { class: "pageAmbienceBlob pageAmbienceBlob--b" }),
    el("div", { class: "pageAmbienceBlob pageAmbienceBlob--c" }),
    el("div", { class: "pageAmbienceGrain" })
  ]);
}

function websiteSceneBody(options: SceneOptions = {}): HTMLElement {
  const body = el("div", { class: "sceneWebsite" }, [
    el("div", { class: "sceneWebsiteHero" }, [
      el("span", { class: "sceneWebsiteHeroLine sceneWebsiteHeroLine--lg" }),
      el("span", { class: "sceneWebsiteHeroLine" }),
      ...(options.compact
        ? []
        : [el("span", { class: "sceneWebsiteCta" }, ["Get started"])])
    ])
  ]);

  if (options.compact) {
    body.append(
      el("span", { class: "sceneAiPill" }, ["AI lead capture"])
    );
    return body;
  }

  body.append(
    el("div", { class: "sceneAiWidget", "data-scene-ai": "true" }, [
      el("div", { class: "sceneAiHead" }, [
        el("span", { class: "sceneAiDot" }),
        "AI assistant"
      ]),
      el("div", { class: "sceneAiMessages" }, [
        el("span", { class: "sceneAiBubble sceneAiBubble--in" }, ["How can we help?"]),
        el("span", {
          class: "sceneAiBubble sceneAiBubble--out sceneAiBubble--typing",
          "data-scene-typing": "true"
        }, [
          el("span", { class: "sceneTypingText" }, [""]),
          el("span", { class: "sceneTypingCaret", "aria-hidden": "true" }, ["|"])
        ])
      ])
    ])
  );

  if (options.hero) {
    body.append(
      el("div", { class: "sceneLeadToast", "data-scene-lead": "true" }, [
        el("span", { class: "sceneLeadToastIcon", "aria-hidden": "true" }, ["✓"]),
        el("span", { class: "sceneLeadToastText" }, ["New lead captured"])
      ])
    );
  }

  return body;
}

function crmSceneBody(options: SceneOptions = {}): HTMLElement {
  if (options.compact) {
    return el("div", { class: "sceneCrm sceneCrm--compact" }, [
      el("div", { class: "sceneCrmCol sceneCrmCol--active" }, [
        el("span", { class: "sceneCrmColLabel" }, ["Pipeline"]),
        el("div", { class: "sceneCrmCard sceneCrmCard--b" }, [
          el("span", { class: "sceneCrmCardName" }, ["Jordan M."]),
          el("span", { class: "sceneCrmCardMeta" }, ["Working"])
        ]),
        el("div", { class: "sceneCrmCard sceneCrmCard--c" }, [
          el("span", { class: "sceneCrmCardName" }, ["Sam K."]),
          el("span", { class: "sceneCrmCardMeta" }, ["Follow-up"])
        ])
      ]),
      el("div", { class: "sceneCrmCol" }, [
        el("span", { class: "sceneCrmColLabel" }, ["Won"]),
        el("div", { class: "sceneCrmCard sceneCrmCard--d" }, [
          el("span", { class: "sceneCrmCardName" }, ["Riley T."]),
          el("span", { class: "sceneCrmCardMeta" }, ["Closed"])
        ])
      ])
    ]);
  }

  return el("div", { class: "sceneCrm" }, [
    el("div", { class: "sceneCrmCol" }, [
      el("span", { class: "sceneCrmColLabel" }, ["New"]),
      el("div", { class: "sceneCrmCard sceneCrmCard--a" }, [
        el("span", { class: "sceneCrmCardName" }, ["Alex P."]),
        el("span", { class: "sceneCrmCardMeta" }, ["Website form"])
      ])
    ]),
    el("div", { class: "sceneCrmCol sceneCrmCol--active" }, [
      el("span", { class: "sceneCrmColLabel" }, ["Working"]),
      el("div", { class: "sceneCrmCard sceneCrmCard--b" }, [
        el("span", { class: "sceneCrmCardName" }, ["Jordan M."]),
        el("span", { class: "sceneCrmCardMeta" }, ["Call logged"])
      ]),
      el("div", { class: "sceneCrmCard sceneCrmCard--c" }, [
        el("span", { class: "sceneCrmCardName" }, ["Sam K."]),
        el("span", { class: "sceneCrmCardMeta" }, ["Follow-up"])
      ])
    ]),
    el("div", { class: "sceneCrmCol" }, [
      el("span", { class: "sceneCrmColLabel" }, ["Won"]),
      el("div", { class: "sceneCrmCard sceneCrmCard--d" }, [
        el("span", { class: "sceneCrmCardName" }, ["Riley T."]),
        el("span", { class: "sceneCrmCardMeta" }, ["Closed"])
      ])
    ])
  ]);
}

function portfolioSceneBody(options: SceneOptions = {}): HTMLElement {
  if (options.compact) {
    return el("div", { class: "scenePortfolioSimple" }, [
      el("span", { class: "scenePortfolioBlock scenePortfolioBlock--hero" }, ["Your project"]),
      el("span", { class: "sceneWebsiteHeroLine" }),
      el("span", { class: "sceneWebsiteHeroLine sceneWebsiteHeroLine--short" })
    ]);
  }

  return el("div", { class: "scenePortfolioStack" }, [
    el("div", { class: "scenePortfolioLayer scenePortfolioLayer--back" }, [
      el("span", { class: "scenePortfolioBlock" }),
      el("span", { class: "scenePortfolioBlock scenePortfolioBlock--sm" })
    ]),
    el("div", { class: "scenePortfolioLayer scenePortfolioLayer--mid" }, [
      el("span", { class: "scenePortfolioBlock scenePortfolioBlock--accent" }),
      el("span", { class: "scenePortfolioBlock" })
    ]),
    el("div", { class: "scenePortfolioLayer scenePortfolioLayer--front" }, [
      el("span", { class: "scenePortfolioBlock scenePortfolioBlock--hero" }, ["Your project"]),
      el("span", { class: "scenePortfolioBlock scenePortfolioBlock--sm" })
    ])
  ]);
}

export function renderServiceScene(kind: ServiceSceneKind, options: SceneOptions = {}): HTMLElement {
  const urls: Record<ServiceSceneKind, string> = {
    website: "yourbusiness.com",
    crm: "crm.yourbusiness.com",
    portfolio: "feath.ai/work"
  };

  const bodies: Record<ServiceSceneKind, () => HTMLElement> = {
    website: () => websiteSceneBody(options),
    crm: () => crmSceneBody(options),
    portfolio: () => portfolioSceneBody(options)
  };

  const wrapClass = options.hero
    ? "sceneWrap sceneWrap--hero"
    : options.compact
      ? "sceneWrap sceneWrap--compact"
      : "sceneWrap";

  return el("div", { class: wrapClass, "data-scene": kind }, [
    browserChrome(urls[kind], bodies[kind]())
  ]);
}

export function renderHeroShowcase(): HTMLElement {
  return el("div", { class: "heroShowcase" }, [
    renderServiceScene("website", { hero: true })
  ]);
}

export function renderWebsiteModeVisual(mode: "standalone" | "integrated"): HTMLElement {
  const body =
    mode === "standalone"
      ? el("div", { class: "sceneWebsite sceneWebsite--standalone" }, [
          el("span", { class: "sceneWebsiteHeroLine sceneWebsiteHeroLine--lg" }),
          el("span", { class: "sceneWebsiteHeroLine" }),
          el("span", { class: "sceneWebsiteHeroLine sceneWebsiteHeroLine--short" }),
          el("div", { class: "sceneFormMock" }, [
            el("span", { class: "sceneFormField" }),
            el("span", { class: "sceneFormField" }),
            el("span", { class: "sceneFormSubmit" }, ["Send"])
          ])
        ])
      : el("div", { class: "sceneWebsite sceneWebsite--integrated" }, [
          el("div", { class: "sceneSplitPane" }, [
            el("div", { class: "sceneSplitWeb" }, [
              el("span", { class: "sceneWebsiteHeroLine sceneWebsiteHeroLine--short" }),
              el("span", { class: "sceneFormField" })
            ]),
            el("div", { class: "sceneSplitCrm" }, [
              el("span", { class: "sceneCrmCardName" }, ["New lead"]),
              el("span", { class: "sceneCrmCardMeta" }, ["Just now"])
            ])
          ])
        ]);

  const url = mode === "standalone" ? "yourbrand.com" : "crm.yourbrand.com";
  return el("div", { class: "sceneWrap sceneWrap--compact sceneWrap--mode", "data-scene-mode": mode }, [
    browserChrome(url, body)
  ]);
}

export function renderLeadFlowDemo(): HTMLElement {
  return el("div", { class: "leadFlowDemo", "data-lead-flow": "true" }, [
    el("div", { class: "leadFlowStep leadFlowStep--site" }, [
      el("span", { class: "leadFlowLabel" }, ["Visitor"]),
      browserChrome("yoursite.com/contact", el("div", { class: "sceneFormMock sceneFormMock--active" }, [
        el("span", { class: "sceneFormField sceneFormField--filled" }),
        el("span", { class: "sceneFormSubmit sceneFormSubmit--pulse" }, ["Submit"])
      ]))
    ]),
    el("div", { class: "leadFlowArrow", "aria-hidden": "true" }, ["→"]),
    el("div", { class: "leadFlowStep leadFlowStep--crm" }, [
      el("span", { class: "leadFlowLabel" }, ["Your CRM"]),
      browserChrome("crm.yourbrand.com", el("div", { class: "sceneCrm sceneCrm--single" }, [
        el("div", { class: "sceneCrmCard sceneCrmCard--new", "data-scene-new-lead": "true" }, [
          el("span", { class: "sceneCrmCardName" }, ["New inquiry"]),
          el("span", { class: "sceneCrmCardMeta" }, ["Assigned to you"])
        ])
      ]))
    ])
  ]);
}

function portfolioTheme(project: PortfolioProject): string {
  if (project.url.includes("burdapp")) {
    return "burdapp";
  }
  if (project.url.includes("temptmotorsports")) {
    return "motorsports";
  }
  return "default";
}

export function renderPortfolioVisual(project: PortfolioProject): HTMLElement {
  const theme = portfolioTheme(project);
  const host = el("div", {
    class: `portfolioVisual portfolioVisual--${theme}`,
    "data-portfolio-visual": theme
  });

  const art =
    theme === "burdapp"
      ? el("div", { class: "portfolioArt portfolioArt--burdapp", "aria-hidden": "true" }, [
          (() => {
            const svg = el("div", { class: "portfolioArtSvgWrap" });
            svg.innerHTML = `<svg class="portfolioArtSvg" viewBox="0 0 120 80" aria-hidden="true"><circle cx="88" cy="18" r="14" fill="currentColor" opacity="0.15"/><path d="M20 55 Q40 20 65 40 T95 35" fill="none" stroke="currentColor" stroke-width="2" opacity="0.35"/><path d="M72 38 L78 28 L84 36 L76 42 Z" fill="currentColor" opacity="0.5"/></svg>`;
            return svg;
          })(),
          el("span", { class: "portfolioArtLabel" }, ["Birding app"])
        ])
      : theme === "motorsports"
        ? el("div", { class: "portfolioArt portfolioArt--motorsports", "aria-hidden": "true" }, [
            el("div", { class: "portfolioStripe" }),
            el("span", { class: "portfolioArtWordmark" }, ["TEMPT"]),
            el("span", { class: "portfolioArtSub" }, ["Motorsports"])
          ])
        : el("div", { class: "portfolioArt portfolioArt--default", "aria-hidden": "true" }, [
            el("span", { class: "sceneWebsiteHeroLine sceneWebsiteHeroLine--lg" }),
            el("span", { class: "sceneWebsiteHeroLine" })
          ]);

  host.append(
    browserChrome(project.url.replace(/^https?:\/\//, ""), art)
  );
  return host;
}

export function renderAddonFlowVisual(): HTMLElement {
  return el("div", { class: "addonFlowVisual", "aria-hidden": "true" }, [
    el("div", { class: "addonFlowNode addonFlowNode--you" }, [
      el("span", { class: "addonFlowIcon" }, ["1"]),
      el("span", { class: "addonFlowLabel" }, ["Your workflow"])
    ]),
    el("div", { class: "addonFlowLine addonFlowLine--a" }),
    el("div", { class: "addonFlowNode addonFlowNode--feath" }, [
      el("span", { class: "addonFlowIcon" }, ["2"]),
      el("span", { class: "addonFlowLabel" }, ["We build it"])
    ]),
    el("div", { class: "addonFlowLine addonFlowLine--b" }),
    el("div", { class: "addonFlowNode addonFlowNode--live" }, [
      el("span", { class: "addonFlowIcon" }, ["3"]),
      el("span", { class: "addonFlowLabel" }, ["Live in CRM"])
    ])
  ]);
}

export function renderContactScene(): HTMLElement {
  return el("div", { class: "contactScene", "aria-hidden": "true" }, [
    el("div", { class: "contactSceneCard contactSceneCard--calendar" }, [
      el("span", { class: "contactSceneCardTitle" }, ["Pick a time"]),
      el("div", { class: "contactSceneCal" }, [
        el("span", { class: "contactSceneCalDay contactSceneCalDay--on" }, ["12"]),
        el("span", { class: "contactSceneCalDay" }, ["13"]),
        el("span", { class: "contactSceneCalDay contactSceneCalDay--on" }, ["14"])
      ])
    ]),
    el("div", { class: "contactSceneCard contactSceneCard--chat" }, [
      el("span", { class: "sceneAiBubble sceneAiBubble--in" }, ["What are you hoping to build?"]),
      el("span", { class: "sceneAiBubble sceneAiBubble--out" }, ["A site + CRM for our team"])
    ]),
    el("div", { class: "contactSceneCard contactSceneCard--reply" }, [
      el("span", { class: "contactSceneReply" }, ["We'll confirm by email — usually same day"])
    ])
  ]);
}

export function renderCrmIntroVisual(): HTMLElement {
  return el("div", { class: "crmIntroVisual" }, [
    renderServiceScene("crm", { compact: false })
  ]);
}
