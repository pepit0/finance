import { type CSSProperties, type FormEvent, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { CrmTodoDailyLog, CrmTodoDefaultTemplate, CrmTodoItem, CrmUserDirectoryRow } from "../../types/crm";
import {
  createCrmTodoDefaultTemplate,
  createCrmTodoItem,
  crmTodoLocalDate,
  deleteCrmTodoDefaultTemplate,
  deleteCrmTodoItem,
  ensureCrmTodoDay,
  fetchCrmTodoDailyLogs,
  fetchCrmTodoDefaultTemplates,
  fetchCrmTodoItems,
  fetchCrmUserDirectory,
  toggleCrmTodoItem,
  updateCrmTodoDefaultTemplate
} from "../../lib/crmApi";
import { directoryPersonLabel } from "../../utils/crmDirectoryAdmin";
import { BookIcon, CloseIcon, GearIcon } from "./CrmTodoIcons";

type CrmTodoTabProps = {
  visible: boolean;
  userId: string | null;
  isDirectoryAdmin: boolean;
  onItemsChanged?: () => void;
};

type TodoPanel = "history" | "defaults" | null;

function formatDayHeading(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatWeekday(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { weekday: "long" });
}

function formatShortDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatLogDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export function CrmTodoTab({ visible, userId, isDirectoryAdmin, onItemsChanged }: CrmTodoTabProps) {
  const [directory, setDirectory] = useState<CrmUserDirectoryRow[]>([]);
  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [items, setItems] = useState<CrmTodoItem[]>([]);
  const [templates, setTemplates] = useState<CrmTodoDefaultTemplate[]>([]);
  const [logs, setLogs] = useState<CrmTodoDailyLog[]>([]);
  const [openPanel, setOpenPanel] = useState<TodoPanel>(null);
  const today = crmTodoLocalDate();
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newDefaultTitle, setNewDefaultTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [addingDefault, setAddingDefault] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateTitle, setEditingTemplateTitle] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const targetUserId = viewUserId ?? userId;
  const isOwnList = Boolean(userId && targetUserId === userId);
  const canEdit = isOwnList || (isDirectoryAdmin && adminMode);

  const targetLabel = useMemo(() => {
    if (!targetUserId) {
      return "Team member";
    }
    const row = directory.find((entry) => entry.user_id === targetUserId);
    if (row) {
      return directoryPersonLabel(row);
    }
    if (targetUserId === userId) {
      return "You";
    }
    return "Team member";
  }, [directory, targetUserId, userId]);

  const completedCount = items.filter((item) => item.completed_at).length;
  const progressPct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  useEffect(() => {
    if (!visible) {
      return;
    }
    void fetchCrmUserDirectory().then((result) => {
      if (!result.error) {
        setDirectory(result.data);
      }
    });
  }, [visible]);

  useEffect(() => {
    if (userId && !viewUserId) {
      setViewUserId(userId);
    }
  }, [userId, viewUserId]);

  useEffect(() => {
    if (!isDirectoryAdmin) {
      setAdminMode(false);
    }
  }, [isDirectoryAdmin]);

  useEffect(() => {
    if (isOwnList) {
      setAdminMode(false);
    }
  }, [isOwnList]);

  useEffect(() => {
    if (!openPanel) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenPanel(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openPanel]);

  useEffect(() => {
    if (!openPanel) {
      return;
    }
    const onDocClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openPanel]);

  const load = useCallback(async () => {
    if (!targetUserId) {
      return;
    }

    setLoading(true);
    setBanner(null);

    const shouldEnsure = isOwnList || (isDirectoryAdmin && adminMode);
    const [todayResult, templatesResult, logsResult] = await Promise.all([
      shouldEnsure
        ? ensureCrmTodoDay(crmTodoLocalDate(), targetUserId)
        : fetchCrmTodoItems(crmTodoLocalDate(), targetUserId),
      fetchCrmTodoDefaultTemplates(targetUserId),
      fetchCrmTodoDailyLogs(targetUserId, 21)
    ]);
    setLoading(false);

    if (todayResult.error) {
      setBanner(todayResult.error);
      setItems([]);
    } else {
      setItems(todayResult.data);
      if (isOwnList) {
        onItemsChanged?.();
      }
    }

    if (!templatesResult.error) {
      setTemplates(templatesResult.data);
    }

    if (!logsResult.error) {
      setLogs(logsResult.data);
    }
  }, [adminMode, isDirectoryAdmin, isOwnList, onItemsChanged, targetUserId]);

  useEffect(() => {
    if (!visible || !targetUserId) {
      return;
    }
    void load();
  }, [visible, targetUserId, load]);

  const onToggle = async (item: CrmTodoItem) => {
    if (!canEdit) {
      return;
    }
    const nextCompleted = !item.completed_at;
    setBusyId(item.id);
    setBanner(null);
    const result = await toggleCrmTodoItem(item.id, nextCompleted);
    setBusyId(null);
    if (result.error) {
      setBanner(result.error);
      return;
    }
    setItems((prev) =>
      prev.map((row) =>
        row.id === item.id
          ? { ...row, completed_at: nextCompleted ? new Date().toISOString() : null }
          : row
      )
    );
    if (isOwnList) {
      onItemsChanged?.();
    }
  };

  const onDelete = async (item: CrmTodoItem) => {
    if (!canEdit || item.is_default) {
      return;
    }
    setBusyId(item.id);
    setBanner(null);
    const result = await deleteCrmTodoItem(item.id);
    setBusyId(null);
    if (result.error) {
      setBanner(result.error);
      return;
    }
    setItems((prev) => prev.filter((row) => row.id !== item.id));
    if (isOwnList) {
      onItemsChanged?.();
    }
  };

  const onAddTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!canEdit || !targetUserId) {
      return;
    }
    const trimmed = newTaskTitle.trim();
    if (!trimmed) {
      setBanner("Enter a task title.");
      return;
    }
    setAdding(true);
    setBanner(null);
    const result = await createCrmTodoItem(crmTodoLocalDate(), trimmed, targetUserId);
    setAdding(false);
    if (result.error) {
      setBanner(result.error);
      return;
    }
    if (result.data) {
      setItems((prev) => [...prev, result.data!]);
      setNewTaskTitle("");
      if (isOwnList) {
        onItemsChanged?.();
      }
    }
  };

  const onAddDefault = async (event: FormEvent) => {
    event.preventDefault();
    if (!canEdit || !targetUserId) {
      return;
    }
    const trimmed = newDefaultTitle.trim();
    if (!trimmed) {
      setBanner("Enter a default task title.");
      return;
    }
    setAddingDefault(true);
    setBanner(null);
    const result = await createCrmTodoDefaultTemplate(trimmed, targetUserId);
    setAddingDefault(false);
    if (result.error) {
      setBanner(result.error);
      return;
    }
    if (result.data) {
      setTemplates((prev) => [...prev, result.data!]);
      setNewDefaultTitle("");
    }
  };

  const onSaveTemplateEdit = async (template: CrmTodoDefaultTemplate) => {
    if (!canEdit) {
      return;
    }
    const trimmed = editingTemplateTitle.trim();
    if (!trimmed) {
      setBanner("Enter a default task title.");
      return;
    }
    setBusyId(template.id);
    setBanner(null);
    const result = await updateCrmTodoDefaultTemplate(template.id, trimmed);
    setBusyId(null);
    if (result.error) {
      setBanner(result.error);
      return;
    }
    setTemplates((prev) =>
      prev.map((row) => (row.id === template.id ? { ...row, title: trimmed } : row))
    );
    setEditingTemplateId(null);
    setEditingTemplateTitle("");
  };

  const onDeleteTemplate = async (template: CrmTodoDefaultTemplate) => {
    if (!canEdit) {
      return;
    }
    setBusyId(template.id);
    setBanner(null);
    const result = await deleteCrmTodoDefaultTemplate(template.id);
    setBusyId(null);
    if (result.error) {
      setBanner(result.error);
      return;
    }
    setTemplates((prev) => prev.filter((row) => row.id !== template.id));
  };

  const togglePanel = (panel: Exclude<TodoPanel, null>) => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="crmTodoTab">
      {banner ? (
        <p className="crmBanner" role="alert">
          {banner}
        </p>
      ) : null}

      <header className="crmTodoHero">
        <div className="crmTodoHeroTop">
          <label className="crmTodoUserPicker">
            <span className="crmTodoUserPickerLabel">Agenda for</span>
            <select
              className="crmTodoUserSelect"
              value={targetUserId ?? ""}
              onChange={(event) => {
                const nextId = event.target.value;
                setViewUserId(nextId || null);
                if (nextId === userId) {
                  setAdminMode(false);
                }
              }}
            >
              {directory.map((row) => (
                <option key={row.user_id} value={row.user_id}>
                  {row.user_id === userId ? `${directoryPersonLabel(row)} (you)` : directoryPersonLabel(row)}
                </option>
              ))}
            </select>
          </label>

          <div className="crmTodoHeroActions">
            {isDirectoryAdmin && !isOwnList ? (
              adminMode ? (
                <button type="button" className="crmTodoAdminChip" onClick={() => setAdminMode(false)}>
                  Exit admin
                </button>
              ) : (
                <button type="button" className="crmTodoAdminChip crmTodoAdminChipMuted" onClick={() => setAdminMode(true)}>
                  Admin mode
                </button>
              )
            ) : null}
            <button
              type="button"
              className={`crmTodoIconBtn${openPanel === "defaults" ? " crmTodoIconBtnActive" : ""}`}
              onClick={() => togglePanel("defaults")}
              aria-expanded={openPanel === "defaults"}
              aria-label="Daily defaults settings"
              title="Daily defaults"
            >
              <GearIcon />
            </button>
            <button
              type="button"
              className={`crmTodoIconBtn${openPanel === "history" ? " crmTodoIconBtnActive" : ""}`}
              onClick={() => togglePanel("history")}
              aria-expanded={openPanel === "history"}
              aria-label="Task history"
              title="History"
            >
              <BookIcon />
            </button>
          </div>
        </div>

        {!canEdit && !isOwnList ? (
          <p className="crmTodoReadOnlyBanner" role="status">
            Viewing {targetLabel}&apos;s agenda (read-only).
          </p>
        ) : null}

        <div className="crmTodoHeroBody">
          <div className="crmTodoHeroDate">
            <p className="crmTodoHeroWeekday">{formatWeekday(today)}</p>
            <h2 id="crm-todo-heading" className="crmTodoHeroTitle">
              {isOwnList ? "Today's agenda" : `${targetLabel}'s agenda`}
            </h2>
            <p className="crmTodoDateSub">{formatDayHeading(today)}</p>
          </div>

          <div className="crmTodoHeroStats" aria-live="polite">
            <div
              className="crmTodoProgressRing"
              style={{ "--crm-todo-progress": `${progressPct}%` } as CSSProperties}
              role="img"
              aria-label={loading ? "Loading progress" : `${progressPct}% complete`}
            >
              <span className="crmTodoProgressRingValue">{loading ? "…" : `${progressPct}%`}</span>
            </div>
            <p className="crmTodoProgressLabel">
              {loading ? "Loading…" : `${completedCount} of ${items.length} done`}
            </p>
          </div>
        </div>

        <div className="crmTodoProgressBar" aria-hidden="true">
          <span className="crmTodoProgressBarFill" style={{ width: `${progressPct}%` }} />
        </div>
      </header>

      <section className="crmTodoAgendaCard" aria-labelledby="crm-todo-today-list">
        <div className="crmTodoAgendaCardHead">
          <h3 id="crm-todo-today-list" className="crmTodoAgendaCardTitle">
            Tasks
          </h3>
          <span className="crmTodoAgendaCardMeta">{items.length} total</span>
        </div>

        {loading && items.length === 0 ? (
          <p className="crmTodoEmpty">Loading tasks…</p>
        ) : items.length === 0 ? (
          <div className="crmTodoEmptyState">
            <p className="crmTodoEmptyTitle">Nothing scheduled yet</p>
            <p className="crmTodoEmpty">Add a task below or set up daily defaults with the gear icon.</p>
          </div>
        ) : (
          <ul className="crmTodoList">
            {items.map((item, index) => {
              const completed = Boolean(item.completed_at);
              const busy = busyId === item.id;
              return (
                <li
                  key={item.id}
                  className={`crmTodoRow${completed ? " crmTodoRowDone" : ""}`}
                  style={{ "--crm-todo-row-index": index } as CSSProperties}
                >
                  <label className="crmTodoCheckLabel">
                    <input
                      type="checkbox"
                      className="crmTodoCheck"
                      checked={completed}
                      disabled={busy || !canEdit}
                      onChange={() => void onToggle(item)}
                    />
                    <span className="crmTodoCheckUi" aria-hidden="true" />
                    <span className="crmTodoTitle">{item.title}</span>
                    {item.is_default ? <span className="crmTodoRowTag">Daily</span> : null}
                  </label>
                  {canEdit && !item.is_default ? (
                    <button
                      type="button"
                      className="crmTodoRemove"
                      disabled={busy}
                      onClick={() => void onDelete(item)}
                      aria-label={`Remove ${item.title}`}
                    >
                      Remove
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        {canEdit ? (
          <form className="crmTodoAddForm crmTodoAddFormInset" onSubmit={(event) => void onAddTask(event)}>
            <input
              type="text"
              className="crmTodoAddInput"
              value={newTaskTitle}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              placeholder="Add task for today…"
              maxLength={200}
              disabled={adding}
            />
            <button type="submit" className="topBarSheetButton" disabled={adding}>
              Add
            </button>
          </form>
        ) : null}
      </section>

      {openPanel ? (
        <div className="crmTodoDrawerBackdrop" aria-hidden="true" />
      ) : null}

      {openPanel === "history" ? (
        <aside className="crmTodoDrawer" ref={panelRef} role="dialog" aria-label="Task history">
          <div className="crmTodoDrawerHead">
            <div className="crmTodoDrawerTitleGroup">
              <BookIcon />
              <h3 className="crmTodoDrawerTitle">History</h3>
            </div>
            <button type="button" className="crmTodoIconBtn" onClick={() => setOpenPanel(null)} aria-label="Close history">
              <CloseIcon />
            </button>
          </div>
          <p className="crmTodoDrawerIntro">Archived days for {targetLabel}.</p>
          <div className="crmTodoDrawerBody">
            {logs.length === 0 ? (
              <p className="crmTodoEmpty">No archived days yet.</p>
            ) : (
              <ul className="crmTodoHistoryList">
                {logs.map((log) => {
                  const done = log.items.filter((item) => item.completed).length;
                  const pct = log.items.length > 0 ? Math.round((done / log.items.length) * 100) : 0;
                  return (
                    <li key={log.id} className="crmTodoHistoryDay">
                      <div className="crmTodoHistoryDayHead">
                        <div>
                          <strong>{formatLogDate(log.log_date)}</strong>
                          <span className="crmTodoHistoryShort">{formatShortDate(log.log_date)}</span>
                        </div>
                        <span className={`crmTodoHistoryScore${pct === 100 ? " crmTodoHistoryScoreDone" : ""}`}>
                          {done}/{log.items.length}
                        </span>
                      </div>
                      <ul className="crmTodoHistoryTasks">
                        {log.items.map((item, index) => (
                          <li
                            key={`${log.id}-${index}`}
                            className={item.completed ? "crmTodoHistoryTaskDone" : "crmTodoHistoryTaskPending"}
                          >
                            <span className="crmTodoHistoryMark" aria-hidden="true">
                              {item.completed ? "✓" : "○"}
                            </span>
                            {item.title}
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      ) : null}

      {openPanel === "defaults" ? (
        <aside className="crmTodoDrawer" ref={panelRef} role="dialog" aria-label="Daily defaults">
          <div className="crmTodoDrawerHead">
            <div className="crmTodoDrawerTitleGroup">
              <GearIcon />
              <h3 className="crmTodoDrawerTitle">Daily defaults</h3>
            </div>
            <button type="button" className="crmTodoIconBtn" onClick={() => setOpenPanel(null)} aria-label="Close settings">
              <CloseIcon />
            </button>
          </div>
          <p className="crmTodoDrawerIntro">
            Tasks added automatically each morning
            {canEdit ? " (changes apply to future days)." : "."}
          </p>
          <div className="crmTodoDrawerBody">
            {templates.length === 0 ? (
              <p className="crmTodoEmpty">No daily defaults yet.</p>
            ) : (
              <ul className="crmTodoList crmTodoDefaultsList">
                {templates.map((template) => {
                  const busy = busyId === template.id;
                  const editing = editingTemplateId === template.id;
                  return (
                    <li key={template.id} className="crmTodoRow crmTodoDefaultRow">
                      {editing && canEdit ? (
                        <form
                          className="crmTodoDefaultEditForm"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void onSaveTemplateEdit(template);
                          }}
                        >
                          <input
                            type="text"
                            className="crmTodoAddInput"
                            value={editingTemplateTitle}
                            onChange={(event) => setEditingTemplateTitle(event.target.value)}
                            maxLength={200}
                            disabled={busy}
                            autoFocus
                          />
                          <button type="submit" className="crmTodoDefaultSave" disabled={busy}>
                            Save
                          </button>
                          <button
                            type="button"
                            className="crmTodoRemove"
                            disabled={busy}
                            onClick={() => {
                              setEditingTemplateId(null);
                              setEditingTemplateTitle("");
                            }}
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <>
                          <span className="crmTodoTitle">{template.title}</span>
                          {canEdit ? (
                            <div className="crmTodoDefaultActions">
                              <button
                                type="button"
                                className="crmTodoDefaultEdit"
                                disabled={busy}
                                onClick={() => {
                                  setEditingTemplateId(template.id);
                                  setEditingTemplateTitle(template.title);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="crmTodoRemove"
                                disabled={busy}
                                onClick={() => void onDeleteTemplate(template)}
                                aria-label={`Remove default ${template.title}`}
                              >
                                Remove
                              </button>
                            </div>
                          ) : null}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {canEdit ? (
              <form className="crmTodoAddForm" onSubmit={(event) => void onAddDefault(event)}>
                <input
                  type="text"
                  className="crmTodoAddInput"
                  value={newDefaultTitle}
                  onChange={(event) => setNewDefaultTitle(event.target.value)}
                  placeholder="New daily default…"
                  maxLength={200}
                  disabled={addingDefault}
                />
                <button type="submit" className="topBarSheetButton" disabled={addingDefault}>
                  Add default
                </button>
              </form>
            ) : null}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
