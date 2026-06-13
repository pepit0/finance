import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const cronSecret = Deno.env.get("STALE_LEAD_CRON_SECRET")?.trim();
  const headerSecret = req.headers.get("x-cron-secret")?.trim();
  if (!cronSecret || headerSecret !== cronSecret) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ ok: false, error: "Missing Supabase env" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const staleHours = Number(Deno.env.get("STALE_LEAD_HOURS") ?? "12");
  const { data, error } = await supabase.rpc("notify_stale_active_leads", {
    p_stale_hours: Number.isFinite(staleHours) && staleHours > 0 ? staleHours : 12
  });

  if (error) {
    console.error("notify_stale_active_leads failed:", error.message);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  console.log("check-stale-leads result:", JSON.stringify(data));
  return new Response(JSON.stringify({ ok: true, result: data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
