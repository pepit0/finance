import {
  FormEvent,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { CrmCustomer, CrmCustomerTask, CrmCustomerTaskType, CrmUserDirectoryRow } from "../../types/crm";
import {
  buildTaskTimeOptions,
  createCrmCustomerTask,
  crmTodoLocalDate,
  defaultCustomerTaskTime,
  deleteCrmCustomerTask,
  fetchCrmCustomerTasksForCustomer,
  formatCustomerTaskTime,
  toggleCrmCustomerTask,
  updateCrmCustomerTask
} from "../../lib/crmApi";
import { directoryPersonLabel } from "../../utils/crmDirectoryAdmin";
import { useNowTick } from "../../hooks/useNowTick";
import {
  customerTaskUrgencyFor,
  customerTaskUrgencyRowClass,
  CustomerTaskUrgencyMarker
} from "./CustomerTaskUrgencyMarker";
import { CUSTOMER_TASK_TYPE_LABELS, CustomerTaskTypeIcon } from "./CrmCustomerTaskIcons";

type CrmCustomerTasksProviderProps = {
  customer: CrmCustomer;
  directory: CrmUserDirectoryRow[];
  meId: string | null;
  meEmail: string | null;
  onTasksChanged?: () => void;
  children: ReactNode;
};

type CrmCustomerTasksContextValue = {
  directory: CrmUserDirectoryRow[];
  meId: string | null;
  loading: boolean;
  banner: string | null;
  saving: boolean;
  busyId: string | null;
  editingId: string | null;
  taskType: CrmCustomerTaskType | null;
  setTaskType: (type: CrmCustomerTaskType | null) => void;
  taskDate: string;
  setTaskDate: (value: string) => void;
  taskTime: string;
  setTaskTime: (value: string) => void;
  assignSelect: string;
  setAssignSelect: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  showTaskDetails: boolean;
  openTasks: CrmCustomerTask[];
  onCreate: (event: FormEvent) => void;
  onToggle: (task: CrmCustomerTask) => void;
  onDelete: (task: CrmCustomerTask) => void;
  startEdit: (task: CrmCustomerTask) => void;
  cancelEdit: () => void;
  onSaveEdit: (task: CrmCustomerTask) => void;
};

const CrmCustomerTasksContext = createContext<CrmCustomerTasksContextValue | null>(null);

function resolveTaskAssignee(
  value: string,
  meId: string | null,
  meEmail: string | null,
  directory: CrmUserDirectoryRow[]
): { assigned_to: string | null; assigned_to_email: string | null } {
  if (value === "__me") {
    if (!meId) {
      return { assigned_to: null, assigned_to_email: null };
    }
    return { assigned_to: meId, assigned_to_email: meEmail?.trim() || null };
  }
  const row = directory.find((d) => d.user_id === value);
  if (row) {
    return { assigned_to: row.user_id, assigned_to_email: row.email };
  }
  return { assigned_to: null, assigned_to_email: null };
}

const TASK_TYPES: CrmCustomerTaskType[] = ["call", "appointment", "other"];
const TIME_OPTIONS = buildTaskTimeOptions();

function useCrmCustomerTasksContext() {
  const value = useContext(CrmCustomerTasksContext);
  if (!value) {
    throw new Error("CrmCustomerTask components must be used within CrmCustomerTasksProvider");
  }
  return value;
}

export function CrmCustomerTasksProvider({
  customer,
  directory,
  meId,
  meEmail,
  onTasksChanged,
  children
}: CrmCustomerTasksProviderProps) {
  const [tasks, setTasks] = useState<CrmCustomerTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [taskType, setTaskType] = useState<CrmCustomerTaskType | null>(null);
  const [taskDate, setTaskDate] = useState(crmTodoLocalDate());
  const [taskTime, setTaskTime] = useState(defaultCustomerTaskTime);
  const [assignSelect, setAssignSelect] = useState("__me");
  const [notes, setNotes] = useState("");

  const showTaskDetails = taskType !== null || editingId !== null;

  const resetTaskFormFields = useCallback(() => {
    setTaskDate(crmTodoLocalDate());
    setTaskTime(defaultCustomerTaskTime());
    setAssignSelect("__me");
    setNotes("");
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    const result = await fetchCrmCustomerTasksForCustomer(customer.id);
    setLoading(false);
    if (result.error) {
      setBanner(result.error);
      return;
    }
    setTasks(result.data);
  }, [customer.id]);

  useEffect(() => {
    void reload();
    resetTaskFormFields();
    setTaskType(null);
    setEditingId(null);
  }, [customer.id, reload, resetTaskFormFields]);

  const openTasks = useMemo(() => tasks.filter((task) => !task.completed_at), [tasks]);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!taskType) {
      return;
    }
    if (!meId) {
      setBanner("Sign in to create tasks.");
      return;
    }
    const assignee = resolveTaskAssignee(assignSelect, meId, meEmail, directory);
    if (!assignee.assigned_to) {
      setBanner("Select who this task is assigned to.");
      return;
    }

    setSaving(true);
    setBanner(null);
    const result = await createCrmCustomerTask({
      customer_id: customer.id,
      customer_display_name: customer.display_name,
      task_type: taskType,
      task_date: taskDate,
      task_time: taskTime,
      notes: notes.trim() || null,
      assigned_to: assignee.assigned_to,
      assigned_to_email: assignee.assigned_to_email
    });
    setSaving(false);
    if (result.error) {
      setBanner(result.error);
      return;
    }
    if (result.data) {
      setTasks((prev) => [result.data!, ...prev]);
      resetTaskFormFields();
      setTaskType(null);
      onTasksChanged?.();
    }
  };

  const onToggle = async (task: CrmCustomerTask) => {
    setBusyId(task.id);
    setBanner(null);
    const nextCompleted = !task.completed_at;
    const result = await toggleCrmCustomerTask(task.id, nextCompleted);
    setBusyId(null);
    if (result.error) {
      setBanner(result.error);
      return;
    }
    setTasks((prev) =>
      prev.map((row) =>
        row.id === task.id
          ? { ...row, completed_at: nextCompleted ? new Date().toISOString() : null }
          : row
      )
    );
    onTasksChanged?.();
  };

  const onDelete = async (task: CrmCustomerTask) => {
    setBusyId(task.id);
    setBanner(null);
    const result = await deleteCrmCustomerTask(task.id);
    setBusyId(null);
    if (result.error) {
      setBanner(result.error);
      return;
    }
    setTasks((prev) => prev.filter((row) => row.id !== task.id));
    if (editingId === task.id) {
      setEditingId(null);
      setTaskType(null);
      resetTaskFormFields();
    }
    onTasksChanged?.();
  };

  const startEdit = (task: CrmCustomerTask) => {
    setEditingId(task.id);
    setTaskType(task.task_type);
    setTaskDate(task.task_date);
    setTaskTime(task.task_time);
    setNotes(task.notes ?? "");
    if (meId && task.assigned_to === meId) {
      setAssignSelect("__me");
    } else {
      setAssignSelect(task.assigned_to);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTaskType(null);
    resetTaskFormFields();
  };

  const onSaveEdit = async (task: CrmCustomerTask) => {
    if (!meId || !taskType) {
      return;
    }
    const assignee = resolveTaskAssignee(assignSelect, meId, meEmail, directory);
    if (!assignee.assigned_to) {
      setBanner("Select who this task is assigned to.");
      return;
    }

    setBusyId(task.id);
    setBanner(null);
    const result = await updateCrmCustomerTask(task.id, {
      task_type: taskType,
      task_date: taskDate,
      task_time: taskTime,
      notes: notes.trim() || null,
      assigned_to: assignee.assigned_to,
      assigned_to_email: assignee.assigned_to_email,
      customer_display_name: customer.display_name
    });
    setBusyId(null);
    if (result.error) {
      setBanner(result.error);
      return;
    }
    cancelEdit();
    onTasksChanged?.();
    void reload();
  };

  const value: CrmCustomerTasksContextValue = {
    directory,
    meId,
    loading,
    banner,
    saving,
    busyId,
    editingId,
    taskType,
    setTaskType,
    taskDate,
    setTaskDate,
    taskTime,
    setTaskTime,
    assignSelect,
    setAssignSelect,
    notes,
    setNotes,
    showTaskDetails,
    openTasks,
    onCreate,
    onToggle,
    onDelete,
    startEdit,
    cancelEdit,
    onSaveEdit
  };

  return <CrmCustomerTasksContext.Provider value={value}>{children}</CrmCustomerTasksContext.Provider>;
}

export function CrmCustomerTaskForm() {
  const {
    directory,
    meId,
    banner,
    saving,
    busyId,
    editingId,
    taskType,
    setTaskType,
    taskDate,
    setTaskDate,
    taskTime,
    setTaskTime,
    assignSelect,
    setAssignSelect,
    notes,
    setNotes,
    showTaskDetails,
    openTasks,
    onCreate,
    cancelEdit,
    onSaveEdit
  } = useCrmCustomerTasksContext();

  return (
    <div className="crmCustomerTaskPanel" aria-labelledby="crm-customer-tasks-heading">
      <form className="crmCustomerTaskForm" onSubmit={(event) => void onCreate(event)}>
        <div className="crmLogActivityIntro">
          <h3 id="crm-customer-tasks-heading" className="crmLogActivityHeading">
            Schedule a task
          </h3>
          <div className="crmCustomerTaskTypeRow" role="group" aria-label="Task type">
            {TASK_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={`crmCustomerTaskTypeBtn${taskType === type ? " crmCustomerTaskTypeBtnActive" : ""}`}
                onClick={() => {
                  if (taskType === type) {
                    cancelEdit();
                  } else {
                    setTaskType(type);
                  }
                }}
                aria-pressed={taskType === type}
              >
                <CustomerTaskTypeIcon taskType={type} />
                <span>{CUSTOMER_TASK_TYPE_LABELS[type]}</span>
              </button>
            ))}
          </div>
        </div>

        {banner ? (
          <p className="crmBanner" role="alert">
            {banner}
          </p>
        ) : null}

        {showTaskDetails ? (
          <>
            <div className="crmCustomerTaskFormGrid">
              <label className="crmCustomerTaskField">
                <span className="loginLabel">Date</span>
                <input
                  type="date"
                  className="crmCustomerTaskInput"
                  value={taskDate}
                  onChange={(event) => setTaskDate(event.target.value)}
                  required
                />
              </label>
              <label className="crmCustomerTaskField">
                <span className="loginLabel">Time</span>
                <select
                  className="crmCustomerTaskInput"
                  value={taskTime}
                  onChange={(event) => setTaskTime(event.target.value)}
                  required
                >
                  {TIME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="crmCustomerTaskField crmCustomerTaskFieldWide">
                <span className="loginLabel">Assign to</span>
                <select
                  className="crmCustomerTaskInput"
                  value={assignSelect}
                  onChange={(event) => setAssignSelect(event.target.value)}
                  required
                >
                  {meId ? <option value="__me">Me</option> : null}
                  {directory.map((row) => (
                    <option key={row.user_id} value={row.user_id}>
                      {directoryPersonLabel(row)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="crmCustomerTaskField crmCustomerTaskFieldWide">
                <span className="loginLabel">Notes (optional)</span>
                <textarea
                  className="crmCustomerTaskTextarea"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={2}
                  placeholder="Add context for this task…"
                />
              </label>
            </div>

            {editingId ? (
              <div className="crmCustomerTaskFormActions">
                <button
                  type="button"
                  className="topBarSheetButton"
                  disabled={busyId === editingId}
                  onClick={() => {
                    const task = openTasks.find((row) => row.id === editingId);
                    if (task) {
                      void onSaveEdit(task);
                    }
                  }}
                >
                  Save changes
                </button>
                <button type="button" className="crmCustomerTaskSecondaryBtn" onClick={cancelEdit}>
                  Cancel edit
                </button>
              </div>
            ) : (
              <button type="submit" className="topBarSheetButton" disabled={saving || !taskType}>
                {saving ? "Adding…" : "Add task"}
              </button>
            )}
          </>
        ) : null}
      </form>
    </div>
  );
}

export function CrmCustomerTaskList() {
  const { directory, loading, openTasks, busyId, onToggle, onDelete, startEdit } = useCrmCustomerTasksContext();
  const now = useNowTick(30_000);

  return (
    <section className="crmCustomerTaskListSection" aria-labelledby="crm-customer-open-tasks-heading">
      <h3 id="crm-customer-open-tasks-heading" className="crmSubheading">
        Open tasks
      </h3>
      {loading ? (
        <p className="crmMuted">Loading tasks…</p>
      ) : openTasks.length === 0 ? (
        <p className="crmMuted">No open tasks for this customer.</p>
      ) : (
        <ul className="crmCustomerTaskList">
          {openTasks.map((task) => {
            const assigneeRow = directory.find((row) => row.user_id === task.assigned_to);
            const assignLabel = assigneeRow
              ? directoryPersonLabel(assigneeRow)
              : task.assigned_to_email ?? "Team member";
            const busy = busyId === task.id;
            const urgency = customerTaskUrgencyFor(task, now);
            return (
              <li
                key={task.id}
                className={customerTaskUrgencyRowClass("crmCustomerTaskRow", urgency)}
              >
                <div className="crmCustomerTaskRowMain">
                  <div className="crmCustomerTaskRowBody">
                    <div className="crmCustomerTaskRowTitleLine">
                      <span className="crmCustomerTaskRowIcon" aria-hidden="true">
                        <CustomerTaskTypeIcon taskType={task.task_type} />
                      </span>
                      <strong className="crmCustomerTaskRowTitle">{task.title}</strong>
                      {urgency ? <CustomerTaskUrgencyMarker urgency={urgency} /> : null}
                    </div>
                    <span className="crmCustomerTaskRowMeta">
                      {task.task_date} · {formatCustomerTaskTime(task.task_time)} · {assignLabel}
                    </span>
                    {task.notes ? <p className="crmCustomerTaskRowNotes">{task.notes}</p> : null}
                  </div>
                </div>
                <div className="crmCustomerTaskRowActions">
                  <button
                    type="button"
                    className="crmCustomerTaskSecondaryBtn"
                    disabled={busy}
                    onClick={() => void onToggle(task)}
                  >
                    {task.completed_at ? "Undo" : "Done"}
                  </button>
                  <button
                    type="button"
                    className="crmCustomerTaskSecondaryBtn"
                    disabled={busy}
                    onClick={() => startEdit(task)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="crmCustomerTaskSecondaryBtn crmCustomerTaskDangerBtn"
                    disabled={busy}
                    onClick={() => void onDelete(task)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
