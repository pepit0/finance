export type CrmCustomersSidebarView = "customers" | "tasks";

type CrmCustomersSideRailProps = {
  activeView: CrmCustomersSidebarView;
  onSelectView: (view: CrmCustomersSidebarView) => void;
  customerCount: number;
  customerListTab?: "active" | "lost";
  taskCount: number;
};

type NavIconProps = {
  className?: string;
};

export function CustomersNavIcon({ className = "crmCustomersSidebarIcon" }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 12a4 4 0 1 0-.001-8.001A4 4 0 0 0 12 12zm-7 8.5a7 7 0 0 1 14 0H5z"
      />
    </svg>
  );
}

export function TasksNavIcon({ className = "crmCustomersSidebarIcon" }: NavIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

export function CrmCustomerListCollapseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="crmCustomerListCollapseBtn"
      onClick={onClick}
      aria-label="Collapse to menu"
      title="Collapse"
    >
      <svg className="crmCustomersSidebarChevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M14.7 5.3a1 1 0 0 1 0 1.4L10.41 11l4.3 4.3a1 1 0 1 1-1.42 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.41 0z" />
      </svg>
    </button>
  );
}

export function CrmCustomersSideRail({
  activeView,
  onSelectView,
  customerCount,
  customerListTab = "active",
  taskCount
}: CrmCustomersSideRailProps) {
  const customerCountNoun = customerListTab === "lost" ? "lost" : "assigned";

  return (
    <aside className="crmCustomersSidebarRail" aria-label="Customers navigation">
      <nav className="crmCustomersSidebarNav" aria-label="List views">
        <button
          type="button"
          className={`crmCustomersSidebarNavBtn${activeView === "customers" ? " crmCustomersSidebarNavBtnActive" : ""}`}
          onClick={() => onSelectView("customers")}
          aria-current={activeView === "customers" ? "page" : undefined}
          aria-label={`Customers, ${customerCount} ${customerCountNoun}`}
          title={`Customers (${customerCount} ${customerCountNoun})`}
        >
          <span className="crmCustomersSidebarNavVisual" aria-hidden="true">
            <CustomersNavIcon />
            <span className="crmCustomersSidebarNavCount">{customerCount}</span>
          </span>
          <span className="crmCustomersSidebarNavLabel crmCustomersSidebarNavLabelCustomers">Customers</span>
        </button>
        <button
          type="button"
          className={`crmCustomersSidebarNavBtn${activeView === "tasks" ? " crmCustomersSidebarNavBtnActive" : ""}`}
          onClick={() => onSelectView("tasks")}
          aria-current={activeView === "tasks" ? "page" : undefined}
          aria-label={`Tasks, ${taskCount} incomplete`}
          title={`Tasks (${taskCount})`}
        >
          <span className="crmCustomersSidebarNavVisual" aria-hidden="true">
            <TasksNavIcon />
            <span className="crmCustomersSidebarNavCount">{taskCount}</span>
          </span>
          <span className="crmCustomersSidebarNavLabel">Tasks</span>
        </button>
      </nav>
    </aside>
  );
}
