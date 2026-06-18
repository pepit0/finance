import type { CrmDirectoryPosition, CrmPermissionDef } from "../types/crm";

/** Fallback catalog when DB migration is not applied yet. Kept in sync with sql/crm_position_permissions.sql */
export const CRM_PERMISSION_DEFS: CrmPermissionDef[] = [
  { key: "admin.access", label: "Admin access", description: "Broad elevated access (delete, moderation, legacy admin features).", group_key: "admin", group_label: "Administration", sort_order: 10 },
  { key: "admin.manage_permissions", label: "Manage permissions", description: "Edit which permissions each position has.", group_key: "admin", group_label: "Administration", sort_order: 20 },
  { key: "admin.grant_permission_admins", label: "Grant permission admins", description: "Designate other users as permission administrators.", group_key: "admin", group_label: "Administration", sort_order: 30 },

  { key: "customers.view_all", label: "View all customers", description: "See every customer in the CRM, not only assigned leads.", group_key: "customers", group_label: "Customers", sort_order: 110 },
  { key: "customers.create", label: "Create customers", description: "Add new customer profiles.", group_key: "customers", group_label: "Customers", sort_order: 120 },
  { key: "customers.edit_any", label: "Edit any customer", description: "Edit profile and details for any customer.", group_key: "customers", group_label: "Customers", sort_order: 130 },
  { key: "customers.edit_assigned", label: "Edit assigned customers", description: "Edit customers assigned to you.", group_key: "customers", group_label: "Customers", sort_order: 140 },
  { key: "customers.delete", label: "Delete customers", description: "Permanently delete customer profiles.", group_key: "customers", group_label: "Customers", sort_order: 150 },
  { key: "customers.assign_any", label: "Assign any customer", description: "Change assignee to any team member.", group_key: "customers", group_label: "Customers", sort_order: 160 },
  { key: "customers.assign_team", label: "Assign within team", description: "Reassign customers among staff you manage.", group_key: "customers", group_label: "Customers", sort_order: 170 },
  { key: "customers.mark_lost", label: "Mark lost", description: "Move active customers to lost status.", group_key: "customers", group_label: "Customers", sort_order: 180 },
  { key: "customers.restore_lost", label: "Restore lost", description: "Restore lost customers back to active.", group_key: "customers", group_label: "Customers", sort_order: 190 },
  { key: "customers.change_pipeline", label: "Change pipeline stage", description: "Update customer pipeline stage.", group_key: "customers", group_label: "Customers", sort_order: 200 },
  { key: "customers.view_credit_app", label: "View credit application", description: "Open and read credit application info.", group_key: "customers", group_label: "Customers", sort_order: 210 },
  { key: "customers.edit_credit_app", label: "Edit credit application", description: "Update credit application fields and documents.", group_key: "customers", group_label: "Customers", sort_order: 220 },
  { key: "customers.upload_documents", label: "Upload credit documents", description: "Upload licence, paystubs, and trade registration files.", group_key: "customers", group_label: "Customers", sort_order: 230 },
  { key: "customers.view_edit_history", label: "View edit history", description: "See customer profile and credit app change history.", group_key: "customers", group_label: "Customers", sort_order: 240 },

  { key: "activities.log", label: "Log activities", description: "Log calls, texts, and comments on customers.", group_key: "activities", group_label: "Activities", sort_order: 310 },
  { key: "activities.delete_any", label: "Delete any activity", description: "Remove call, text, or comment entries for moderation.", group_key: "activities", group_label: "Activities", sort_order: 320 },
  { key: "activities.delete_own", label: "Delete own activity", description: "Remove your own activity entries.", group_key: "activities", group_label: "Activities", sort_order: 330 },

  { key: "tasks.view_all", label: "View all tasks", description: "See every customer task in the CRM.", group_key: "tasks", group_label: "Tasks", sort_order: 410 },
  { key: "tasks.view_team", label: "View team tasks", description: "See tasks for your team members.", group_key: "tasks", group_label: "Tasks", sort_order: 420 },
  { key: "tasks.create", label: "Create tasks", description: "Create call, appointment, and other tasks.", group_key: "tasks", group_label: "Tasks", sort_order: 430 },
  { key: "tasks.edit_any", label: "Edit any task", description: "Edit or complete tasks for any user.", group_key: "tasks", group_label: "Tasks", sort_order: 440 },
  { key: "tasks.complete_assigned", label: "Complete assigned tasks", description: "Complete tasks assigned to you.", group_key: "tasks", group_label: "Tasks", sort_order: 450 },

  { key: "lenders.view", label: "View lender outcomes", description: "See lender decision rail on customers.", group_key: "lenders", group_label: "Lenders & finance", sort_order: 510 },
  { key: "lenders.edit_outcomes", label: "Edit lender outcomes", description: "Set approved, conditional, declined, or pending per lender.", group_key: "lenders", group_label: "Lenders & finance", sort_order: 520 },

  { key: "leads.view", label: "View system leads", description: "Access the system leads inbox.", group_key: "leads", group_label: "System leads", sort_order: 610 },
  { key: "leads.assign", label: "Assign system leads", description: "Assign web and marketing leads to staff.", group_key: "leads", group_label: "System leads", sort_order: 620 },
  { key: "leads.delete", label: "Delete system leads", description: "Remove system lead records.", group_key: "leads", group_label: "System leads", sort_order: 630 },

  { key: "team.view_directory", label: "View team directory", description: "See the team members list.", group_key: "team", group_label: "Team", sort_order: 710 },
  { key: "team.edit_own_display_name", label: "Edit own display name", description: "Change your name shown in the CRM.", group_key: "team", group_label: "Team", sort_order: 720 },
  { key: "team.edit_any_display_name", label: "Edit any display name", description: "Change display names for team members.", group_key: "team", group_label: "Team", sort_order: 730 },
  { key: "team.assign_positions", label: "Assign positions", description: "Change job positions for team members below your rank.", group_key: "team", group_label: "Team", sort_order: 740 },

  { key: "todo.view_own", label: "View own to-do list", description: "Use your daily to-do checklist.", group_key: "todo", group_label: "To-do lists", sort_order: 810 },
  { key: "todo.admin_others", label: "Manage others' to-do", description: "View and edit other users' daily to-do lists.", group_key: "todo", group_label: "To-do lists", sort_order: 820 },
  { key: "todo.manage_templates", label: "Manage to-do templates", description: "Edit default to-do templates for the team.", group_key: "todo", group_label: "To-do lists", sort_order: 830 },

  { key: "settings.branding", label: "CRM branding settings", description: "Change accent color, watermark, and header icon.", group_key: "settings", group_label: "Settings", sort_order: 910 },
  { key: "settings.pipeline", label: "Pipeline settings", description: "Configure pipeline stages, colors, and order.", group_key: "settings", group_label: "Settings", sort_order: 920 },

  { key: "notifications.dismiss_any", label: "Dismiss any notification", description: "Clear alerts for any customer or assignee.", group_key: "tools", group_label: "Tools", sort_order: 1010 },
  { key: "reports.print_lead_sheet", label: "Print lead sheets", description: "Print lead sheets from customer activity.", group_key: "tools", group_label: "Tools", sort_order: 1020 },

  { key: "texts.view", label: "View SMS chat", description: "Open the Chat tab and read SMS threads.", group_key: "texts", group_label: "Text messaging", sort_order: 370 },
  { key: "texts.send", label: "Send SMS", description: "Send outbound text messages to customers from the CRM.", group_key: "texts", group_label: "Text messaging", sort_order: 380 },
  { key: "texts.admin_inboxes", label: "View team inboxes", description: "Browse SMS inboxes for other CRM users.", group_key: "texts", group_label: "Text messaging", sort_order: 390 }
];

export type CrmPermissionGroup = {
  group_key: string;
  group_label: string;
  permissions: CrmPermissionDef[];
};

export function groupCrmPermissionDefs(defs: CrmPermissionDef[]): CrmPermissionGroup[] {
  const sorted = [...defs].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
  const groups = new Map<string, CrmPermissionGroup>();
  for (const def of sorted) {
    const existing = groups.get(def.group_key);
    if (existing) {
      existing.permissions.push(def);
    } else {
      groups.set(def.group_key, {
        group_key: def.group_key,
        group_label: def.group_label,
        permissions: [def]
      });
    }
  }
  return [...groups.values()].sort((a, b) => {
    const aOrder = a.permissions[0]?.sort_order ?? 0;
    const bOrder = b.permissions[0]?.sort_order ?? 0;
    return aOrder - bOrder;
  });
}

export function buildPositionPermissionMap(
  rows: { position: string; permission_key: string }[],
  groupSlugs: string[] = []
): Record<string, Set<string>> {
  const map: Record<string, Set<string>> = {};
  for (const slug of groupSlugs) {
    map[slug] = new Set();
  }
  for (const row of rows) {
    if (!map[row.position]) {
      map[row.position] = new Set();
    }
    map[row.position].add(row.permission_key);
  }
  return map;
}

export function permissionDefLabel(key: string, defs: CrmPermissionDef[] = CRM_PERMISSION_DEFS): string {
  return defs.find((def) => def.key === key)?.label ?? key.replace(/_/g, " ");
}
