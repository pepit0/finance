export type CrmPhoneIntelligence = {
  looked_up_at: string;
  valid: boolean;
  e164: string;
  national_format: string | null;
  country_code: string | null;
  line_type: string | null;
  carrier_name: string | null;
  caller_name: string | null;
  from_city: string | null;
  from_state: string | null;
  from_country: string | null;
};

function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function parsePhoneIntelligence(metadata: Record<string, unknown> | null | undefined): CrmPhoneIntelligence | null {
  const raw = metadata?.phone_intelligence;
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const intel = raw as Record<string, unknown>;
  return {
    looked_up_at: typeof intel.looked_up_at === "string" ? intel.looked_up_at : "",
    valid: Boolean(intel.valid),
    e164: typeof intel.e164 === "string" ? intel.e164 : "",
    national_format: typeof intel.national_format === "string" ? intel.national_format : null,
    country_code: typeof intel.country_code === "string" ? intel.country_code : null,
    line_type: typeof intel.line_type === "string" ? intel.line_type : null,
    carrier_name: typeof intel.carrier_name === "string" ? intel.carrier_name : null,
    caller_name: typeof intel.caller_name === "string" ? intel.caller_name : null,
    from_city: typeof intel.from_city === "string" ? intel.from_city : null,
    from_state: typeof intel.from_state === "string" ? intel.from_state : null,
    from_country: typeof intel.from_country === "string" ? intel.from_country : null
  };
}

export function formatPhoneIntelligenceSummary(intel: CrmPhoneIntelligence): string | null {
  const parts: string[] = [];

  if (intel.line_type) {
    parts.push(titleCase(intel.line_type));
  }
  if (intel.carrier_name) {
    parts.push(intel.carrier_name);
  }

  const locationParts = [intel.from_city, intel.from_state, intel.from_country].filter(Boolean);
  if (locationParts.length > 0) {
    parts.push(locationParts.join(", "));
  }

  if (intel.caller_name) {
    parts.push(`Caller ID: ${intel.caller_name}`);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}
