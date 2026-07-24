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

export const TRAINING_PASSWORD = "FeathTrain26<>";
export const TRAINING_AUTH_KEY = "feath-training-unlocked";

export type TrainingSection = {
  id: string;
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  summary: string;
  highlights: string[];
  detail: string;
};

export type ReferenceNote = {
  title: string;
  body: string;
};

export const trainingSections: TrainingSection[] = [
  {
    id: "mission",
    title: "What we do",
    eyebrow: "Start here",
    icon: HeartHandshake,
    summary:
      "We take customers off outdated, slow systems and put them on modern tools that actually work together.",
    highlights: [
      "Their old website or software costs them leads and trust",
      "Disconnected tools mean double entry, missed follow-ups, and wasted time",
      "We build things that fit how they already run the business",
    ],
    detail:
      "Most owners we talk to are not looking for 'software.' They want fewer headaches, more leads captured, and a business that looks current. That is the job. We modernize their front end (website), their follow-up (CRM, calls, texts), and anything in between. If something custom fills a gap, we build that too.",
  },
  {
    id: "websites",
    title: "Custom websites",
    eyebrow: "Most common starting point",
    icon: Globe,
    summary:
      "Every site is built from scratch. It matches their brand, or we help them reshape the brand if they want a fresh direction.",
    highlights: [
      "No templates. No cookie-cutter layouts.",
      "Fast load times and a clean, professional look",
      "Built to turn visitors into inquiries, not just look pretty",
    ],
    detail:
      "Their website is often the first handshake. If it looks old or generic, people assume the business is too. We fix that. Some customers have strong branding already. We honor it. Others want a full visual reset based on their ideas. Both are fine. The point is: it should feel like them, and it should work on phones.",
  },
  {
    id: "crm",
    title: "Feath CRM",
    eyebrow: "Where the follow-up lives",
    icon: Users,
    summary:
      "A CRM they can shape around their pipeline, their team, and their look. Calling and texting are built in.",
    highlights: [
      "Branding and layout go deep: logo, colors, header, the works",
      "Pipeline stages match how they actually sell, not a generic funnel",
      "Roles and permissions control who sees what",
      "Calls and texts live in the same place as customer records",
    ],
    detail:
      "A lot of CRMs force the team to change how they work. Ours is the opposite. We set up stages, fields, and access the way the customer already thinks about their process. Sales staff log calls, send texts, and move deals without jumping between apps. Managers see what they need. Front desk sees what they need. Nothing extra cluttering the screen.",
  },
  {
    id: "custom",
    title: "Custom tools and apps",
    eyebrow: "When off-the-shelf is not enough",
    icon: Wrench,
    summary:
      "Dashboards, internal tools, one-off workflows. If they can describe the problem, we can usually build toward it.",
    highlights: [
      "Built for their process, not a generic product category",
      "Can tie into the website, CRM, or what they already use",
      "Meant to cut manual work, not add another login",
    ],
    detail:
      "Not every customer stops at a website and CRM. Sometimes they need a lender matching tool, a customer portal, an ops dashboard, or something nobody sells out of the box. That is custom work. We treat it seriously because it is often where the biggest time savings show up.",
  },
  {
    id: "integration",
    title: "Making it all connect",
    eyebrow: "This is where leads stop slipping",
    icon: Layers,
    summary:
      "Website forms, CRM, and their existing tools can share data so nobody re-types the same lead twice.",
    highlights: [
      "A form on their site can drop leads straight into the CRM",
      "If they like their current site, we can still wire the CRM into what they have",
      "Less copy-paste, fewer 'I forgot to follow up' moments",
    ],
    detail:
      "One piece alone helps. Connected pieces help more. When a visitor fills out a form, someone on the team should see it immediately. When they already invested in a platform they do not want to replace, we integrate instead of ripping everything out. Meet them where they are, then close the gaps.",
  },
  {
    id: "philosophy",
    title: "How to sell this",
    eyebrow: "Read this twice",
    icon: Shield,
    summary:
      "We are not here to push product. We are here because this work actually helps people run a tighter business.",
    highlights: [
      "If their site looks dated, trust drops before anyone calls",
      "Our stuff works in the field. Say that with confidence because it is true.",
      "If something is not a fit, say so. That builds more trust than forcing a package",
    ],
    detail:
      "You should believe what you are offering. Customers can tell when you do. We help them look professional, capture every lead, and spend less time fighting software. That is real value. Talk like a consultant: ask what is broken, explain what we would fix, and only recommend what makes sense. Professionalism matters. Sloppy websites and messy follow-up cost them money. We fix both.",
  },
];

export const trainingPillars = [
  { icon: Globe, label: "Custom websites", color: "#3db870" },
  { icon: Phone, label: "CRM + comms", color: "#38bdf8" },
  { icon: Puzzle, label: "Custom builds", color: "#a78bfa" },
  { icon: Zap, label: "Integrations", color: "#f59e0b" },
];

export const crmDepthTags = [
  "Logo and colors",
  "Header and layout",
  "Pipeline stages",
  "Customer fields",
  "Roles and permissions",
  "Call logging",
  "SMS threads",
  "Lead alerts",
  "Mobile access",
  "Team directory",
];

export const referenceNotes: ReferenceNote[] = [
  {
    title: "They say the website is fine",
    body:
      "Do not argue. Ask how follow-up works today. Often the real pain is leads sitting in email or voicemail. CRM plus texting and calling might be the whole sale.",
  },
  {
    title: "They already have a CRM",
    body:
      "Ask what annoys them about it. Customization, branding, built-in comms, and website integration are usually where we win. They do not have to rip everything out on day one.",
  },
  {
    title: "They worry about downtime",
    body:
      "Walk them through how we roll things out: discovery, they approve designs, we build, we launch with support. We are reducing workload over time, not dropping chaos on their team.",
  },
  {
    title: "They only want one piece",
    body:
      "That is fine. Website only, CRM only, or a custom tool only. We still explain how pieces connect later so they know nothing has to stay broken.",
  },
];

export const outcomeCards = [
  {
    icon: TrendingUp,
    title: "More revenue",
    body: "Inquiries get captured, assigned, and followed up. Less leaking out of the funnel.",
  },
  {
    icon: Target,
    title: "Less busywork",
    body: "Fewer spreadsheets, fewer double entries, fewer 'where did that lead go' moments.",
  },
  {
    icon: Sparkles,
    title: "Stronger first impression",
    body: "A current-looking site tells people the business is active and worth trusting.",
  },
  {
    icon: MessageSquare,
    title: "Better follow-up",
    body: "Calls, texts, and notes in one place so the next person picks up with context.",
  },
  {
    icon: Blocks,
    title: "Room to grow",
    body: "Pipelines and tools can expand with the business instead of hitting a ceiling.",
  },
];
