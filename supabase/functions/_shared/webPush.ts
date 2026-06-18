import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import webpush from "npm:web-push@3.6.7";

export type WebPushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
};

let vapidReady = false;

function ensureVapidConfigured(): boolean {
  if (vapidReady) {
    return true;
  }

  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY")?.trim();
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY")?.trim();
  const subject = Deno.env.get("VAPID_SUBJECT")?.trim();
  if (!publicKey || !privateKey || !subject) {
    console.warn("webPush: VAPID keys not configured");
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidReady = true;
  return true;
}

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function isStalePushError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const statusCode = "statusCode" in error ? Number((error as { statusCode: number }).statusCode) : 0;
  return statusCode === 404 || statusCode === 410;
}

export async function sendWebPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: WebPushPayload
): Promise<void> {
  if (!ensureVapidConfigured()) {
    return;
  }

  const { data: rows, error } = await supabase
    .from("crm_push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) {
    console.error("sendWebPushToUser: subscription query failed", error.message);
    return;
  }

  const subscriptions = (rows ?? []) as PushSubscriptionRow[];
  if (!subscriptions.length) {
    return;
  }

  const body = JSON.stringify(payload);
  const staleIds: string[] = [];
  const now = new Date().toISOString();

  await Promise.allSettled(
    subscriptions.map(async (row) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: {
              p256dh: row.p256dh,
              auth: row.auth
            }
          },
          body
        );
        await supabase.from("crm_push_subscriptions").update({ last_seen_at: now }).eq("id", row.id);
      } catch (sendError) {
        if (isStalePushError(sendError)) {
          staleIds.push(row.id);
          return;
        }
        console.error("sendWebPushToUser: send failed", {
          userId,
          endpoint: row.endpoint,
          sendError
        });
      }
    })
  );

  if (staleIds.length) {
    const { error: deleteError } = await supabase.from("crm_push_subscriptions").delete().in("id", staleIds);
    if (deleteError) {
      console.error("sendWebPushToUser: stale subscription cleanup failed", deleteError.message);
    }
  }
}
