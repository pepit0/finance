import { useCallback, useEffect, useMemo, useState } from "react";
import type { CrmCustomerTask } from "../../types/crm";
import {
  crmTodoLocalDate,
  fetchCrmCustomerTasksForAssigneeFilter,
  fetchCrmOriginLocalDate,
  formatCustomerTaskTime,
  normalizeCrmDateRange
} from "../../lib/crmApi";
import { useNowTick } from "../../hooks/useNowTick";
import {
  customerTaskUrgencyFor,
  customerTaskUrgencyRowClass,
  CustomerTaskUrgencyMarker
} from "./CustomerTaskUrgencyMarker";
import { CustomerTaskTypeIcon } from "./CrmCustomerTaskIcons";

type CrmCustomerTasksSidebarProps = {
  userId: string | null;
  assigneeFilter: string;
  onSelectCustomer: (customerId: string) => void;
};

function formatTaskListDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function CrmCustomerTasksSidebar({
  userId,
  assigneeFilter,
  onSelectCustomer
}: CrmCustomerTasksSidebarProps) {
  const today = crmTodoLocalDate();
  const [taskDateFrom, setTaskDateFrom] = useState(today);
  const [taskDateTo, setTaskDateTo] = useState(today);
  const [rangeReady, setRangeReady] = useState(false);
  const [tasks, setTasks] = useState<CrmCustomerTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const now = useNowTick(30_000);

  const activeRange = useMemo(
    () => normalizeCrmDateRange(taskDateFrom, taskDateTo),
    [taskDateFrom, taskDateTo]
  );
  const showTaskDates = activeRange.from !== activeRange.to;

  useEffect(() => {
    let cancelled = false;
    void fetchCrmOriginLocalDate().then((result) => {
      if (cancelled) {
        return;
      }
      setTaskDateFrom(result.date);
      setTaskDateTo(crmTodoLocalDate());
      if (result.error) {
        setBanner(result.error);
      }
      setRangeReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const reload = useCallback(async () => {
    if (!userId || !rangeReady) {
      setTasks([]);
      return;
    }
    setLoading(true);
    setBanner(null);
    const result = await fetchCrmCustomerTasksForAssigneeFilter(activeRange, assigneeFilter, userId);
    setLoading(false);
    if (result.error) {
      setBanner(result.error);
      setTasks([]);
      return;
    }
    setTasks(result.data);
  }, [activeRange, assigneeFilter, rangeReady, userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onFromChange = (value: string) => {
    setTaskDateFrom(value);
    if (value && taskDateTo && value > taskDateTo) {
      setTaskDateTo(value);
    }
  };

  const onToChange = (value: string) => {
    setTaskDateTo(value);
    if (value && taskDateFrom && value < taskDateFrom) {
      setTaskDateFrom(value);
    }
  };

  const emptyMessage = "No tasks for this assignee in the selected date range.";

  return (
    <div className="crmCustomerTasksSidebar">
      <div className="crmCustomerTasksSidebarHead">
        <fieldset className="crmCustomerTasksSidebarDateRange" aria-label="Task dates">
          <label className="crmCustomerTaskField">
            <span className="loginLabel">From</span>
            <input
              type="date"
              className="crmCustomerTaskInput"
              value={taskDateFrom}
              max={taskDateTo || undefined}
              onChange={(event) => onFromChange(event.target.value)}
            />
          </label>
          <label className="crmCustomerTaskField">
            <span className="loginLabel">Until</span>
            <input
              type="date"
              className="crmCustomerTaskInput"
              value={taskDateTo}
              min={taskDateFrom || undefined}
              onChange={(event) => onToChange(event.target.value)}
            />
          </label>
        </fieldset>
      </div>

      {banner ? (
        <p className="crmBanner" role="alert">
          {banner}
        </p>
      ) : null}

      {!rangeReady || loading ? (
        <p className="crmMuted">{rangeReady ? "Loading tasks…" : "Loading date range…"}</p>
      ) : tasks.length === 0 ? (
        <p className="crmMuted">{emptyMessage}</p>
      ) : (
        <ul className="crmCustomerTaskSidebarList">
          {tasks.map((task) => {
            const customerName = task.customer_display_name ?? "Customer";
            const done = Boolean(task.completed_at);
            const urgency = customerTaskUrgencyFor(task, now);
            const rowClassName = customerTaskUrgencyRowClass("crmCustomerTaskSidebarRow", urgency, { done });
            return (
              <li key={task.id}>
                <button
                  type="button"
                  className={rowClassName}
                  onClick={() => onSelectCustomer(task.customer_id)}
                >
                  <span className="crmCustomerTaskRowIcon" aria-hidden="true">
                    <CustomerTaskTypeIcon taskType={task.task_type} />
                  </span>
                  <span className="crmCustomerTaskSidebarRowBody">
                    <span className="crmCustomerTaskSidebarRowTitle">{task.title}</span>
                    <span className="crmCustomerTaskSidebarRowMeta">
                      {showTaskDates ? `${formatTaskListDate(task.task_date)} · ` : ""}
                      {formatCustomerTaskTime(task.task_time)} · {customerName}
                    </span>
                    {task.notes ? (
                      <span className="crmCustomerTaskSidebarRowNotes">{task.notes}</span>
                    ) : null}
                  </span>
                  {urgency ? <CustomerTaskUrgencyMarker urgency={urgency} /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
