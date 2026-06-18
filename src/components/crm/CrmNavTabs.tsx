import { CustomersNavIcon, TasksNavIcon } from "./CrmCustomersSideRail";
import { CallTaskIcon, ChatNavIcon } from "./CrmCustomerTaskIcons";
import { BellIcon } from "./CrmNotificationBell";
import { GearIcon } from "./CrmTodoIcons";

export type CrmNavTab = "customers" | "chat" | "systemLeads" | "team" | "todo" | "settings";

type CrmNavTabsProps = {
  activeTab: CrmNavTab;
  onSelect: (tab: CrmNavTab) => void;
  userId: string | null;
  todoIncompleteCount: number;
  canViewChat: boolean;
  canAccessSettings: boolean;
  variant?: "bar" | "sidebar" | "mobile-menu";
};

export function CrmNavTabs({
  activeTab,
  onSelect,
  userId,
  todoIncompleteCount,
  canViewChat,
  canAccessSettings,
  variant = "bar"
}: CrmNavTabsProps) {
  const todoLabel = userId ? `To-do (${todoIncompleteCount})` : "To-do";

  const tabs: Array<{
    id: CrmNavTab;
    label: string;
    wideLabel?: string;
    narrowLabel?: string;
    icon: typeof TasksNavIcon;
    visible: boolean;
  }> = [
    { id: "todo", label: todoLabel, icon: TasksNavIcon, visible: true },
    { id: "customers", label: "Customers", icon: CallTaskIcon, visible: true },
    { id: "chat", label: "Chat", icon: ChatNavIcon, visible: canViewChat },
    {
      id: "systemLeads",
      label: "System leads",
      wideLabel: "System leads",
      narrowLabel: "Leads",
      icon: BellIcon,
      visible: true
    },
    { id: "team", label: "Team", icon: CustomersNavIcon, visible: true },
    { id: "settings", label: "Admin", icon: GearIcon, visible: canAccessSettings }
  ];

  if (variant === "mobile-menu") {
    return (
      <nav className="crmMobileNavTabs" aria-label="CRM sections">
        {tabs
          .filter((tab) => tab.visible)
          .map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`crmMobileNavTab${isActive ? " crmMobileNavTabActive" : ""}`}
                onClick={() => onSelect(tab.id)}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="crmMobileNavTabIcon" aria-hidden="true">
                  <Icon className="crmTabBtnIcon" />
                </span>
                <span className="crmMobileNavTabLabel">{tab.label}</span>
              </button>
            );
          })}
      </nav>
    );
  }

  const navClassName =
    variant === "sidebar" ? "crmTabBar appTabs crmTabBarVertical" : "crmTabBar appTabs";

  return (
    <nav className={navClassName} aria-label="CRM sections">
      {tabs
        .filter((tab) => tab.visible)
        .map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`appTab crmTabBtn${isActive ? " appTabActive" : ""}`}
              onClick={() => onSelect(tab.id)}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="crmTabBtnInner">
                <Icon className="crmTabBtnIcon" />
                {tab.wideLabel && tab.narrowLabel ? (
                  <span className="crmTabBtnLabel">
                    <span className="crmTabLabelWide">{tab.wideLabel}</span>
                    <span className="crmTabLabelNarrow">{tab.narrowLabel}</span>
                  </span>
                ) : (
                  <span>{tab.label}</span>
                )}
              </span>
            </button>
          );
        })}
    </nav>
  );
}
