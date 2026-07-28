import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type BoardNotifyPayload = {
  event: "created" | "edited" | "status_changed" | "assigned";
  entity: "feature" | "bug" | "decision" | "sprint task" | "launch item";
  title: string;
  assignees?: string[];
  status?: string;
  previousStatus?: string;
  severity?: string;
  owner?: string;
  foundBy?: string;
  detail?: string;
  boardUrl?: string;
};

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;

  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;

  supabase = createClient(url, anonKey);
  return supabase;
}

export async function notifyDiscord(payload: BoardNotifyPayload): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;

  try {
    await fetch("/api/discord-notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...payload,
        boardUrl: payload.boardUrl || `${window.location.origin}/feath-board/`,
      }),
    });
  } catch (error) {
    console.warn("Feath Board Discord notify failed:", error);
  }
}

declare global {
  interface Window {
    __feathBoardNotifyDiscord: (payload: BoardNotifyPayload) => void;
  }
}

window.__feathBoardNotifyDiscord = (payload) => {
  void notifyDiscord(payload);
};
