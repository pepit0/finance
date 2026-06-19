import type { CrmMockTabId } from "./crmMocks";

export type MockNavigateTab = (tabId: CrmMockTabId) => void;
export type MockOpenChat = (threadId: string) => void;

type MockActivity = { kind: string; body: string; when: string; author: string };

type MockCustomer = {
  name: string;
  phone: string;
  email: string;
  assignee: string;
  source: string;
  stage: string;
  stageVariant: "pipeline" | "pipeline-alt";
  lender?: string;
  activities: MockActivity[];
};

const mockCustomers: Record<string, MockCustomer> = {
  jordan: {
    name: "Jordan M.",
    phone: "(416) 555-0192",
    email: "jordan.m@email.com",
    assignee: "You",
    source: "Walk-in",
    stage: "Working",
    stageVariant: "pipeline",
    lender: "Approved",
    activities: [
      { kind: "Call", body: "Discussed 2021 RAV4 trade-in · bridged 4 min", when: "Today, 10:42 AM", author: "You" },
      { kind: "Text", body: "Sent Saturday appointment link", when: "Yesterday, 4:15 PM", author: "You" },
      { kind: "Comment", body: "Wants to test drive this weekend", when: "Yesterday, 2:03 PM", author: "You" }
    ]
  },
  sam: {
    name: "Sam K.",
    phone: "(647) 555-0144",
    email: "sam.k@email.com",
    assignee: "Taylor R.",
    source: "Referral",
    stage: "Approved",
    stageVariant: "pipeline-alt",
    lender: "Submitted",
    activities: [
      { kind: "Comment", body: "Docs sent to lender", when: "Today, 9:10 AM", author: "Taylor R." },
      { kind: "Call", body: "Confirmed income documents · 6 min", when: "Yesterday, 3:40 PM", author: "You" }
    ]
  },
  alex: {
    name: "Alex R.",
    phone: "(905) 555-0108",
    email: "alex.r@email.com",
    assignee: "Unassigned",
    source: "System lead",
    stage: "New lead",
    stageVariant: "pipeline",
    activities: [
      { kind: "Comment", body: "Full application received from website", when: "Today, 10:18 AM", author: "System" }
    ]
  },
  riley: {
    name: "Riley P.",
    phone: "(416) 555-0177",
    email: "riley.p@email.com",
    assignee: "You",
    source: "Phone-in",
    stage: "Appointment",
    stageVariant: "pipeline",
    activities: [
      { kind: "Text", body: "Confirmed Saturday 11 AM test drive", when: "Today, 8:05 AM", author: "You" },
      { kind: "Call", body: "Scheduled lot visit · 3 min", when: "Mon, 5:22 PM", author: "You" }
    ]
  }
};

type MockChatThread = {
  name: string;
  phone: string;
  avatarColor: string;
  messages: Array<{ text: string; out?: boolean }>;
};

const mockChatThreads: Record<string, MockChatThread> = {
  jordan: {
    name: "Jordan M.",
    phone: "(416) 555-0192",
    avatarColor: "#5856d6",
    messages: [
      { text: "Hi Jordan — still interested in the SUV we looked at?" },
      { text: "Yes! Can I come in Saturday around 11?", out: true },
      { text: "Perfect. I'll have it pulled up front for you." }
    ]
  },
  alex: {
    name: "Alex R.",
    phone: "(905) 555-0108",
    avatarColor: "#007aff",
    messages: [
      { text: "Hi Alex, this is Demo Motors — got your application." },
      { text: "Can you send the application link again?", out: true },
      { text: "Absolutely — here's the secure link to finish up." }
    ]
  },
  riley: {
    name: "Riley P.",
    phone: "(416) 555-0177",
    avatarColor: "#34c759",
    messages: [
      { text: "Reminder: your test drive is Saturday at 11 AM." },
      { text: "Thanks!", out: true }
    ]
  },
  sam: {
    name: "Sam K.",
    phone: "(647) 555-0144",
    avatarColor: "#ff9500",
    messages: [
      { text: "Sam, your lender submission is in — we'll update you soon." },
      { text: "I'll stop by after work", out: true },
      { text: "Sounds good. We'll have the paperwork ready." }
    ]
  }
};

function bindSegmentGroups(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>("[data-mock-segment-group]").forEach((group) => {
    group.addEventListener("click", (event) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-mock-segment]");
      if (!target || !group.contains(target)) {
        return;
      }
      group.querySelectorAll("[data-mock-segment]").forEach((segment) => {
        segment.classList.remove("crmMockSegment--active");
        segment.setAttribute("aria-pressed", "false");
      });
      target.classList.add("crmMockSegment--active");
      target.setAttribute("aria-pressed", "true");
      group.dispatchEvent(new CustomEvent("mock-segment-change", { bubbles: true, detail: { value: target.dataset.mockSegment } }));
    });
  });
}

function renderDetailBadges(customer: MockCustomer): HTMLElement {
  const row = document.createElement("div");
  row.className = "crmMockProfileStatusRow";
  row.innerHTML = `<span class="crmMockBadge crmMockBadge--${customer.stageVariant}">${customer.stage}</span>`;
  if (customer.lender) {
    row.innerHTML += `<span class="crmMockBadge crmMockBadge--lender">${customer.lender}</span>`;
  }
  return row;
}

function renderActivityList(activities: MockActivity[]): HTMLElement {
  const list = document.createElement("ul");
  list.className = "crmMockActivityList";
  for (const item of activities) {
    const li = document.createElement("li");
    li.className = "crmMockActivityItem";
    li.innerHTML = `
      <span class="crmMockActivityKind">${item.kind}</span>
      <span>${item.body}</span>
      <span class="crmMockActivityWhen">${item.when} · ${item.author}</span>
    `;
    list.appendChild(li);
  }
  return list;
}

function initTodo(frame: HTMLElement): void {
  const list = frame.querySelector(".crmMockTodoList");
  const ring = frame.querySelector(".crmMockProgressRing");
  const label = frame.querySelector(".crmMockProgressLabel");
  const fill = frame.querySelector<HTMLElement>(".crmMockProgressBarFill");
  if (!list || !ring || !label || !fill) {
    return;
  }

  const syncProgress = (): void => {
    const rows = list.querySelectorAll<HTMLElement>(".crmMockTodoRow");
    const total = rows.length;
    const done = list.querySelectorAll(".crmMockTodoRow--done").length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    ring.textContent = `${pct}%`;
    label.textContent = `${done} of ${total} done`;
    fill.style.width = `${pct}%`;
  };

  list.addEventListener("click", (event) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>(".crmMockTodoRow");
    if (!row) {
      return;
    }
    row.classList.toggle("crmMockTodoRow--done");
    syncProgress();
  });

  syncProgress();
}

function initCustomers(frame: HTMLElement, openChat: MockOpenChat): void {
  const statusRow = frame.querySelector("[data-mock-detail-badges]");
  const title = frame.querySelector("[data-mock-detail-title]");
  const summary = frame.querySelector("[data-mock-detail-summary]");
  const activitiesHost = frame.querySelector("[data-mock-detail-activities]");
  const count = frame.querySelector(".crmMockCustomersCount");
  const list = frame.querySelector(".crmMockCustomerRows");
  const listPanel = frame.querySelector<HTMLElement>(".crmMockCustomerList");
  const empty = frame.querySelector<HTMLElement>("[data-mock-customers-empty]");
  const tasksPanel = frame.querySelector<HTMLElement>("[data-mock-tasks-panel]");

  if (!statusRow || !title || !summary || !activitiesHost || !list) {
    return;
  }

  const selectCustomer = (id: string): void => {
    const customer = mockCustomers[id];
    if (!customer) {
      return;
    }
    list.querySelectorAll(".crmMockCustomerRow").forEach((row) => {
      row.classList.toggle("crmMockCustomerRow--active", (row as HTMLElement).dataset.mockCustomer === id);
    });
    statusRow.replaceChildren(renderDetailBadges(customer));
    title.textContent = customer.name;
    summary.replaceChildren(
      elPhoneSummaryRow(id, customer.phone, openChat),
      elSummaryRow("Email", customer.email),
      elSummaryRow("Assignee", customer.assignee),
      elSummaryRow("Source", customer.source)
    );
    activitiesHost.replaceChildren(renderActivityList(customer.activities));
  };

  list.addEventListener("click", (event) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>(".crmMockCustomerRow");
    if (!row?.dataset.mockCustomer) {
      return;
    }
    selectCustomer(row.dataset.mockCustomer);
  });

  frame.querySelectorAll<HTMLElement>("[data-mock-side-rail]").forEach((btn) => {
    btn.addEventListener("click", () => {
      frame.querySelectorAll("[data-mock-side-rail]").forEach((el) => {
        el.classList.toggle("crmMockSideRailBtn--active", el === btn);
      });
      const view = btn.dataset.mockSideRail;
      if (listPanel) {
        listPanel.hidden = view === "tasks";
      }
      if (tasksPanel) {
        tasksPanel.hidden = view !== "tasks";
      }
    });
  });

  frame.querySelectorAll<HTMLElement>("[data-mock-list-view]").forEach((tab) => {
    tab.addEventListener("click", () => {
      frame.querySelectorAll("[data-mock-list-view]").forEach((el) => {
        el.classList.toggle("crmMockCustomerListTab--active", el === tab);
      });
      const view = tab.dataset.mockListView;
      if (listPanel) {
        listPanel.hidden = view === "tasks";
      }
      if (tasksPanel) {
        tasksPanel.hidden = view !== "tasks";
      }
      frame.querySelectorAll("[data-mock-side-rail]").forEach((el) => {
        el.classList.toggle("crmMockSideRailBtn--active", (el as HTMLElement).dataset.mockSideRail === view);
      });
    });
  });

  frame.addEventListener("mock-segment-change", (event) => {
    const detail = (event as CustomEvent<{ value?: string }>).detail;
    if (detail?.value === "lost") {
      if (count) count.textContent = "3 lost";
      list.querySelectorAll("li").forEach((li) => {
        (li as HTMLElement).hidden = true;
      });
      if (empty) empty.hidden = false;
    } else if (detail?.value === "active") {
      if (count) count.textContent = "12 active";
      list.querySelectorAll("li").forEach((li) => {
        (li as HTMLElement).hidden = false;
      });
      if (empty) empty.hidden = true;
    }
  });

  selectCustomer("jordan");
}

function elSummaryRow(label: string, value: string): DocumentFragment {
  const dt = document.createElement("dt");
  dt.textContent = label;
  const dd = document.createElement("dd");
  dd.textContent = value;
  const frag = document.createDocumentFragment();
  frag.append(dt, dd);
  return frag;
}

function mockCallIconSvg(): string {
  return `<svg class="crmMockProfilePhoneActionIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
}

function mockChatIconSvg(): string {
  return `<svg class="crmMockProfilePhoneActionIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
}

function elPhoneSummaryRow(
  customerId: string,
  phone: string,
  openChat: MockOpenChat
): DocumentFragment {
  const dt = document.createElement("dt");
  dt.textContent = "Phone";
  const dd = document.createElement("dd");
  dd.className = "crmMockProfilePhoneRow";

  const value = document.createElement("span");
  value.className = "crmMockProfilePhoneValue";
  value.textContent = phone;

  const callBtn = document.createElement("button");
  callBtn.type = "button";
  callBtn.className = "crmMockProfilePhoneActionBtn";
  callBtn.setAttribute("aria-label", "Call customer");
  callBtn.setAttribute("title", "Call customer");
  callBtn.innerHTML = mockCallIconSvg();
  callBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  const textBtn = document.createElement("button");
  textBtn.type = "button";
  textBtn.className = "crmMockProfilePhoneActionBtn";
  textBtn.setAttribute("aria-label", "Text customer");
  textBtn.setAttribute("title", "Text customer");
  textBtn.innerHTML = mockChatIconSvg();
  textBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openChat(customerId);
  });

  dd.append(value, callBtn, textBtn);
  const frag = document.createDocumentFragment();
  frag.append(dt, dd);
  return frag;
}

function initChat(frame: HTMLElement): void {
  const head = frame.querySelector("[data-mock-chat-head]");
  const messagesHost = frame.querySelector("[data-mock-chat-messages]");
  const compose = frame.querySelector<HTMLElement>("[data-mock-chat-compose]");
  const sendBtn = frame.querySelector<HTMLElement>("[data-mock-chat-send]");
  const threadList = frame.querySelector(".crmMockChatThreadList");
  if (!head || !messagesHost || !threadList) {
    return;
  }

  const renderThread = (id: string): void => {
    const thread = mockChatThreads[id];
    if (!thread) {
      return;
    }
    threadList.querySelectorAll(".crmMockChatThreadItem").forEach((item) => {
      item.classList.toggle("crmMockChatThreadItem--active", (item as HTMLElement).dataset.mockChat === id);
    });
    head.textContent = `${thread.name} · ${thread.phone}`;
    messagesHost.replaceChildren(
      ...thread.messages.map((msg) => {
        const bubble = document.createElement("div");
        bubble.className = `crmMockChatBubble${msg.out ? " crmMockChatBubble--out" : ""}`;
        bubble.textContent = msg.text;
        return bubble;
      })
    );
    if (compose) {
      compose.textContent = "Write a message…";
      compose.classList.remove("crmMockChatComposeInput--filled");
    }
  };

  threadList.addEventListener("click", (event) => {
    const item = (event.target as HTMLElement).closest<HTMLElement>(".crmMockChatThreadItem");
    if (!item?.dataset.mockChat) {
      return;
    }
    renderThread(item.dataset.mockChat);
  });

  frame.addEventListener("mock-segment-change", (event) => {
    const value = (event as CustomEvent<{ value?: string }>).detail?.value;
    threadList.querySelectorAll<HTMLElement>(".crmMockChatThreadItem").forEach((item) => {
      const id = item.dataset.mockChat ?? "";
      const isMine = id === "jordan" || id === "riley";
      const show =
        value === "all" ||
        (value === "mine" && isMine) ||
        (value === "unread" && id === "alex");
      item.closest("li")!.hidden = !show;
    });
  });

  if (compose && sendBtn) {
    const clearPlaceholder = (): void => {
      if (compose.textContent?.trim() === "Write a message…") {
        compose.textContent = "";
        compose.classList.add("crmMockChatComposeInput--filled");
      }
    };
    compose.addEventListener("focus", clearPlaceholder);
    compose.addEventListener("click", clearPlaceholder);
    compose.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        sendBtn.click();
      }
    });
    sendBtn.addEventListener("click", () => {
      const text = compose.textContent?.trim();
      if (!text || text === "Write a message…") {
        return;
      }
      const bubble = document.createElement("div");
      bubble.className = "crmMockChatBubble crmMockChatBubble--out";
      bubble.textContent = text;
      messagesHost.append(bubble);
      messagesHost.scrollTop = messagesHost.scrollHeight;
      compose.textContent = "Write a message…";
      compose.classList.remove("crmMockChatComposeInput--filled");
    });
  }

  frame.addEventListener("mock-select-chat", (event) => {
    const threadId = (event as CustomEvent<{ threadId?: string }>).detail?.threadId;
    if (threadId && mockChatThreads[threadId]) {
      renderThread(threadId);
    }
  });

  renderThread("jordan");
}

function initSystemLeads(frame: HTMLElement): void {
  frame.querySelectorAll<HTMLElement>("[data-mock-lead-card]").forEach((card) => {
    const assignBtn = card.querySelector<HTMLElement>("[data-mock-lead-assign]");
    const lostBtn = card.querySelector<HTMLElement>("[data-mock-lead-lost]");
    const select = card.querySelector<HTMLElement>("[data-mock-lead-select]");
    const banner = frame.querySelector<HTMLElement>("[data-mock-lead-banner]");

    const dismiss = (message: string): void => {
      card.classList.add("crmMockLeadCard--dismissed");
      window.setTimeout(() => card.closest("li")?.remove(), 280);
      if (banner) {
        banner.hidden = false;
        banner.textContent = message;
      }
    };

    select?.addEventListener("click", () => {
      if (select.classList.contains("crmMockFieldControl--ghost")) {
        select.textContent = "Taylor R.";
        select.classList.remove("crmMockFieldControl--ghost");
      }
    });

    assignBtn?.addEventListener("click", () => {
      const name = card.querySelector(".crmMockLeadName")?.textContent ?? "Lead";
      dismiss(`${name} assigned to Taylor R. — open Customers to continue.`);
    });

    lostBtn?.addEventListener("click", () => {
      const name = card.querySelector(".crmMockLeadName")?.textContent ?? "Lead";
      dismiss(`${name} moved to Lost customers.`);
    });
  });
}

function initTeam(frame: HTMLElement): void {
  frame.querySelectorAll<HTMLElement>(".crmMockTeamCard").forEach((card) => {
    card.addEventListener("click", () => {
      frame.querySelectorAll(".crmMockTeamCard").forEach((el) => {
        el.classList.toggle("crmMockTeamCard--selected", el === card);
      });
    });
  });
}

export function initMockInteractions(
  frame: HTMLElement,
  tabId: CrmMockTabId,
  navigateTab: MockNavigateTab,
  openChat: MockOpenChat
): void {
  if (frame.dataset.mockInteractive === "true") {
    return;
  }
  frame.dataset.mockInteractive = "true";

  frame.querySelectorAll<HTMLElement>("[data-mock-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.dataset.mockNav as CrmMockTabId | undefined;
      if (next && next !== tabId) {
        navigateTab(next);
      }
    });
  });

  bindSegmentGroups(frame);

  switch (tabId) {
    case "todo":
      initTodo(frame);
      break;
    case "customers":
      initCustomers(frame, openChat);
      break;
    case "chat":
      initChat(frame);
      break;
    case "systemLeads":
      initSystemLeads(frame);
      break;
    case "team":
      initTeam(frame);
      break;
  }
}
