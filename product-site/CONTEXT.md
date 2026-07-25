# Feath product-site context (feath.xyz)

Brief for anyone writing, designing, or building on the Feath marketing site. For internal sales language, see `/training/` (password-protected sales reference).

---

## Brand status quo

**Who we are**  
Feath builds custom digital systems for businesses that need to look professional, capture every lead, and stop fighting outdated software. We are consultants and builders, not a template shop or generic SaaS pitch.

**Domain & product**  
- Live marketing site: **feath.xyz**  
- Repo path: `product-site/` (Vite + React, deployed from `playground` branch)  
- CRM product and demos live in the same monorepo; the marketing site sells the *services*, not a self-serve signup

**Positioning (one line)**  
Business solutions that convert — custom websites, Feath CRM, integrations, and bespoke tools that work together.

**Voice & tone**  
- Plain language, confident, consultative  
- No hype, no em dashes, no “AI slop” phrasing  
- Speak like a sales trainer or trusted advisor: diagnose the problem, recommend what fits, walk away if it does not  
- Professionalism is a recurring theme: dated websites and messy follow-up cost real money and trust

**Visual identity (marketing site)**  
- Default theme: **dark mode** (light mode toggle available)  
- Primary green: `#3db870` (dark) / `#1e7c4a` (light)  
- Fonts: **DM Sans** (body), **Plus Jakarta Sans** (display/headlines)  
- Logo: green rounded-square mark with feather icon; theme-aware light/dark SVG assets  
- UI: clean cards, subtle borders, green accents, glow on primary CTAs  
- Tagline on site: “Built with precision.” (footer)

**Contact & social**  
- Email: info@feath.xyz  
- Phone: (587) 400-0985  
- Instagram: instagram.com/feath.ai (linked in footer + Book page)  
- Facebook: placeholder icon only until URL is set in `site.config.ts`

**Founders narrative (About page)**  
Three co-founders from Richmond Hill, Ontario — dev, marketing, and creative — focused on making modern business tools accessible to owners regardless of tech savviness.

---

## What we do (core offer)

Reference: internal `/training/` page. Summary in four pillars:

1. **Custom websites**  
   100% bespoke, no templates. Match existing brand or help redesign from the customer’s ideas. Fast, mobile-friendly, built to convert visitors into inquiries. Often the first handshake with a prospect’s business.

2. **Feath CRM**  
   Deeply customizable CRM: branding, layout, pipeline stages, roles/permissions, customer fields. Built-in **calling and texting** so follow-up stays in one place. Shaped around *their* sales process, not a generic funnel.

3. **Custom tools & apps**  
   Internal dashboards, workflows, portals, industry-specific tools (e.g. lender matching). Connects to website, CRM, or systems they already use. Goal: cut manual work, not add another login.

4. **Integrations**  
   Website lead capture → CRM automatically. If they keep an existing site or stack, wire Feath in instead of rip-and-replace. Fewer double entries, fewer leads slipping through.

**In-house products we also showcase (Portfolio)**  
Feath CRM, Finance Decision Engine, Kamr, Burd, Temptation Motorsports — proof we build and ship real products, not just client sites.

**How we sell (non-negotiable mindset)**  
We are not pushing product for its own sake. We believe the work helps customers run a tighter business: more revenue captured, less busywork, stronger first impression, better follow-up. If something is not a fit, say so.

---

## Site objective

**Primary job of feath.xyz**  
Turn qualified visitors into **booked consultations** and credible conversations — not instant checkout.

**Main conversion path**  
Home → understand offer → Portfolio/Pricing/CRM pages for depth → **Book** (`/contact/`) free 30-minute consultation.

**Secondary goals**  
- Establish trust and professionalism (design quality = proxy for delivery quality)  
- Explain AI-integrated websites and CRM without jargon overload  
- Show real work (portfolio, live demos, process steps)  
- Support sales team with hidden **sales training** at `/training/` (not in nav, password gated, noindex)

**Audience**  
Business owners and operators with outdated or disconnected systems — dealerships, service businesses, teams losing leads to email/voicemail/spreadsheets, anyone whose website does not match how good they are in person.

**Success looks like**  
- Visitor understands: custom build + optional CRM + integration + custom tools  
- Visitor trusts Feath looks and talks like a serious partner  
- Visitor books a call or reaches out via phone/email/social  
- Sales team can speak consistently using `/training/` as the source of truth

---

## Current site structure (public)

| Route | Purpose |
|-------|---------|
| `/` | Home — AI-integrated websites, hero, features, process, CTA |
| `/crm/` | Feath CRM capabilities and previews |
| `/portfolio/` | Case studies / in-house products |
| `/pricing/` | Pricing builder / tiers |
| `/about/` | Founders, story, how we work |
| `/contact/` | Book consultation (calendar + form) |
| `/share/`, `/view/` | Internal Figma prototype sharing (team tooling) |
| `/training/` | Internal sales reference (hidden, password) |
| `/feath-board/` | Internal team board (alt-click logo on home) |

**Global chrome**  
Nav: CRM, Portfolio, Pricing, About, Book. Footer: solutions links, contact, social icons. Theme toggle (dark/light).

---

## Messaging hooks to reuse

- Replace outdated, clunky systems with modern, fast tools that **work together**  
- Capture every lead — nothing slips through the cracks  
- Custom, not template; professional presence builds trust before the first call  
- CRM adapts to *their* pipeline, team, and brand  
- Meet customers where they are; integrate before forcing rip-and-replace  
- Less time fighting software, more time on work that drives revenue  

**Hero angles on site today**  
“Websites built to [convert / automate / …]” · AI lead capture · 24/7 support · modern design · constant updates · 100% custom code  

---

## Technical notes (for builders)

- Config hub: `product-site/src/site.config.ts`  
- Feath React app: `product-site/src/feath/`  
- Deploy: Vercel, root `product-site`, branch `playground`  
- Training password & content: `trainingContent.ts`, `termGlossary.ts` (do not expose password in public docs)

---

## Open / future

- Facebook social link (URL empty in config)  
- `main` branch may lag `playground` for product-site; feath.xyz deploys from latest playground work  
- CRM demo URL configurable via `VITE_DEMO_URL`
