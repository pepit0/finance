import { getSupabase } from "./supabaseClient";

export type PrototypeShare = {
  id: string;
  embedSrc: string;
  title: string;
};

export function buildShortViewUrl(origin: string, id: string): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}/v/${id}`;
}

export async function createPrototypeShare(
  embedSrc: string,
  title?: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const client = getSupabase();
  if (!client) {
    return {
      ok: false,
      error: "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    };
  }

  const { data, error } = await client.rpc("create_feath_prototype_share", {
    p_embed_src: embedSrc,
    p_title: title?.trim() || "",
  });

  if (error) {
    if (/feath_prototype_shares|create_feath_prototype_share|schema cache|does not exist/i.test(error.message)) {
      return {
        ok: false,
        error: "Short links are not set up yet. Run sql/feath_prototype_shares.sql in Supabase, then try again.",
      };
    }
    return { ok: false, error: error.message };
  }

  if (typeof data !== "string" || !data) {
    return { ok: false, error: "Could not create a short link." };
  }

  return { ok: true, id: data };
}

export async function loadPrototypeShare(
  id: string
): Promise<{ ok: true; share: PrototypeShare } | { ok: false; error: string }> {
  const trimmed = id.trim();
  if (!/^[a-z0-9]{6,16}$/i.test(trimmed)) {
    return { ok: false, error: "This link is invalid." };
  }

  const client = getSupabase();
  if (!client) {
    return {
      ok: false,
      error: "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    };
  }

  const { data, error } = await client
    .from("feath_prototype_shares")
    .select("id, embed_src, title")
    .eq("id", trimmed)
    .maybeSingle();

  if (error) {
    if (/feath_prototype_shares|schema cache|does not exist/i.test(error.message)) {
      return {
        ok: false,
        error: "Short links are not set up yet. Run sql/feath_prototype_shares.sql in Supabase.",
      };
    }
    return { ok: false, error: error.message };
  }

  if (!data?.embed_src) {
    return { ok: false, error: "This prototype link was not found." };
  }

  return {
    ok: true,
    share: {
      id: data.id,
      embedSrc: data.embed_src,
      title: typeof data.title === "string" ? data.title : "",
    },
  };
}
