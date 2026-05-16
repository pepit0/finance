import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-marketing-webhook-secret"
};

type PreapprovalRecord = {
  id?: string;
  display_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  street?: string;
  line2?: string | null;
  city?: string;
  province?: string;
  employer?: string;
  gross_monthly_income_cad?: number | string;
  vehicle_interest?: string | null;
  consent_contact?: boolean;
  consent_credit?: boolean;
};

function webhookBool(value: unknown): boolean {
  return value === true || value === "true" || value === "t" || value === 1;
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

  const record = body.record;
  if (!record?.id) {
    return jsonResponse({ ok: false, error: "Missing webhook record.id" }, 400);
  }

  const payload = {
    marketing_lead_id: record.id,
    display_name: record.display_name ?? "",
    email: record.email ?? "",
    phone: record.phone ?? "",
    date_of_birth: record.date_of_birth ?? "",
    street: record.street ?? "",
    line2: record.line2 ?? "",
    city: record.city ?? "",
    province: record.province ?? "",
    employer: record.employer ?? "",
    gross_monthly_income_cad: record.gross_monthly_income_cad ?? 0,
    vehicle_interest: record.vehicle_interest ?? "",
    consent_contact: webhookBool(record.consent_contact),
    consent_credit: webhookBool(record.consent_credit)
  };

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await supabase.rpc("ingest_marketing_preapproval_lead", {
    p_payload: payload
  });

  if (error) {
    console.error("ingest_marketing_preapproval_lead RPC error:", error.message, error);
    return jsonResponse({ ok: false, error: error.message }, 502);
  }

  const result = data as {
    ok?: boolean;
    error?: string;
    duplicate?: boolean;
    comment_error?: string | null;
  } | null;

  console.log("ingest_marketing_preapproval_lead result:", JSON.stringify(result));

  if (!result?.ok) {
    console.error("ingest_marketing_preapproval_lead failed:", result?.error, "payload:", payload);
    return jsonResponse({ ok: false, error: result?.error ?? "Ingest failed" }, 422);
  }

  if (result.comment_error) {
    console.warn(
      "Lead ingested but website comment failed (run sql/crm_marketing_website_lead_comment.sql):",
      result.comment_error
    );
  }

  return jsonResponse({ ok: true, ...result });
});
