export type GlossaryTerm = {
  label: string;
  definition: string;
};

export const termGlossary = {
  crm: {
    label: "CRM",
    definition:
      "Short for Customer Relationship Management. It is the system where the team tracks customers and leads: who called, who needs a follow-up, and where each deal stands. One place instead of sticky notes, spreadsheets, and memory.",
  },
  pipeline: {
    label: "Pipeline",
    definition:
      "The steps a sale moves through from first contact to closed. Example: New lead, then Contacted, then Quote sent, then Sold. Every business is different. We set the CRM up to match their stages.",
  },
  lead: {
    label: "Lead",
    definition:
      "Someone who might become a customer. They filled out a form, called in, or walked through the door. The job is to capture every lead and follow up before they go elsewhere.",
  },
  integration: {
    label: "Integration",
    definition:
      "When two systems share information automatically. Example: a visitor submits a form on the website and that person shows up in the CRM without anyone re-typing the details.",
  },
  branding: {
    label: "Branding",
    definition:
      "How the business presents itself: logo, colors, fonts, overall look. We can match what they already use or help them refresh it from scratch.",
  },
  permissions: {
    label: "Roles and permissions",
    definition:
      "Controls who on the team can see or change what. A salesperson might see their own customers. A manager sees the whole team. Front desk might only see contact info. We configure that per role.",
  },
  funnel: {
    label: "Lead funnel",
    definition:
      "The path on a website that turns a visitor into an inquiry: contact form, book-a-call button, chat widget, etc. We build it so those inquiries land where the team can act on them fast.",
  },
} as const satisfies Record<string, GlossaryTerm>;

export type GlossaryKey = keyof typeof termGlossary;
