export const config = {
  runtime: "edge",
};

type NotifyBody = {
  event: "created" | "edited" | "status_changed" | "assigned";
  entity: string;
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

const TEAM = ["Daniel", "MJ", "Sahand"] as const;

function env(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function mentionFor(name: string): string {
  const id =
    env(`DISCORD_USER_${name.toUpperCase()}`) ||
    (name === "Daniel"
      ? env("DISCORD_USER_DANIEL")
      : name === "MJ"
        ? env("DISCORD_USER_MJ")
        : name === "Sahand"
          ? env("DISCORD_USER_SAHAND")
          : undefined);
  return id ? `<@${id}>` : `**${name}**`;
}

function mentionsFor(names: string[]): string {
  const unique = [...new Set(names.filter(Boolean))];
  if (!unique.length) return "";
  return unique.map(mentionFor).join(" ");
}

function labelStatus(entity: string, status: string | undefined): string | undefined {
  if (!status) return undefined;
  if (entity === "feature") {
    const map: Record<string, string> = {
      shipped: "Shipped",
      "in-progress": "In progress",
      planned: "Planned",
      backlog: "Backlog",
      speculative: "Speculative",
    };
    return map[status] || status;
  }
  if (entity === "bug") {
    const map: Record<string, string> = {
      open: "Open",
      "in-progress": "In progress",
      fixed: "Fixed",
      verified: "Verified",
    };
    return map[status] || status;
  }
  if (entity === "sprint task") {
    const map: Record<string, string> = {
      todo: "This week",
      review: "In review",
      done: "Done",
    };
    return map[status] || status;
  }
  if (entity === "launch item") {
    if (status === "done" || status === "complete") return "Complete";
    if (status === "open" || status === "incomplete") return "Incomplete";
  }
  return status;
}

function headline(body: NotifyBody): string {
  const title = body.title.trim() || "(untitled)";
  switch (body.event) {
    case "created":
      return `New ${body.entity}: ${title}`;
    case "assigned":
      return `${capitalize(body.entity)} reassigned: ${title}`;
    case "status_changed":
      return `${capitalize(body.entity)} status updated: ${title}`;
    default:
      return `${capitalize(body.entity)} updated: ${title}`;
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function embedColor(body: NotifyBody): number {
  if (body.entity === "bug" && body.severity === "P0") return 0xef4444;
  if (body.event === "created") return 0x22c55e;
  if (body.event === "assigned") return 0xf59e0b;
  if (body.event === "status_changed") return 0x3b82f6;
  return 0x6b7280;
}

function shouldNotify(body: NotifyBody): boolean {
  if (body.event === "created") {
    return (body.assignees?.length ?? 0) > 0;
  }
  if (body.event === "status_changed" || body.event === "assigned") {
    return (body.assignees?.length ?? 0) > 0;
  }
  if (body.event === "edited") {
    return false;
  }
  return (body.assignees?.length ?? 0) > 0;
}

function pingTargets(body: NotifyBody): string[] {
  const assignees = body.assignees?.length ? body.assignees : [];
  if (assignees.length) return assignees;
  if (body.owner && body.owner !== "Unassigned" && body.owner !== "All") return [body.owner];
  if (body.owner === "All") return [...TEAM];
  return [];
}

function buildDiscordPayload(body: NotifyBody) {
  const targets = pingTargets(body);
  const mentions = mentionsFor(targets);
  const statusLabel = labelStatus(body.entity, body.status);
  const previousLabel = labelStatus(body.entity, body.previousStatus);

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

  if (body.severity) fields.push({ name: "Severity", value: body.severity, inline: true });
  if (statusLabel) fields.push({ name: "Status", value: statusLabel, inline: true });
  if (previousLabel && body.event === "status_changed") {
    fields.push({ name: "Previous", value: previousLabel, inline: true });
  }
  if (body.owner) fields.push({ name: "Owner", value: body.owner, inline: true });
  if (body.foundBy) fields.push({ name: "Found by", value: body.foundBy, inline: true });
  if (body.detail) fields.push({ name: "Details", value: body.detail.slice(0, 900) });

  const contentParts: string[] = [];
  if (mentions) {
    if (body.event === "created") contentParts.push(`${mentions} — new ${body.entity} for you on Feath Board`);
    else if (body.event === "assigned") contentParts.push(`${mentions} — you've been assigned on Feath Board`);
    else if (body.event === "status_changed") contentParts.push(`${mentions} — status update on Feath Board`);
    else contentParts.push(`${mentions} — Feath Board update`);
  }

  const embed: Record<string, unknown> = {
    title: headline(body),
    color: embedColor(body),
    fields: fields.length ? fields : undefined,
    timestamp: new Date().toISOString(),
  };

  if (body.boardUrl) {
    embed.url = body.boardUrl;
  }

  return {
    content: contentParts.join("\n") || undefined,
    embeds: [embed],
    allowed_mentions: { parse: ["users"] as const },
  };
}

async function verifySupabaseUser(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return false;

  const supabaseUrl = env("VITE_SUPABASE_URL") || env("SUPABASE_URL");
  const anonKey = env("VITE_SUPABASE_ANON_KEY") || env("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return false;

  const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    },
  });

  return res.ok;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const webhookUrl = env("DISCORD_WEBHOOK_URL");
  if (!webhookUrl) {
    return new Response(JSON.stringify({ ok: false, error: "Discord webhook not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!(await verifySupabaseUser(request))) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: NotifyBody;
  try {
    body = (await request.json()) as NotifyBody;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.entity || !body.title || !body.event) {
    return new Response(JSON.stringify({ ok: false, error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!shouldNotify(body)) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const discordRes = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildDiscordPayload(body)),
  });

  if (!discordRes.ok) {
    const detail = await discordRes.text();
    console.error("Discord webhook failed", discordRes.status, detail);
    return new Response(JSON.stringify({ ok: false, error: "Discord webhook failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
