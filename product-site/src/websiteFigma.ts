import { buttonLink, el } from "./dom";
import { routes } from "./layout";
import { fwIcon } from "./websiteFigmaIcons";

const WEB_FEATURES = [
  {
    icon: "bot" as const,
    title: "AI-Powered Lead Capture",
    desc: "Intelligent chat agents that qualify and capture leads 24/7 — while you sleep."
  },
  {
    icon: "zap" as const,
    title: "Blazing Performance",
    desc: "Sub-second load times. We obsess over Core Web Vitals so you rank higher and convert faster."
  },
  {
    icon: "code" as const,
    title: "Custom-Built, Not Templated",
    desc: "Every line of code is written for your brand and your goals. No drag-and-drop compromise."
  },
  {
    icon: "shield" as const,
    title: "Enterprise-Grade Security",
    desc: "SSL, GDPR compliance, and routine security audits baked in from day one."
  },
  {
    icon: "layers" as const,
    title: "Seamless Integrations",
    desc: "Connect to your CRM, email platform, analytics, and third-party tools with zero friction."
  },
  {
    icon: "trending" as const,
    title: "Conversion-Optimized",
    desc: "Design decisions backed by data — every page built to turn visitors into customers."
  }
] as const;

const PROCESS_STEPS = [
  {
    n: "01",
    label: "Discover",
    desc: "We learn your business, audience, and goals in a focused strategy session."
  },
  {
    n: "02",
    label: "Design",
    desc: "Pixel-perfect mockups tailored to your brand — reviewed before a single line of code."
  },
  {
    n: "03",
    label: "Build",
    desc: "Custom development with AI integrations wired in from the start."
  },
  {
    n: "04",
    label: "Launch",
    desc: "Go live with full QA, SEO setup, and ongoing support."
  }
] as const;

const AVATAR_COLORS = ["#2d5a27", "#3a6b35", "#4a7f45", "#2a5224"];

function reveal(children: HTMLElement, delay = 0): HTMLElement {
  const node = el("div", {
    class: "fwReveal",
    "data-fw-reveal": "true",
    style: `--fw-reveal-delay: ${delay}ms`
  });
  node.append(children);
  return node;
}

function featureCard(
  icon: (typeof WEB_FEATURES)[number]["icon"],
  title: string,
  desc: string,
  delay: number
): HTMLElement {
  return reveal(
    el("article", { class: "fwFeatureCard" }, [
      el("div", { class: "fwFeatureIcon" }, [fwIcon(icon)]),
      el("h3", { class: "fwFeatureTitle" }, [title]),
      el("p", { class: "fwFeatureDesc" }, [desc])
    ]),
    delay
  );
}

export function renderFigmaWebsite(): HTMLElement {
  const heroCtas = el("div", { class: "fwHeroActions" }, [
    buttonLink(routes.contact, "Book a free consultation", "fwBtn fwBtn--primary"),
    buttonLink(routes.portfolio, "See our work", "fwBtn fwBtn--secondary")
  ]);
  heroCtas.querySelector(".fwBtn--primary")?.append(fwIcon("arrowRight", "fwBtnIcon"));

  const stars = el("div", { class: "fwStars", "aria-hidden": "true" });
  for (let i = 0; i < 5; i += 1) {
    stars.append(fwIcon("star", "fwStar"));
  }

  const avatars = el("div", { class: "fwAvatars", "aria-hidden": "true" });
  AVATAR_COLORS.forEach((color) => {
    avatars.append(el("span", { class: "fwAvatar", style: `background-color: ${color}` }));
  });

  const featureGrid = el("div", { class: "fwFeatureGrid" });
  WEB_FEATURES.forEach((f, i) => {
    featureGrid.append(featureCard(f.icon, f.title, f.desc, i * 60));
  });

  const processGrid = el("div", { class: "fwProcessGrid" });
  PROCESS_STEPS.forEach((s, i) => {
    processGrid.append(
      reveal(
        el("div", { class: "fwProcessStep" }, [
          el("div", { class: "fwProcessNumber" }, [s.n]),
          el("h3", { class: "fwProcessLabel" }, [s.label]),
          el("p", { class: "fwProcessDesc" }, [s.desc])
        ]),
        i * 80
      )
    );
  });

  const ctaBtn = buttonLink(routes.contact, "Book free consultation", "fwBtn fwBtn--primary fwBtn--large");
  ctaBtn.append(fwIcon("arrowRight", "fwBtnIcon"));

  return el("div", { class: "fwPage" }, [
    el("section", { class: "fwHero" }, [
      el("div", { class: "fwHeroGrid", "aria-hidden": "true" }),
      el("div", { class: "fwHeroFade", "aria-hidden": "true" }),
      el("div", { class: "fwContainer fwHeroInner" }, [
        el("div", { class: "fwHeroCopy" }, [
          el("div", { class: "fwBadge" }, [
            el("span", { class: "fwBadgeDot", "aria-hidden": "true" }),
            "AI-integrated web solutions"
          ]),
          el("h1", { class: "fwHeroTitle" }, [
            "Websites that",
            el("br"),
            el("span", { class: "fwHeroTitleAccent" }, ["never miss"]),
            el("br"),
            "a lead."
          ]),
          el("p", { class: "fwHeroLead" }, [
            "We build custom, AI-powered websites tailored to your business — so every visitor is tracked, every inquiry is captured, and your team always has the full picture."
          ]),
          heroCtas,
          el("div", { class: "fwSocialProof" }, [
            avatars,
            el("div", {}, [
              stars,
              el("p", { class: "fwSocialProofText" }, ["Trusted by 40+ businesses"])
            ])
          ])
        ])
      ])
    ]),

    el("section", { class: "fwSection" }, [
      el("div", { class: "fwContainer" }, [
        reveal(
          el("div", { class: "fwSectionIntro fwSectionIntro--center" }, [
            el("p", { class: "fwEyebrow" }, ["What we build"]),
            el("h2", { class: "fwSectionTitle" }, ["Built different. Built for you."]),
            el("p", { class: "fwSectionLead" }, [
              "No templates. No shortcuts. Every website we deliver is engineered from the ground up."
            ])
          ])
        ),
        featureGrid
      ])
    ]),

    el("section", { class: "fwSection fwSection--muted" }, [
      el("div", { class: "fwContainer" }, [
        reveal(el("h2", { class: "fwSectionTitle fwSectionTitle--center" }, ["From brief to live in weeks"])),
        processGrid
      ])
    ]),

    el("section", { class: "fwSection fwSection--cta" }, [
      el("div", { class: "fwContainer fwCta" }, [
        reveal(
          el("div", { class: "fwCtaInner" }, [
            el("h2", { class: "fwSectionTitle" }, ["Ready to stop losing leads?"]),
            el("p", { class: "fwSectionLead fwCtaLead" }, [
              "Book a free 30-minute consultation. We'll show you exactly what we'd build for your business."
            ]),
            ctaBtn
          ])
        )
      ])
    ])
  ]);
}
