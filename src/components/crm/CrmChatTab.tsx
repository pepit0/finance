import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { CrmSmsMessage, CrmSmsThread, CrmSmsThreadFilter, CrmUserDirectoryRow } from "../../types/crm";
import {
  fetchCrmUserDirectory,
  fetchSmsComposeTarget,
  fetchSmsMessages,
  fetchSmsThreads,
  markSmsThreadRead,
  sendSms
} from "../../lib/crmApi";
import { directoryPersonLabel } from "../../utils/crmDirectoryAdmin";
import { formatPhoneDisplay } from "../../utils/phoneFormat";
import { useCrmPermissionsContext } from "../../context/CrmPermissionsContext";
import { CrmNewTextModal } from "./CrmNewTextModal";

const THREAD_FILTERS: { value: CrmSmsThreadFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "mine", label: "My customers" },
  { value: "unread", label: "Unread" }
];

function formatThreadTime(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString(undefined, { timeStyle: "short" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

function formatBubbleTime(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString(undefined, { timeStyle: "short" });
  }
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function customerInitials(name: string | null | undefined): string {
  const trimmed = name?.trim() || "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["#5856d6", "#007aff", "#34c759", "#ff9500", "#ff2d55", "#af52de", "#5ac8fa", "#ffcc00"];

function avatarColorForName(name: string | null | undefined): string {
  const source = name?.trim() || "?";
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = source.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type CrmChatTabProps = {
  visible: boolean;
  userId: string | null;
  canAdminInboxes?: boolean;
  focusCustomerId?: string | null;
  onFocusCustomerHandled?: () => void;
  onOpenCustomer?: (customerId: string) => void;
};

export function CrmChatTab({
  visible,
  userId,
  canAdminInboxes = false,
  focusCustomerId = null,
  onFocusCustomerHandled,
  onOpenCustomer
}: CrmChatTabProps) {
  const permissions = useCrmPermissionsContext();
  const canSend = permissions.hasPermission("texts.send");

  const [directory, setDirectory] = useState<CrmUserDirectoryRow[]>([]);
  const [viewInboxUserId, setViewInboxUserId] = useState<string | null>(null);
  const [threads, setThreads] = useState<CrmSmsThread[]>([]);
  const [messages, setMessages] = useState<CrmSmsMessage[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [composeTarget, setComposeTarget] = useState<CrmSmsThread | null>(null);
  const [loadingComposeTarget, setLoadingComposeTarget] = useState(false);
  const [threadFilter, setThreadFilter] = useState<CrmSmsThreadFilter>("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [outgoingPending, setOutgoingPending] = useState<{ customerId: string; body: string } | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [newTextOpen, setNewTextOpen] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileLayout(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const inboxUserId = viewInboxUserId ?? userId;
  const isOwnInbox = Boolean(userId && inboxUserId === userId);

  const inboxLabel = useMemo(() => {
    if (!inboxUserId) {
      return "Team member";
    }
    const row = directory.find((entry) => entry.user_id === inboxUserId);
    if (row) {
      return directoryPersonLabel(row);
    }
    if (inboxUserId === userId) {
      return "You";
    }
    return "Team member";
  }, [directory, inboxUserId, userId]);

  const threadFilterOptions = useMemo(() => {
    if (isOwnInbox) {
      return THREAD_FILTERS;
    }
    return THREAD_FILTERS.map((option) =>
      option.value === "mine" ? { ...option, label: "Their customers" } : option
    );
  }, [isOwnInbox]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.customer_id === selectedCustomerId) ?? null,
    [selectedCustomerId, threads]
  );

  const activeThread = selectedThread ?? (composeTarget?.customer_id === selectedCustomerId ? composeTarget : null);

  const sidebarThreads = useMemo(() => {
    if (!activeThread || threads.some((thread) => thread.customer_id === activeThread.customer_id)) {
      return threads;
    }
    return [activeThread, ...threads];
  }, [activeThread, threads]);

  useEffect(() => {
    if (!visible || !canAdminInboxes) {
      return;
    }
    void fetchCrmUserDirectory().then((result) => {
      if (!result.error) {
        setDirectory(result.data);
      }
    });
  }, [canAdminInboxes, visible]);

  useEffect(() => {
    if (userId && !viewInboxUserId) {
      setViewInboxUserId(userId);
    }
  }, [userId, viewInboxUserId]);

  useEffect(() => {
    if (!canAdminInboxes && userId) {
      setViewInboxUserId(userId);
    }
  }, [canAdminInboxes, userId]);

  const reloadThreads = useCallback(async () => {
    if (!visible) {
      return;
    }
    setLoadingThreads(true);
    const result = await fetchSmsThreads({
      filter: threadFilter,
      userId,
      inboxUserId,
      search
    });
    setLoadingThreads(false);
    if (result.error) {
      setBanner(result.error);
      return;
    }
    setThreads(result.data);
  }, [inboxUserId, search, threadFilter, userId, visible]);

  const reloadMessages = useCallback(
    async (customerId: string) => {
      setLoadingMessages(true);
      const result = await fetchSmsMessages(customerId);
      setLoadingMessages(false);
      if (result.error) {
        setBanner(result.error);
        return;
      }
      setMessages(result.data);
      if (isOwnInbox) {
        await markSmsThreadRead(customerId);
        void reloadThreads();
      }
    },
    [isOwnInbox, reloadThreads]
  );

  useEffect(() => {
    void reloadThreads();
  }, [reloadThreads]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const timer = window.setInterval(() => {
      void reloadThreads();
      if (selectedCustomerId) {
        void fetchSmsMessages(selectedCustomerId).then((result) => {
          if (!result.error) {
            setMessages(result.data);
          }
        });
      }
    }, 12000);
    return () => window.clearInterval(timer);
  }, [reloadThreads, selectedCustomerId, visible]);

  useEffect(() => {
    if (!focusCustomerId || !visible) {
      return;
    }
    setThreadFilter("all");
    setSelectedCustomerId(focusCustomerId);
    onFocusCustomerHandled?.();
  }, [focusCustomerId, onFocusCustomerHandled, visible]);

  useEffect(() => {
    if (!selectedCustomerId || !visible) {
      setComposeTarget(null);
      return;
    }
    if (threads.some((thread) => thread.customer_id === selectedCustomerId)) {
      setComposeTarget(null);
      return;
    }

    let cancelled = false;
    setLoadingComposeTarget(true);
    void fetchSmsComposeTarget(selectedCustomerId).then((result) => {
      if (cancelled) {
        return;
      }
      setLoadingComposeTarget(false);
      if (result.error) {
        setBanner(result.error);
        setComposeTarget(null);
        return;
      }
      setComposeTarget(result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedCustomerId, threads, visible]);

  useEffect(() => {
    if (!selectedCustomerId || !visible) {
      setMessages([]);
      return;
    }
    void reloadMessages(selectedCustomerId);
  }, [reloadMessages, selectedCustomerId, visible]);

  useEffect(() => {
    if (!selectedCustomerId) {
      return;
    }
    if (loadingComposeTarget || composeTarget?.customer_id === selectedCustomerId) {
      return;
    }
    if (!threads.some((thread) => thread.customer_id === selectedCustomerId)) {
      setSelectedCustomerId(null);
    }
  }, [composeTarget?.customer_id, loadingComposeTarget, selectedCustomerId, threads]);

  const onSelectThread = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setBanner(null);
  };

  const closeMobileThread = () => {
    setSelectedCustomerId(null);
    setDraft("");
    setBanner(null);
  };

  const onNewTextCustomer = (customerId: string) => {
    setBanner(null);
    setSearch("");
    setSelectedCustomerId(customerId);
  };

  const mobileThreadOpen =
    isMobileLayout && Boolean(selectedCustomerId && (activeThread || loadingComposeTarget));

  const isDelivering =
    Boolean(outgoingPending && selectedCustomerId && outgoingPending.customerId === selectedCustomerId);

  const onSubmitMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCustomerId || !canSend || !isOwnInbox || outgoingPending?.customerId === selectedCustomerId) {
      return;
    }
    const body = draft.trim();
    if (!body) {
      return;
    }

    setDraft("");
    setOutgoingPending({ customerId: selectedCustomerId, body });
    setBanner(null);
    const result = await sendSms(selectedCustomerId, body);
    setOutgoingPending((current) => (current?.customerId === selectedCustomerId ? null : current));

    if (!result.ok) {
      setDraft((current) => (current ? current : body));
      setBanner(result.error);
      return;
    }

    await reloadMessages(selectedCustomerId);
    await reloadThreads();
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      <CrmNewTextModal
        open={newTextOpen}
        onClose={() => setNewTextOpen(false)}
        onSelect={onNewTextCustomer}
      />
      <section
      className={`crmCard crmChatTab${isMobileLayout ? " crmChatTabMobile" : ""}${mobileThreadOpen ? " crmChatTabMobileThreadOpen" : ""}`}
      aria-labelledby="crm-chat-heading"
    >
      {!mobileThreadOpen ? (
        <>
          <header className="crmChatHeader">
            <div className="crmChatHeaderRow">
              <div className="crmChatHeaderLead">
                <h2 id="crm-chat-heading" className="crmChatTitle">
                  {isMobileLayout ? "Messages" : "Chat"}
                </h2>
                {!loadingThreads && !isMobileLayout ? (
                  <span className="crmChatCount">
                    {threads.length} {threads.length === 1 ? "conversation" : "conversations"}
                  </span>
                ) : null}
              </div>
              <div className="crmChatHeaderActions">
                {canAdminInboxes && directory.length > 0 ? (
                  <label className="crmTodoUserPicker crmChatInboxPicker">
                    <span className="crmTodoUserPickerLabel">Inbox for</span>
                    <select
                      className="crmTodoUserSelect"
                      value={inboxUserId ?? ""}
                      onChange={(event) => {
                        const nextId = event.target.value || null;
                        setViewInboxUserId(nextId);
                        setSelectedCustomerId(null);
                        setDraft("");
                        setBanner(null);
                      }}
                      aria-label="Select inbox user"
                    >
                      {directory.map((row) => (
                        <option key={row.user_id} value={row.user_id}>
                          {row.user_id === userId ? `${directoryPersonLabel(row)} (you)` : directoryPersonLabel(row)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            </div>
            {!isOwnInbox ? (
              <p className="crmMuted crmChatInboxNote">
                Viewing {inboxLabel}&apos;s inbox. Unread badges reflect their read status; start your own inbox to
                reply.
              </p>
            ) : null}
          </header>

          {banner ? (
            <p className="crmBanner crmChatBanner" role="alert">
              {banner}
            </p>
          ) : null}

          <div className="crmChatToolbar">
            <input
              type="search"
              className="crmSearchInput crmChatSearch"
              placeholder="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search conversations"
            />
            {isMobileLayout ? (
              <div className="crmChatToolbarFiltersCol">
                <div className="crmSegmented crmChatFilterPills" role="group" aria-label="Thread filters">
                  {threadFilterOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`crmSegment${threadFilter === option.value ? " crmSegmentActive" : ""}`}
                      aria-pressed={threadFilter === option.value}
                      onClick={() => setThreadFilter(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {canSend && isOwnInbox ? (
                  <button
                    type="button"
                    className="topBarSheetButton crmChatNewTextBtn"
                    onClick={() => setNewTextOpen(true)}
                  >
                    New text
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="crmSegmented crmChatFilterPills" role="group" aria-label="Thread filters">
                {threadFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`crmSegment${threadFilter === option.value ? " crmSegmentActive" : ""}`}
                    aria-pressed={threadFilter === option.value}
                    onClick={() => setThreadFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      ) : banner ? (
        <p className="crmBanner crmChatBanner crmChatBannerThread" role="alert">
          {banner}
        </p>
      ) : null}

      <div
        className={`crmChatBody${isMobileLayout ? " crmChatBodyMobile" : ""}${mobileThreadOpen ? " crmChatBodyMobileThreadOpen" : ""}`}
      >
        <aside
          className={`crmChatThreadListPanel${mobileThreadOpen ? " crmChatThreadListPanelHidden" : ""}`}
          aria-label="Conversations"
          hidden={mobileThreadOpen ? true : undefined}
        >
          <div className="crmChatThreadListScroll">
            {loadingThreads ? (
              <p className="crmChatEmpty">Loading conversations…</p>
            ) : sidebarThreads.length === 0 ? (
              <p className="crmChatEmpty">No text conversations yet.</p>
            ) : (
              <ul className="crmChatThreadList">
                {sidebarThreads.map((thread) => {
                  const isSelected = thread.customer_id === selectedCustomerId;
                  const displayName = thread.customer_display_name?.trim() || "No name";
                  return (
                    <li key={thread.customer_id}>
                      <button
                        type="button"
                        className={`crmChatThreadItem${isSelected ? " crmChatThreadItemSelected" : ""}${
                          thread.unread ? " crmChatThreadItemUnread" : ""
                        }`}
                        onClick={() => onSelectThread(thread.customer_id)}
                      >
                        <span
                          className="crmChatThreadAvatar"
                          style={{ backgroundColor: avatarColorForName(displayName) }}
                          aria-hidden="true"
                        >
                          {customerInitials(displayName)}
                        </span>
                        <span className="crmChatThreadItemContent">
                          <span className="crmChatThreadItemTop">
                            <span className="crmChatThreadName">
                              {thread.unread ? <span className="crmChatUnreadDot" aria-hidden="true" /> : null}
                              {displayName}
                            </span>
                            <span className="crmChatThreadTime">{formatThreadTime(thread.last_message_at)}</span>
                          </span>
                          <span className="crmChatThreadPreview">{thread.last_message_preview}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {!isMobileLayout && canSend && isOwnInbox ? (
            <div className="crmChatThreadListFooter">
              <button
                type="button"
                className="topBarSheetButton crmChatNewTextBtn"
                onClick={() => setNewTextOpen(true)}
              >
                New text
              </button>
            </div>
          ) : null}
        </aside>

        <div className={`crmChatThreadPanel${mobileThreadOpen ? " crmChatThreadPanelMobileOpen" : ""}`}>
          {!activeThread && !loadingComposeTarget ? (
            <p className="crmChatEmpty crmChatThreadPlaceholder">
              Select a conversation to view messages.
            </p>
          ) : !activeThread && loadingComposeTarget ? (
            <p className="crmChatEmpty crmChatThreadPlaceholder">Loading customer…</p>
          ) : activeThread ? (
            <>
              <header className="crmChatThreadHeader">
                {isMobileLayout ? (
                  <button type="button" className="crmChatMobileBackBtn" onClick={closeMobileThread}>
                    <span className="crmChatMobileBackChevron" aria-hidden="true" />
                    <span>Messages</span>
                  </button>
                ) : null}
                <div className="crmChatThreadHeaderMain">
                  <h3 className="crmChatThreadTitle">{activeThread.customer_display_name?.trim() || "No name"}</h3>
                  {activeThread.customer_phone ? (
                    <p className="crmChatThreadPhone">{formatPhoneDisplay(activeThread.customer_phone)}</p>
                  ) : null}
                </div>
                {onOpenCustomer ? (
                  <button
                    type="button"
                    className={`topBarSheetButton crmChatOpenCustomerBtn${isMobileLayout ? " crmChatOpenCustomerBtnMobile" : ""}`}
                    onClick={() => onOpenCustomer(activeThread.customer_id)}
                    aria-label="Open customer profile"
                    title="Open customer"
                  >
                    {isMobileLayout ? "i" : "Open customer"}
                  </button>
                ) : null}
              </header>

              <div className="crmChatMessages" aria-live="polite">
                {loadingMessages ? (
                  <p className="crmChatEmpty">Loading messages…</p>
                ) : messages.length === 0 ? (
                  <p className="crmChatEmpty">No messages yet. Send the first text below.</p>
                ) : (
                  messages.map((message) => {
                    const inbound = message.sms_direction === "inbound";
                    return (
                      <div
                        key={message.id}
                        className={`crmChatBubbleRow${inbound ? " crmChatBubbleRowInbound" : " crmChatBubbleRowOutbound"}`}
                      >
                        <div className="crmChatBubbleStack">
                          <div
                            className={`crmChatBubble${inbound ? " crmChatBubbleInbound" : " crmChatBubbleOutbound"}`}
                          >
                            <p className="crmChatBubbleBody">{message.body}</p>
                            {!isMobileLayout ? (
                              <p className="crmChatBubbleMeta">
                                {formatMessageTime(message.created_at)}
                                {message.sms_status ? ` · ${message.sms_status}` : ""}
                              </p>
                            ) : null}
                          </div>
                          {isMobileLayout ? (
                            <p className="crmChatBubbleTimeMobile">{formatBubbleTime(message.created_at)}</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {canSend && isOwnInbox ? (
                <form
                  className={`crmChatComposer${isMobileLayout ? " crmChatComposerMobile" : ""}`}
                  onSubmit={(event) => void onSubmitMessage(event)}
                >
                  {!activeThread.customer_phone ? (
                    <p className="crmMuted crmChatComposerHint">This customer has no phone number on file.</p>
                  ) : null}
                  {isDelivering ? (
                    <div className="crmChatDelivering" role="status" aria-live="polite">
                      <span className="crmChatDeliveringLabel">Delivering…</span>
                      <div className="crmChatDeliveringTrack" aria-hidden="true">
                        <span className="crmChatDeliveringBarFill" />
                      </div>
                    </div>
                  ) : null}
                  <div className="crmChatComposerField">
                    <textarea
                      className="crmTextarea crmChatComposerInput"
                      rows={isMobileLayout ? 1 : 3}
                      placeholder="Write a text message…"
                      value={draft}
                      disabled={!activeThread.customer_phone}
                      onChange={(event) => setDraft(event.target.value)}
                      aria-label="Message"
                    />
                    <button
                      type="submit"
                      className="crmChatComposerSendBtn"
                      disabled={isDelivering || !draft.trim() || !activeThread.customer_phone}
                      aria-label={isDelivering ? "Delivering message" : "Send message"}
                      title={isDelivering ? "Delivering…" : "Send"}
                    >
                      <svg
                        className="crmChatComposerSendIcon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    </button>
                  </div>
                </form>
              ) : (
                <p className="crmMuted crmChatReadOnlyNote">
                  {!canSend
                    ? "You can read threads but do not have permission to send texts."
                    : `Switch to your inbox to send texts. You are viewing ${inboxLabel}'s inbox.`}
                </p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </section>
    </>
  );
}
