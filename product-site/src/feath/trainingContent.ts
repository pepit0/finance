import type { LucideIcon } from "lucide-react";
import {
  Blocks,
  Globe,
  HeartHandshake,
  Layers,
  MessageSquare,
  Phone,
  Puzzle,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { siteConfig } from "../site.config";

export const TRAINING_PASSWORD = "FeathTrain26<>";
export const TRAINING_AUTH_KEY = "feath-training-unlocked";
export const TRAINING_PRECALL_KEY = "feath-training-precall";

export type TrainingSection = {
  id: string;
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  summary: string;
  highlights: string[];
};

export type TalkTrack = {
  say: string;
  why: string;
  askNext: string;
};

export type RolePlayPrompt = {
  prompt: string;
  followUps: string[];
};

export type BeforeAfter = {
  beforeLabel: string;
  afterLabel: string;
  beforeSteps: string[];
  afterSteps: string[];
};

export type ReferenceNote = {
  title: string;
  body: string;
  followUp: string;
};

export type CustomerScenario = {
  id: string;
  label: string;
  pain: string;
  askFirst: string;
  recommend: string[];
  sayThis: string;
  avoid: string;
  jumpTo: string;
};

export type PainFlowNode = {
  id: string;
  question: string;
  yesLabel?: string;
  noLabel?: string;
  yes?: string;
  no?: string;
  result?: {
    title: string;
    recommend: string[];
    summary: string;
  };
};

export type CustomerPhrase = {
  phrase: string;
  means: string;
  sell: string;
};

export type DemoCallout = {
  title: string;
  url: string;
  external?: boolean;
  pointAt: string;
  say: string;
  avoid: string;
};

export type PreCallItem = {
  id: string;
  label: string;
};

export const trainingAnchorLine =
  "Find what is broken (site, follow-up, or tools). Recommend the smallest fix. Show how the rest connects later.";

export const trainingSections: TrainingSection[] = [
  {
    id: "mission",
    title: "What we do",
    eyebrow: "Start here",
    icon: HeartHandshake,
    summary: "Modern website, follow-up, and tools that work together, built around how they already run the business.",
    highlights: [
      "Old sites and messy follow-up cost leads and trust",
      "Disconnected tools mean double entry and missed callbacks",
      "We fit their process, not the other way around",
    ],
  },
  {
    id: "websites",
    title: "Custom websites",
    eyebrow: "Most common starting point",
    icon: Globe,
    summary: "Built from scratch for their brand. Fast, mobile-friendly, built to turn visitors into inquiries.",
    highlights: [
      "No templates or cookie-cutter layouts",
      "Looks current on phones and desktop",
      "First impression that matches how good they are in person",
    ],
  },
  {
    id: "crm",
    title: "Feath CRM",
    eyebrow: "Where the follow-up lives",
    icon: Users,
    summary: "Their pipeline, their branding, calls and texts in one place.",
    highlights: [
      "Logo, colors, layout that looks like their business",
      "Pipeline stages match how they actually sell",
      "Calls, texts, and notes stay on the customer record",
    ],
  },
  {
    id: "custom",
    title: "Custom tools and apps",
    eyebrow: "When off-the-shelf is not enough",
    icon: Wrench,
    summary: "Dashboards, portals, and workflows built for a problem they can describe.",
    highlights: [
      "Built for their process, not a product category",
      "Ties into website, CRM, or what they already use",
      "Cuts manual work instead of adding another login",
    ],
  },
  {
    id: "integration",
    title: "Making it all connect",
    eyebrow: "Where leads stop slipping",
    icon: Layers,
    summary: "Forms, CRM, and existing tools share data so nobody re-types the same lead twice.",
    highlights: [
      "Site forms can drop leads straight into the CRM",
      "Keep their current site. We can wire the CRM in",
      "Less copy-paste, fewer forgotten follow-ups",
    ],
  },
  {
    id: "philosophy",
    title: "How to sell this",
    eyebrow: "Read this twice",
    icon: Shield,
    summary: "Consult, do not pitch. Recommend what fits. Walk away when it does not.",
    highlights: [
      "Dated sites kill trust before anyone calls",
      "Our work is real. Say that with confidence",
      "Honesty about fit builds more trust than forcing a package",
    ],
  },
];

export const talkTracks: Record<string, TalkTrack> = {
  mission: {
    say: "Most owners we talk to are not shopping for software. They want fewer missed leads and less time fighting their tools.",
    why: "It reframes the call around their pain, not our product list.",
    askNext: "What happens today after someone inquires on your website or calls in?",
  },
  websites: {
    say: "Your site is often the first handshake. If it looks dated, people assume the business is too, before they ever meet you.",
    why: "Trust and conversion start at the front door, not in the CRM.",
    askNext: "When did you last feel proud sending someone to your website?",
  },
  crm: {
    say: "We shape the CRM around how you sell: your stages, your branding, calls and texts in the same place as the customer.",
    why: "Most CRMs force the team to change. Ours adapts to them.",
    askNext: "Where do leads and follow-ups live right now? Email, spreadsheets, another app?",
  },
  custom: {
    say: "If you can describe the workflow that eats your time, we can usually build something that cuts it down.",
    why: "Custom work lands when they have a specific pain no boxed product fixes.",
    askNext: "Is there a process your team does manually every week that feels like it should be automatic?",
  },
  integration: {
    say: "When a form comes in, someone on your team should see it immediately, not re-type it somewhere else tomorrow.",
    why: "Integration is how leads stop slipping between the site and follow-up.",
    askNext: "Does a website inquiry land where your team actually works today?",
  },
  philosophy: {
    say: "We are not here to sell you everything. We are here to fix what is actually broken and leave the rest alone.",
    why: "Consultative tone beats package-pushing every time.",
    askNext: "If you could fix one thing about how leads and follow-up work today, what would it be?",
  },
};

export const rolePlayPrompts: Record<string, RolePlayPrompt> = {
  mission: {
    prompt: "Walk me through what happens when someone inquires on your website today.",
    followUps: [
      "Who sees it first?",
      "How fast does someone follow up?",
      "Has a lead ever slipped through the cracks?",
    ],
  },
  websites: {
    prompt: "When did you last feel proud sending someone to your website?",
    followUps: ["What would a visitor assume about your business from the site alone?", "Does it work well on a phone?"],
  },
  crm: {
    prompt: "Where do your leads and follow-ups live right now?",
    followUps: ["How do you log calls and texts today?", "Does everyone see the same picture?"],
  },
  custom: {
    prompt: "What does your team do manually every week that feels like it should be automatic?",
    followUps: ["How many apps or spreadsheets are involved?", "What breaks when someone is out sick?"],
  },
  integration: {
    prompt: "When a form comes in on your site, what happens in the next ten minutes?",
    followUps: ["Does it land where your team actually works?", "Does anyone re-type the same info?"],
  },
  philosophy: {
    prompt: "If you could fix one thing about how leads and follow-up work today, what would it be?",
    followUps: ["What is that costing you now?", "What would better look like in plain terms?"],
  },
};

export const beforeAfterBySection: Record<string, BeforeAfter> = {
  mission: {
    beforeLabel: "Before",
    afterLabel: "After Feath",
    beforeSteps: ["Old site", "Email inbox", "Spreadsheet", "Missed callback"],
    afterSteps: ["Modern site", "Lead in CRM", "Text in 5 min", "Deal tracked"],
  },
  websites: {
    beforeLabel: "Before",
    afterLabel: "After",
    beforeSteps: ["Template look", "Slow on mobile", "Visitor leaves"],
    afterSteps: ["Their brand", "Fast load", "Inquiry captured"],
  },
  crm: {
    beforeLabel: "Before",
    afterLabel: "After",
    beforeSteps: ["Phone app", "Spreadsheet", "Sticky notes", "Who called?"],
    afterSteps: ["One CRM", "Calls logged", "Texts in thread", "Team aligned"],
  },
  custom: {
    beforeLabel: "Before",
    afterLabel: "After",
    beforeSteps: ["Manual steps", "3 spreadsheets", "Hours weekly"],
    afterSteps: ["One tool", "Auto handoffs", "Time back"],
  },
  integration: {
    beforeLabel: "Before",
    afterLabel: "After",
    beforeSteps: ["Form submit", "Email alert", "Re-type in CRM", "Forgotten"],
    afterSteps: ["Form submit", "CRM alert", "Assign owner", "Follow up"],
  },
  philosophy: {
    beforeLabel: "Wrong · pitch mode",
    afterLabel: "Right · consult mode",
    beforeSteps: ["List every feature", "Push the biggest package", "Talk over them"],
    afterSteps: ["Ask what hurts", "Recommend one fix", "Earn their trust"],
  },
};

export const customerScenarios: CustomerScenario[] = [
  {
    id: "follow-up",
    label: "Site is fine, follow-up is not",
    pain: "Leads sit in email or voicemail. Nobody owns the next step.",
    askFirst: "What happens in the first hour after someone inquires?",
    recommend: ["CRM + comms", "Integrations"],
    sayThis: "A lot of businesses are not losing leads on the site. They lose them after. Worth mapping that flow together.",
    avoid: "Do not argue about their website. Follow-up might be the whole sale.",
    jumpTo: "crm",
  },
  {
    id: "embarrassed-site",
    label: "Embarrassed by their website",
    pain: "They hesitate to send people to the site. It looks dated on mobile.",
    askFirst: "When did you last feel proud sending someone to your site?",
    recommend: ["Custom website"],
    sayThis: "Your site is the first handshake. If it looks current, people assume the business is too.",
    avoid: "Do not trash their old vendor. Focus on trust and inquiries.",
    jumpTo: "websites",
  },
  {
    id: "has-crm",
    label: "Already has a CRM they hate",
    pain: "Generic funnel, ugly interface, comms in a separate app.",
    askFirst: "What annoys your team most about it today?",
    recommend: ["Feath CRM", "Integrations"],
    sayThis: "You do not have to rip everything out on day one. Branding, built-in texting, and website wiring are usually where we win.",
    avoid: "Do not compare to Salesforce by name. Ask what is broken for them.",
    jumpTo: "crm",
  },
  {
    id: "double-entry",
    label: "Copy-paste between tools",
    pain: "Same lead typed into the site admin, email, and a spreadsheet.",
    askFirst: "Does a website inquiry land where your team actually works?",
    recommend: ["Integrations", "CRM + comms"],
    sayThis: "When a form comes in, someone should see it immediately, not re-type it somewhere else tomorrow.",
    avoid: "Do not sell a full rebuild if they only need wiring.",
    jumpTo: "integration",
  },
  {
    id: "weird-workflow",
    label: "Needs something no app does",
    pain: "Manual process, industry-specific steps, spreadsheets everywhere.",
    askFirst: "What does your team do manually every week that should be automatic?",
    recommend: ["Custom builds"],
    sayThis: "If you can describe the workflow, we can usually build toward it and tie it into what you already use.",
    avoid: "Do not promise a timeline on the first call. Scope it first.",
    jumpTo: "custom",
  },
];

export const painFlowNodes: Record<string, PainFlowNode> = {
  start: {
    id: "start",
    question: "Is follow-up messy? Leads in email, voicemail, or spreadsheets?",
    yesLabel: "Yes, follow-up is the pain",
    noLabel: "No, follow-up is okay",
    yes: "likes-site",
    no: "site-dated",
  },
  "likes-site": {
    id: "likes-site",
    question: "Do they like their current website?",
    yesLabel: "Yes, keep the site",
    noLabel: "No, site needs work too",
    yes: "result-integration",
    no: "result-website-crm",
  },
  "site-dated": {
    id: "site-dated",
    question: "Is their website embarrassing or hard to use on mobile?",
    yesLabel: "Yes, site is a problem",
    noLabel: "No, site is okay",
    yes: "result-website-first",
    no: "result-custom",
  },
  "result-integration": {
    id: "result-integration",
    question: "",
    result: {
      title: "Start with wiring + CRM",
      recommend: ["Integrations", "CRM + comms"],
      summary: "Keep the site. Connect forms to the CRM and give the team calls and texts in one place.",
    },
  },
  "result-website-crm": {
    id: "result-website-crm",
    question: "",
    result: {
      title: "Website + CRM",
      recommend: ["Custom website", "CRM + comms"],
      summary: "New front door plus follow-up in one system. Mention integration so leads never sit in an inbox.",
    },
  },
  "result-website-first": {
    id: "result-website-first",
    question: "",
    result: {
      title: "Website first",
      recommend: ["Custom website"],
      summary: "Fix trust and capture first. Ask about follow-up on the same call. CRM can come next.",
    },
  },
  "result-custom": {
    id: "result-custom",
    question: "",
    result: {
      title: "Dig into custom or integration",
      recommend: ["Custom builds", "Integrations"],
      summary: "Site and follow-up sound okay on the surface. Ask what manual workflow is eating their time.",
    },
  },
};

export const customerPhrases: CustomerPhrase[] = [
  {
    phrase: "We need more leads",
    means: "Usually capture + follow-up, not just traffic.",
    sell: "Website + CRM + wiring forms into follow-up",
  },
  {
    phrase: "Our website is fine",
    means: "Follow-up or back-office pain is often hidden.",
    sell: "CRM + comms, maybe integration only",
  },
  {
    phrase: "We already have software",
    means: "It is painful, ugly, or disconnected.",
    sell: "Customize CRM, integrate, or replace one piece at a time",
  },
  {
    phrase: "We cannot afford downtime",
    means: "They fear chaos during a switch.",
    sell: "Phased rollout: discovery, approve designs, build, launch with support",
  },
  {
    phrase: "We only need one thing",
    means: "That is valid. Upsell comes later.",
    sell: "Website only, CRM only, or custom only. Mention how pieces connect later.",
  },
];

export const demoCallouts: DemoCallout[] = [
  {
    title: "Feath CRM live demo",
    url: siteConfig.demoUrl,
    external: true,
    pointAt: "Pipeline stages and customer record with calls/texts",
    say: "This is shaped around how a team sells, not a generic funnel off the shelf.",
    avoid: "It is like Salesforce or HubSpot",
  },
  {
    title: "Portfolio: real client sites",
    url: "/portfolio/",
    pointAt: "Custom design, mobile layout, contact forms",
    say: "Every site is built from scratch for the brand. No templates.",
    avoid: "We have a theme you pick from",
  },
];

export const preCallChecklist: PreCallItem[] = [
  { id: "pain", label: "I know their main pain (site, follow-up, tools, or custom)" },
  { id: "proof", label: "I have one proof point ready (demo or portfolio example)" },
  { id: "question", label: "I have one discovery question ready to ask first" },
  { id: "focus", label: "I am not planning to pitch everything at once" },
];

export const trainingPillars = [
  { icon: Globe, label: "Custom websites", color: "#3db870" },
  { icon: Phone, label: "CRM + comms", color: "#38bdf8" },
  { icon: Puzzle, label: "Custom builds", color: "#a78bfa" },
  { icon: Zap, label: "Integrations", color: "#f59e0b" },
];

export const crmDepthTags = [
  "Logo and colors",
  "Pipeline stages",
  "Customer fields",
  "Roles and permissions",
  "Call logging",
  "SMS threads",
  "Lead alerts",
  "Mobile access",
];

export const referenceNotes: ReferenceNote[] = [
  {
    title: "They say the website is fine",
    body: "Do not argue. Ask how follow-up works today. Leads in email or voicemail might mean CRM + texting is the whole sale.",
    followUp: "What happens in the first hour after someone inquires?",
  },
  {
    title: "They already have a CRM",
    body: "Ask what annoys them. Customization, branding, built-in comms, and website integration are usually where we win.",
    followUp: "What does your team hate doing in it every day?",
  },
  {
    title: "They worry about downtime",
    body: "Walk through rollout: discovery, they approve designs, we build, we launch with support. Less chaos over time, not more.",
    followUp: "What would a smooth switch look like for your team?",
  },
  {
    title: "They only want one piece",
    body: "That is fine. Website only, CRM only, or custom only. Still mention how pieces connect later so nothing stays broken.",
    followUp: "If that one piece worked perfectly, what would you fix next?",
  },
];

export const outcomeCards = [
  {
    icon: TrendingUp,
    title: "More revenue",
    body: "Leads get captured, assigned, and followed up. Less leaking out.",
  },
  {
    icon: Target,
    title: "Less busywork",
    body: "Fewer spreadsheets and double entries.",
  },
  {
    icon: Sparkles,
    title: "Stronger first impression",
    body: "A current site signals an active, trustworthy business.",
  },
  {
    icon: MessageSquare,
    title: "Better follow-up",
    body: "Calls, texts, and notes in one place.",
  },
  {
    icon: Blocks,
    title: "Room to grow",
    body: "Tools expand with the business instead of hitting a ceiling.",
  },
];

export const guideNav = [
  ...trainingSections.map((s) => ({ id: s.id, label: s.title })),
  { id: "outcomes", label: "Customer payoffs" },
];

export const callPrepNav = [
  { id: "precall", label: "Before your call" },
  { id: "playbook", label: "Situations" },
  { id: "pain-flow", label: "Pain finder" },
  { id: "phrases", label: "Customer words" },
  { id: "demos", label: "Demo callouts" },
  { id: "practice", label: "Practice prompts" },
  { id: "reference", label: "Objection cards" },
];
