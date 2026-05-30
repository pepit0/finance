import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-marketing-webhook-secret"
};

type PreapprovalRecord = Record<string, unknown> & {
  id?: string;
  display_name?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  dateOfBirth?: string;
  street?: string;
  line2?: string | null;
  city?: string;
  province?: string;
  employer?: string;
  gross_monthly_income_cad?: number | string;
  grossMonthlyIncomeCad?: number | string;
  vehicle_interest?: string | null;
  vehicleInterest?: string | null;
  consent_contact?: unknown;
  consentContact?: unknown;
  consent_credit?: unknown;
  consentCredit?: unknown;
};

type IngestPayload = {
  marketing_lead_id: string;
  display_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  street: string;
  line2: string;
  city: string;
  province: string;
  employer: string;
  gross_monthly_income_cad: number | string;
  vehicle_interest: string;
  consent_contact: boolean;
  consent_credit: boolean;
};

function webhookBool(value: unknown): boolean {
  return value === true || value === "true" || value === "t" || value === 1;
}

function readRecordString(record: PreapprovalRecord, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return "";
}

function buildIngestPayload(record: PreapprovalRecord): IngestPayload {
  return {
    marketing_lead_id: readRecordString(record, "id", "marketing_lead_id", "marketingLeadId"),
    display_name: readRecordString(record, "display_name", "displayName"),
    email: readRecordString(record, "email"),
    phone: readRecordString(record, "phone"),
    date_of_birth: readRecordString(record, "date_of_birth", "dateOfBirth"),
    street: readRecordString(record, "street"),
    line2: readRecordString(record, "line2", "address_line2", "addressLine2"),
    city: readRecordString(record, "city"),
    province: readRecordString(record, "province"),
    employer: readRecordString(record, "employer"),
    gross_monthly_income_cad:
      readRecordString(record, "gross_monthly_income_cad", "grossMonthlyIncomeCad") || "0",
    vehicle_interest: readRecordString(record, "vehicle_interest", "vehicleInterest"),
    consent_contact: webhookBool(record.consent_contact ?? record.consentContact),
    consent_credit: webhookBool(record.consent_credit ?? record.consentCredit)
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

/** Dashboard Test often only sends Authorization; webhooks should use X-Marketing-Webhook-Secret. */
function readProvidedWebhookSecret(req: Request): string | null {
  const fromHeader = req.headers.get("X-Marketing-Webhook-Secret")?.trim();
  if (fromHeader) {
    return fromHeader;
  }

  const auth = req.headers.get("Authorization")?.trim();
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    // Skip Supabase JWTs (dashboard default); allow Bearer <your MARKETING_WEBHOOK_SECRET> for testing.
    if (token && !token.startsWith("eyJ")) {
      return token;
    }
  }

  return null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function displayOrDash(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "(not provided)";
}

function parseNotifyEmails(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }
  return [...new Set(raw.split(",").map((email) => email.trim()).filter(Boolean))];
}

type LeadNotifySettings = {
  from: string;
  recipients: string[];
  crmUrl: string;
};

/** One JSON secret fits Supabase free-tier limits: {"from":"Name <a@b.com>","to":"a@b.com,b@b.com","crm_url":"https://..."} */
function readLeadNotifySettings(): LeadNotifySettings {
  const configRaw = Deno.env.get("LEAD_NOTIFY_CONFIG")?.trim();
  if (configRaw) {
    try {
      const config = JSON.parse(configRaw) as {
        from?: string;
        to?: string | string[];
        crm_url?: string;
        crmUrl?: string;
      };
      return {
        from: config.from?.trim() ?? "",
        recipients: parseNotifyEmails(
          typeof config.to === "string" ? config.to : Array.isArray(config.to) ? config.to.join(",") : ""
        ),
        crmUrl: (config.crm_url ?? config.crmUrl ?? "").trim()
      };
    } catch (error) {
      console.error("LEAD_NOTIFY_CONFIG is not valid JSON:", error);
      return { from: "", recipients: [], crmUrl: "" };
    }
  }

  return {
    from: Deno.env.get("LEAD_NOTIFY_FROM")?.trim() ?? "",
    recipients: parseNotifyEmails(Deno.env.get("LEAD_NOTIFY_EMAILS")),
    crmUrl: Deno.env.get("LEAD_NOTIFY_CRM_URL")?.trim() ?? ""
  };
}

async function sendLeadNotificationEmail(payload: IngestPayload): Promise<{ sent: boolean; error?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  const { from, recipients, crmUrl } = readLeadNotifySettings();

  if (!apiKey || recipients.length === 0) {
    return { sent: false };
  }
  if (!from) {
    return {
      sent: false,
      error:
        "Sender not configured. Set LEAD_NOTIFY_CONFIG JSON (from + to) or LEAD_NOTIFY_FROM when RESEND_API_KEY is set."
    };
  }

  const name = displayOrDash(payload.display_name);
  const subject = `New website lead: ${name}`;
  const addressParts = [payload.street, payload.line2, payload.city, payload.province].filter((part) => part.trim());
  const addressLine = addressParts.length > 0 ? addressParts.join(", ") : "(not provided)";

  const rows: [string, string][] = [
    ["Name", name],
    ["Phone", displayOrDash(payload.phone)],
    ["Email", displayOrDash(payload.email)],
    ["Date of birth", displayOrDash(payload.date_of_birth)],
    ["Address", addressLine],
    ["Employer", displayOrDash(payload.employer)],
    ["Monthly income (CAD)", displayOrDash(String(payload.gross_monthly_income_cad))],
    ["Vehicle interest", displayOrDash(payload.vehicle_interest)],
    ["Consent to contact", payload.consent_contact ? "Yes" : "No"],
    ["Consent for credit inquiry", payload.consent_credit ? "Yes" : "No"]
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>` +
        `<td style="padding:6px 0;vertical-align:top;">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const crmLink = crmUrl
    ? `<p style="margin:20px 0 0;"><a href="${escapeHtml(crmUrl)}">Open CRM → System leads</a></p>`
    : "";

  const html =
    `<p><strong>${escapeHtml(name)}</strong> submitted a credit pre-approval on the marketing site.</p>` +
    `<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;line-height:1.4;">${tableRows}</table>` +
    crmLink;

  const text = [
    `${name} submitted a credit pre-approval on the marketing site.`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    crmUrl ? `\nOpen CRM: ${crmUrl}` : ""
  ]
    .filter((line) => line !== undefined)
    .join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject,
      html,
      text
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    return { sent: false, error: `Resend API ${response.status}: ${detail}` };
  }

  return { sent: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  const expectedSecret = Deno.env.get("MARKETING_WEBHOOK_SECRET")?.trim();
  const providedSecret = readProvidedWebhookSecret(req);
  if (!expectedSecret) {
    return jsonResponse(
      {
        ok: false,
        error:
          "MARKETING_WEBHOOK_SECRET is not set. Edge Functions → Secrets (CRM project): Key = MARKETING_WEBHOOK_SECRET, Value = your password."
      },
      500
    );
  }
  if (!providedSecret || providedSecret !== expectedSecret) {
    return jsonResponse(
      {
        ok: false,
        error:
          "Unauthorized. Secrets page: Key MARKETING_WEBHOOK_SECRET, Value = your password. Test: custom header X-Marketing-Webhook-Secret = same password (NOT the text MARKETING_WEBHOOK_SECRET). Or Authorization Bearer <password>."
      },
      401
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ ok: false, error: "Server configuration error" }, 500);
  }

  let body: { record?: PreapprovalRecord; type?: string; table?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const record = body.record as PreapprovalRecord | undefined;
  if (!record?.id) {
    return jsonResponse({ ok: false, error: "Missing webhook record.id" }, 400);
  }

  // Forward the full webhook envelope so Postgres sees every column (not a trimmed subset).
  const emailPayload = buildIngestPayload(record);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await supabase.rpc("ingest_marketing_preapproval_lead", {
    p_payload: body
  });

  if (error) {
    console.error("ingest_marketing_preapproval_lead RPC error:", error.message, error);
    return jsonResponse({ ok: false, error: error.message }, 502);
  }

  const result = data as {
    ok?: boolean;
    error?: string;
    duplicate?: boolean;
    refreshed_existing?: boolean;
    system_lead_id?: string;
    customer_id?: string;
    comment_error?: string | null;
  } | null;

  console.log("ingest_marketing_preapproval_lead result:", JSON.stringify(result));

  if (!result?.ok) {
    console.error("ingest_marketing_preapproval_lead failed:", result?.error, "record.id:", record.id);
    return jsonResponse({ ok: false, error: result?.error ?? "Ingest failed" }, 422);
  }

  if (result.duplicate) {
    console.warn(
      "Duplicate marketing lead id — no new system lead or email. Submit a fresh pre-approval (new id) to test.",
      record.id
    );
  }

  if (result.comment_error) {
    console.warn(
      "Lead ingested but website comment failed (run sql/crm_marketing_website_lead_comment.sql):",
      result.comment_error
    );
  }

  let email_sent = false;
  let email_error: string | null = null;
  if (!result.duplicate) {
    const emailResult = await sendLeadNotificationEmail(emailPayload);
    email_sent = emailResult.sent;
    if (emailResult.error) {
      email_error = emailResult.error;
      console.warn("Lead notification email failed:", emailResult.error);
    } else if (emailResult.sent) {
      console.log("Lead notification email sent to:", readLeadNotifySettings().recipients.join(", "));
    } else {
      console.log(
        "Lead notification email skipped (set RESEND_API_KEY + LEAD_NOTIFY_CONFIG with from and to)."
      );
    }
  }

  const responseBody = {
    ok: true,
    ...result,
    email_sent,
    email_error,
    marketing_lead_id: record.id
  };
  console.log("ingest-marketing-preapproval response:", JSON.stringify(responseBody));
  return jsonResponse(responseBody);
});
