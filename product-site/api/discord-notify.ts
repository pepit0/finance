export const config = {
  runtime: "edge",
};

type NotifyEvent = "created" | "status_changed" | "assigned" | "deleted" | "completed" | "edited";

type NotifyAttachment = { name: string; url: string };

type NotifyBody = {
  event: NotifyEvent;
  entity: string;
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
  attachments?: NotifyAttachment[];
  detail?: string;
  boardUrl?: string;
};

const TEAM = ["Daniel", "MJ", "Sahand"] as const;

function env(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function projectEnvSuffix(projectId: string): string {
  return projectId.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

function resolveWebhookUrl(projectId?: string): string | undefined {
  if (projectId) {
    const projectWebhook = env(`DISCORD_WEBHOOK_URL_${projectEnvSuffix(projectId)}`);
    if (projectWebhook) return projectWebhook;
  }
  return env("DISCORD_WEBHOOK_URL");
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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function projectSuffix(projectName: string | undefined): string {
  return projectName ? ` in **${projectName}**` : "";
}

function buildCreatedContent(body: NotifyBody): string {
  const projectLabel = projectSuffix(body.projectName);
  const mentions = mentionsFor(pingTargets(body));

  if (body.entity === "bug") {
    return mentions
      ? `${mentions} — **New bug** on Feath Board${projectLabel}`
      : `**New bug** on Feath Board${projectLabel}`;
  }

  if (body.entity === "feature") {
    return mentions
      ? `${mentions} — **New feature** on Feath Board${projectLabel}`
      : `**New feature** on Feath Board${projectLabel}`;
  }

  const label = capitalize(body.entity);
  return mentions
    ? `${mentions} — new ${body.entity} on Feath Board${projectLabel}`
    : `New ${label} on Feath Board${projectLabel}`;
}

function buildCreatedEmbedTitle(body: NotifyBody): string {
  const title = body.title.trim() || "(untitled)";
  if (body.entity === "bug") return `New bug: ${title}`;
  if (body.entity === "feature") return `New feature: ${title}`;
  return `${capitalize(body.entity)}: ${title}`;
}

function buildStatusChangeContent(body: NotifyBody): string | undefined {
  const projectLabel = projectSuffix(body.projectName);
  const statusLabel = labelStatus(body.entity, body.status);
  const previousLabel = labelStatus(body.entity, body.previousStatus);
  const title = body.title.trim() || "(untitled)";

  if (!statusLabel) return undefined;

  if (body.entity === "bug") {
    if (previousLabel && previousLabel !== statusLabel) {
      return `**${title}** — status changed: **${previousLabel}** → **${statusLabel}**${projectLabel}`;
    }

    switch (body.status) {
      case "in-progress":
        return `**${title}** — bug is now **In progress**${projectLabel}`;
      case "fixed":
        return `**${title}** — bug marked **Fixed**${projectLabel}`;
      case "verified":
        return `**${title}** — bug **Verified**${projectLabel}`;
      case "open":
        return `**${title}** — bug is **Open**${projectLabel}`;
      default:
        return `**${title}** — bug status: **${statusLabel}**${projectLabel}`;
    }
  }

  if (body.entity === "feature") {
    if (previousLabel && previousLabel !== statusLabel) {
      return `**${title}** — feature status: **${previousLabel}** → **${statusLabel}**${projectLabel}`;
    }
    return `**${title}** — feature is now **${statusLabel}**${projectLabel}`;
  }

  if (previousLabel && previousLabel !== statusLabel) {
    return `**${title}** — status: **${previousLabel}** → **${statusLabel}**${projectLabel}`;
  }

  return `**${title}** — now **${statusLabel}**${projectLabel}`;
}

function buildUpdateContent(body: NotifyBody): string | undefined {
  const mentions = mentionsFor(pingTargets(body));

  if (body.event === "status_changed" || body.event === "completed") {
    return buildStatusChangeContent(body);
  }

  if (body.event === "assigned") {
    const projectLabel = projectSuffix(body.projectName);
    if (body.entity === "bug") {
      return mentions
        ? `${mentions} — assigned to this bug${projectLabel}`
        : `Bug assignment updated${projectLabel}`;
    }
    return mentions ? `${mentions} — you've been assigned` : undefined;
  }

  if (body.event === "deleted") {
    if (body.entity === "bug") return "Bug removed from Feath Board. Thread archived.";
    return "This item was deleted on Feath Board. Thread archived.";
  }

  return undefined;
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
  if (entity === "task") {
    const map: Record<string, string> = {
      backlog: "Backlog",
      "in-progress": "In progress",
      done: "Done",
    };
    return map[status] || status;
  }
  return status;
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function labelCategory(category: string | undefined): string | undefined {
  if (!category) return undefined;
  const map: Record<string, string> = {
    marketing: "Marketing",
    ops: "Operations",
    product: "Product",
    design: "Design",
    other: "Other",
  };
  return map[category] || category;
}

function threadName(body: NotifyBody): string {
  const title = body.title.trim() || "(untitled)";
  const projectPrefix = body.projectName ? `[${body.projectName}] ` : "";
  if (body.entity === "bug" && body.severity) {
    return `${projectPrefix}[${body.severity}] ${title}`.slice(0, 100);
  }
  return `${projectPrefix}[${capitalize(body.entity)}] ${title}`.slice(0, 100);
}

function embedColor(body: NotifyBody): number {
  if (body.event === "deleted") return 0x6b7280;
  if (body.event === "completed") return 0x22c55e;
  if (body.entity === "bug" && body.severity === "P0") return 0xef4444;
  if (body.event === "created") return 0x22c55e;
  if (body.event === "assigned") return 0xf59e0b;
  if (body.event === "status_changed") return 0x3b82f6;
  if (body.event === "edited") return 0x8b5cf6;
  return 0x6b7280;
}

function pingTargets(body: NotifyBody): string[] {
  if (body.entity === "feature" && body.owners?.length) {
    return body.owners.filter((o) => o && o !== "TBD");
  }
  const assignees = body.assignees?.length ? body.assignees : [];
  if (assignees.length) return assignees;
  if (body.owner && body.owner !== "Unassigned" && body.owner !== "All") return [body.owner];
  if (body.owner === "All") return [...TEAM];
  return [];
}

function updateHeadline(body: NotifyBody): string {
  const title = body.title.trim() || "(untitled)";

  if (body.entity === "bug") {
    if (body.event === "created") return `New bug: ${title}`;
    if (body.event === "status_changed" || body.event === "completed") {
      const statusLabel = labelStatus("bug", body.status);
      if (body.status === "in-progress") return `In progress: ${title}`;
      if (body.status === "fixed") return `Fixed: ${title}`;
      if (body.status === "verified") return `Verified: ${title}`;
      if (statusLabel) return `${statusLabel}: ${title}`;
    }
    if (body.event === "assigned") return `Assignment updated: ${title}`;
    if (body.event === "deleted") return `Bug removed: ${title}`;
    if (body.event === "edited") return `Bug updated: ${title}`;
  }

  switch (body.event) {
    case "created":
      return `New ${body.entity}: ${title}`;
    case "assigned":
      return "Assignment updated";
    case "status_changed": {
      const statusLabel = labelStatus(body.entity, body.status);
      return statusLabel ? `${statusLabel}: ${title}` : "Status updated";
    }
    case "completed":
      return "Marked complete";
    case "deleted":
      return "Removed from Feath Board";
    case "edited":
      return "Details updated";
    default:
      return "Updated";
  }
}

function buildCreatedFields(body: NotifyBody): Array<{ name: string; value: string; inline?: boolean }> {
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];
  const statusLabel = labelStatus(body.entity, body.status);

  if (body.projectName) fields.push({ name: "Project", value: body.projectName, inline: true });
  if (body.severity) fields.push({ name: "Severity", value: body.severity, inline: true });
  if (statusLabel) fields.push({ name: "Status", value: statusLabel, inline: true });
  if (body.difficulty) {
    const difficulty =
      body.difficulty.charAt(0).toUpperCase() + body.difficulty.slice(1);
    fields.push({ name: "Difficulty", value: difficulty, inline: true });
  }
  if (body.owner && body.owner !== "Unassigned") fields.push({ name: "Owner", value: body.owner, inline: true });
  if (body.owners?.length) fields.push({ name: "Owners", value: body.owners.join(", "), inline: true });
  if (body.foundBy) fields.push({ name: "Found by", value: body.foundBy, inline: true });
  if (body.category) fields.push({ name: "Category", value: labelCategory(body.category) || body.category, inline: true });
  if (body.group) fields.push({ name: "Group", value: body.group, inline: true });
  if (body.linkedFeature) fields.push({ name: "Linked feature", value: truncate(body.linkedFeature, 256) });

  return fields;
}

function buildCreatedDescription(body: NotifyBody): string | undefined {
  const parts: string[] = [];

  if (body.entity === "bug") {
    if (body.steps?.trim()) {
      parts.push(`**Steps to reproduce**\n${truncate(body.steps, 900)}`);
    }
    if (body.expected?.trim()) {
      parts.push(`**Expected vs actual**\n${truncate(body.expected, 900)}`);
    }
  } else if (body.description?.trim() && body.description !== "—") {
    parts.push(truncate(body.description, 1800));
  }

  if (body.detail?.trim()) {
    parts.push(`**Fix notes**\n${truncate(body.detail, 900)}`);
  }

  if (!parts.length) return undefined;
  return parts.join("\n\n");
}

function buildCreatedDiscordPayload(body: NotifyBody) {
  const color = embedColor(body);

  const embeds: Record<string, unknown>[] = [
    {
      title: buildCreatedEmbedTitle(body),
      description: buildCreatedDescription(body),
      color,
      fields: buildCreatedFields(body).length ? buildCreatedFields(body) : undefined,
      timestamp: new Date().toISOString(),
      url: body.boardUrl,
    },
  ];

  for (const attachment of (body.attachments || []).slice(0, 9)) {
    if (!attachment.url) continue;
    embeds.push({
      title: attachment.name || "Screenshot",
      color,
      image: { url: attachment.url },
    });
  }

  return {
    content: buildCreatedContent(body),
    embeds,
    allowed_mentions: { parse: ["users"] as const },
  };
}

function buildUpdateDiscordPayload(body: NotifyBody) {
  if (body.event === "edited") {
    return buildEditedDiscordPayload(body);
  }

  const statusLabel = labelStatus(body.entity, body.status);
  const previousLabel = labelStatus(body.entity, body.previousStatus);

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];
  if (body.projectName) fields.push({ name: "Project", value: body.projectName, inline: true });
  if (body.severity) fields.push({ name: "Severity", value: body.severity, inline: true });
  if (statusLabel) fields.push({ name: "Status", value: statusLabel, inline: true });
  if (body.difficulty) {
    const difficulty =
      body.difficulty.charAt(0).toUpperCase() + body.difficulty.slice(1);
    fields.push({ name: "Difficulty", value: difficulty, inline: true });
  }
  if (previousLabel && (body.event === "status_changed" || body.event === "completed")) {
    fields.push({ name: "Previous", value: previousLabel, inline: true });
  }
  if (body.owner) fields.push({ name: "Owner", value: body.owner, inline: true });
  if (body.foundBy) fields.push({ name: "Found by", value: body.foundBy, inline: true });
  if (body.detail) fields.push({ name: "Details", value: body.detail.slice(0, 900) });

  const content = buildUpdateContent(body);

  const embed: Record<string, unknown> = {
    title: updateHeadline(body),
    description:
      body.event === "status_changed" || body.event === "completed"
        ? undefined
        : `**${body.title.trim() || "(untitled)"}**`,
    color: embedColor(body),
    fields: fields.length ? fields : undefined,
    timestamp: new Date().toISOString(),
  };

  if (body.boardUrl && body.event === "created") {
    embed.url = body.boardUrl;
  }

  return {
    content,
    embeds: [embed],
    allowed_mentions: { parse: ["users"] as const },
  };
}

function buildEditedDiscordPayload(body: NotifyBody) {
  const color = embedColor(body);
  const createdFields = buildCreatedFields(body);
  const embeds: Record<string, unknown>[] = [
    {
      title: updateHeadline(body),
      description: buildCreatedDescription(body) || `**${body.title.trim() || "(untitled)"}**`,
      color,
      fields: createdFields.length ? createdFields : undefined,
      timestamp: new Date().toISOString(),
      url: body.boardUrl,
    },
  ];

  for (const attachment of (body.attachments || []).slice(0, 9)) {
    if (!attachment.url) continue;
    embeds.push({
      title: attachment.name || "Screenshot",
      color,
      image: { url: attachment.url },
    });
  }

  const content =
    body.entity === "bug"
      ? `**${body.title.trim() || "(untitled)"}** — bug details updated on Feath Board.`
      : "Updated on Feath Board.";

  return {
    content,
    embeds,
    allowed_mentions: { parse: ["users"] as const },
  };
}

function shouldNotify(body: NotifyBody): boolean {
  if (body.event === "created") return true;
  if (!body.discordThreadId) return false;
  if (body.event === "deleted") return true;
  if (body.event === "completed" || body.event === "status_changed" || body.event === "assigned" || body.event === "edited") {
    return true;
  }
  return false;
}

function appendWebhookQuery(url: string, key: string, value: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

const FORUM_STATUS_TAG_LABELS = ["open", "in progress", "fixed", "verified"] as const;

function normalizeTagLabel(name: string): string {
  return name.trim().toLowerCase();
}

function statusToForumTagLabel(entity: string, status: string | undefined): string | null {
  if (!status) return null;

  if (entity === "bug") {
    const map: Record<string, string> = {
      open: "Open",
      "in-progress": "In progress",
      fixed: "Fixed",
      verified: "Verified",
    };
    return map[status] ?? null;
  }

  if (entity === "feature") {
    const map: Record<string, string> = {
      backlog: "Open",
      planned: "Open",
      speculative: "Open",
      "in-progress": "In progress",
      shipped: "Verified",
    };
    return map[status] ?? null;
  }

  return null;
}

type ForumTag = { id: string; name: string };

function mergeForumStatusTags(
  availableTags: ForumTag[],
  currentApplied: string[],
  entity: string,
  status: string | undefined,
): string[] | null {
  const targetLabel = statusToForumTagLabel(entity, status);
  if (!targetLabel) return null;

  const managedTagIds = new Set(
    availableTags
      .filter((tag) =>
        FORUM_STATUS_TAG_LABELS.includes(normalizeTagLabel(tag.name) as (typeof FORUM_STATUS_TAG_LABELS)[number]),
      )
      .map((tag) => tag.id),
  );

  const targetTag = availableTags.find(
    (tag) => normalizeTagLabel(tag.name) === normalizeTagLabel(targetLabel),
  );
  if (!targetTag) {
    console.warn(`Discord forum tag not found for status: ${targetLabel}`);
    return null;
  }

  const kept = currentApplied.filter((tagId) => !managedTagIds.has(tagId));
  return [...kept, targetTag.id];
}

async function resolveWebhookChannelId(webhookUrl: string): Promise<string | null> {
  const match = webhookUrl.match(/webhooks\/(\d+)\/([^/?]+)/);
  if (!match) return null;

  const [, webhookId, webhookToken] = match;
  const res = await fetch(`https://discord.com/api/v10/webhooks/${webhookId}/${webhookToken}`);
  if (!res.ok) {
    console.warn("Discord webhook lookup failed", res.status);
    return null;
  }

  const data = (await res.json()) as { channel_id?: string };
  return data.channel_id ?? null;
}

async function getForumAvailableTags(forumChannelId: string, botToken: string): Promise<ForumTag[] | null> {
  const res = await fetch(`https://discord.com/api/v10/channels/${forumChannelId}`, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  if (!res.ok) {
    console.warn("Discord forum channel lookup failed", res.status);
    return null;
  }

  const data = (await res.json()) as { available_tags?: ForumTag[] };
  return data.available_tags ?? null;
}

async function getThreadAppliedTags(threadId: string, botToken: string): Promise<string[]> {
  const res = await fetch(`https://discord.com/api/v10/channels/${threadId}`, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { applied_tags?: string[] };
  return data.applied_tags ?? [];
}

async function patchThreadAppliedTags(
  threadId: string,
  appliedTags: string[],
  botToken: string,
): Promise<boolean> {
  const res = await fetch(`https://discord.com/api/v10/channels/${threadId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ applied_tags: appliedTags }),
  });

  if (!res.ok) {
    console.error("Discord forum tag update failed", res.status, await res.text());
  }

  return res.ok;
}

async function resolveAppliedTagsForStatus(
  webhookUrl: string,
  body: NotifyBody,
  currentApplied: string[],
): Promise<string[] | null> {
  if (body.entity !== "bug" && body.entity !== "feature") return null;

  const botToken = env("DISCORD_BOT_TOKEN");
  if (!botToken) {
    console.warn("DISCORD_BOT_TOKEN not set — cannot sync forum tags");
    return null;
  }

  const forumChannelId = await resolveWebhookChannelId(webhookUrl);
  if (!forumChannelId) return null;

  const availableTags = await getForumAvailableTags(forumChannelId, botToken);
  if (!availableTags?.length) return null;

  return mergeForumStatusTags(availableTags, currentApplied, body.entity, body.status);
}

async function syncForumStatusTag(
  webhookUrl: string,
  threadId: string,
  body: NotifyBody,
): Promise<boolean> {
  if (body.entity !== "bug" && body.entity !== "feature") return false;
  if (!body.status) return false;

  const botToken = env("DISCORD_BOT_TOKEN");
  if (!botToken) return false;

  const currentApplied = await getThreadAppliedTags(threadId, botToken);
  const merged = await resolveAppliedTagsForStatus(webhookUrl, body, currentApplied);
  if (!merged) return false;

  const unchanged =
    merged.length === currentApplied.length &&
    merged.every((tagId) => currentApplied.includes(tagId));
  if (unchanged) return true;

  return patchThreadAppliedTags(threadId, merged, botToken);
}

async function postWebhook(
  webhookUrl: string,
  body: NotifyBody,
): Promise<{ ok: boolean; threadId?: string; error?: string }> {
  const payload =
    body.event === "created" && !body.discordThreadId
      ? buildCreatedDiscordPayload(body)
      : buildUpdateDiscordPayload(body);
  const requestBody: Record<string, unknown> = { ...payload };

  let url = appendWebhookQuery(webhookUrl, "wait", "true");
  if (body.discordThreadId) {
    url = appendWebhookQuery(url, "thread_id", body.discordThreadId);
  } else if (body.event === "created") {
    requestBody.thread_name = threadName(body);
    const initialTags = await resolveAppliedTagsForStatus(webhookUrl, body, []);
    if (initialTags?.length) {
      requestBody.applied_tags = initialTags;
    }
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Discord webhook failed", res.status, detail);
    return { ok: false, error: "Discord webhook failed" };
  }

  let threadId = body.discordThreadId || undefined;
  try {
    const data = (await res.json()) as { channel_id?: string };
    if (data.channel_id) threadId = data.channel_id;
  } catch {
    // Some webhook responses have no JSON body
  }

  return { ok: true, threadId };
}

async function archiveDiscordThread(threadId: string): Promise<boolean> {
  const botToken = env("DISCORD_BOT_TOKEN");
  if (!botToken) {
    console.warn("DISCORD_BOT_TOKEN not set — cannot archive forum thread");
    return false;
  }

  const res = await fetch(`https://discord.com/api/v10/channels/${threadId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ archived: true }),
  });

  if (!res.ok) {
    console.error("Discord archive failed", res.status, await res.text());
  }

  return res.ok;
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

  if (!body.entity || !body.title || !body.event || body.entityId == null) {
    return new Response(JSON.stringify({ ok: false, error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const webhookUrl = resolveWebhookUrl(body.projectId);
  if (!webhookUrl) {
    return new Response(JSON.stringify({ ok: false, error: "Discord webhook not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!shouldNotify(body)) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const posted = await postWebhook(webhookUrl, body);
  if (!posted.ok) {
    return new Response(JSON.stringify({ ok: false, error: posted.error || "Discord webhook failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  let archived = false;
  const threadId = posted.threadId || body.discordThreadId || null;
  if ((body.event === "deleted" || body.event === "completed") && threadId) {
    archived = await archiveDiscordThread(threadId);
  } else if (threadId && body.event !== "deleted") {
    await syncForumStatusTag(webhookUrl, threadId, body);
  }

  return new Response(
    JSON.stringify({
      ok: true,
      threadId,
      archived,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}
