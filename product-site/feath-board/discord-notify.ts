import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type BoardNotifyEvent = "created" | "edited" | "status_changed" | "assigned" | "deleted" | "completed";

export type BoardNotifyAttachment = {
  name: string;
  url: string;
};

export type BoardNotifyPayload = {
  event: BoardNotifyEvent;
  entity: "feature" | "bug" | "decision" | "sprint task" | "launch item" | "task";
  entityId: number;
  title: string;
  projectId?: string;
  projectName?: string;
  discordThreadId?: string | null;
  assignees?: string[];
  status?: string;
  previousStatus?: string;
  severity?: string;
  difficulty?: string;
  owner?: string;
  owners?: string[];
  foundBy?: string;
  description?: string;
  steps?: string;
  expected?: string;
  category?: string;
  group?: string;
  linkedFeature?: string;
  attachments?: BoardNotifyAttachment[];
  detail?: string;
  boardUrl?: string;
};

export type BoardNotifyResult = {
  ok?: boolean;
  skipped?: boolean;
  threadId?: string | null;
  archived?: boolean;
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

export async function notifyDiscord(payload: BoardNotifyPayload): Promise<BoardNotifyResult> {
  const client = getSupabase();
  if (!client) return { ok: false };

  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return { ok: false };

  try {
    const res = await fetch("/api/discord-notify", {
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

    if (!res.ok) return { ok: false };
    return (await res.json()) as BoardNotifyResult;
  } catch (error) {
    console.warn("Feath Board Discord notify failed:", error);
    return { ok: false };
  }
}

declare global {
  interface Window {
    __feathBoardNotifyDiscord: (
      payload: BoardNotifyPayload,
      onResult?: (result: BoardNotifyResult) => void,
    ) => void;
  }
}

window.__feathBoardNotifyDiscord = (payload, onResult) => {
  void notifyDiscord(payload).then((result) => {
    if (onResult) onResult(result);
  });
};
