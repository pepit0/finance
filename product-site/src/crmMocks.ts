import logoUrl from "./assets/logo.png";
import { el } from "./dom";

export type CrmMockTabId = "todo" | "customers" | "chat" | "systemLeads" | "team";

export type CrmMockTab = {
  id: CrmMockTabId;
  label: string;
  /** Optional screenshot path under src/assets — replaces HTML mock when set. */
  imageSrc?: string;
};

export const crmMockTabs: CrmMockTab[] = [
  { id: "todo", label: "To-do" },
  { id: "customers", label: "Customers" },
  { id: "chat", label: "Chat" },
  { id: "systemLeads", label: "System leads" },
  { id: "team", label: "Team" }
];

const frameNavLabels: Record<CrmMockTabId, string> = {
  todo: "To-do (3)",
  customers: "Customers",
  chat: "Chat",
  systemLeads: "System leads",
  team: "Team"
};

function mockHeaderIconBtn(label: string, icon: "minus" | "close"): HTMLButtonElement {
  const svg =
    icon === "minus"
      ? `<svg class="crmMockIconBtnSvg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`
      : `<svg class="crmMockIconBtnSvg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const btn = el("button", {
    type: "button",
    class: "crmMockIconBtn",
    "aria-label": label,
    title: label
  });
  btn.innerHTML = svg;
  return btn;
}

function mockField(label: string, value: string, ghost = false): HTMLLabelElement {
  return el("label", { class: "crmMockField" }, [
    el("span", { class: "crmMockFieldLabel" }, [label]),
    el("span", {
      class: `crmMockFieldControl${ghost ? " crmMockFieldControl--ghost" : ""}`
    }, [value])
  ]);
}

function mockSegmented(
  items: Array<{ label: string; value: string }>,
  activeValue: string,
  group: string
): HTMLDivElement {
  const wrap = el("div", {
    class: "crmMockSegmented",
    role: "group",
    "data-mock-segment-group": group
  });
  for (const item of items) {
    wrap.append(
      el("button", {
        type: "button",
        class: `crmMockSegment${item.value === activeValue ? " crmMockSegment--active" : ""}`,
        "data-mock-segment": item.value,
        "aria-pressed": item.value === activeValue ? "true" : "false"
      }, [item.label])
    );
  }
  return wrap;
}

function mockActionBtn(
  label: string,
  variant: "default" | "primary" | "soft" = "default",
  attrs: Record<string, string> = {}
): HTMLButtonElement {
  const classes = ["crmMockBtn"];
  if (variant === "primary") classes.push("crmMockBtn--primary");
  if (variant === "soft") classes.push("crmMockBtn--soft");
  return el("button", { type: "button", class: classes.join(" "), ...attrs }, [label]);
}

function mockBadge(text: string, variant: "pipeline" | "pipeline-alt" | "customer" | "lender" = "pipeline"): HTMLSpanElement {
  return el("span", { class: `crmMockBadge crmMockBadge--${variant}` }, [text]);
}

function mockPresence(status: "online" | "away" | "offline", label: string): HTMLSpanElement {
  return el("span", { class: "crmMockPresence" }, [
    el("span", { class: `crmMockPresenceDot crmMockPresenceDot--${status}`, "aria-hidden": "true" }),
    label
  ]);
}

function mockDlRow(dt: string, dd: string): DocumentFragment {
  const frag = document.createDocumentFragment();
  frag.append(el("dt", {}, [dt]), el("dd", {}, [dd]));
  return frag;
}

function mockTodoRow(
  title: string,
  meta: string,
  options: { done?: boolean; customer?: boolean; urgent?: boolean } = {}
): HTMLLIElement {
  const row = el("li", {
    class: `crmMockTodoRow${options.done ? " crmMockTodoRow--done" : ""}`,
    role: "button",
    tabindex: "0"
  });
  if (options.urgent) {
    row.append(el("span", { class: "crmMockUrgency", "aria-hidden": "true" }));
  }
  row.append(el("span", { class: "crmMockTodoCheck", "aria-hidden": "true" }));

  const top = el("span", { class: "crmMockTodoRowTop" }, [
    el("span", { class: "crmMockTodoRowTitle" }, [title])
  ]);
  if (options.customer) {
    top.append(mockBadge("Customer", "customer"));
  }

  const body = el("div", { class: "crmMockTodoRowBody" }, [
    top,
    el("span", { class: "crmMockTodoRowMeta" }, [meta])
  ]);
  row.append(body);
  return row;
}

function renderTodoBody(): HTMLElement {
  const list = el("ul", { class: "crmMockTodoList" });
  list.append(
    mockTodoRow("Review weekend appointment board", "Personal · 9:00 AM"),
    mockTodoRow("Send funding docs to Sam K.", "Personal · 11:30 AM", { done: true }),
    mockTodoRow("Call Alex R. — credit app received", "Customer · 2:00 PM · Alex R.", {
      customer: true,
      urgent: true
    }),
    mockTodoRow("Text Riley P. appointment reminder", "Customer · 4:30 PM · Riley P.", { customer: true })
  );

  return el("div", { class: "crmMockTodo" }, [
    el("div", { class: "crmMockTodoHero" }, [
      el("div", { class: "crmMockTodoHeroTop" }, [
        mockField("Agenda for", "Jamie S. (you)"),
        el("div", { class: "crmMockTodoHeroActions" }, [
          el("span", { class: "crmMockIconChip", "aria-hidden": "true" }),
          el("span", { class: "crmMockIconChip", "aria-hidden": "true" })
        ])
      ]),
      el("div", { class: "crmMockTodoHeroBody" }, [
        el("div", {}, [
          el("p", { class: "crmMockTodoWeekday" }, ["Wednesday"]),
          el("h2", { class: "crmMockTodoTitle" }, ["Today's agenda"]),
          el("p", { class: "crmMockTodoDateSub" }, ["Wednesday, June 17, 2026"])
        ]),
        el("div", {}, [
          el("div", { class: "crmMockProgressRing" }, ["67%"]),
          el("p", { class: "crmMockProgressLabel" }, ["2 of 3 done"])
        ])
      ]),
      el("div", { class: "crmMockProgressBar" }, [
        el("span", { class: "crmMockProgressBarFill" })
      ])
    ]),
    el("section", { class: "crmMockCard crmMockAgendaCard" }, [
      el("div", { class: "crmMockAgendaHead" }, [
        el("h3", {}, ["Tasks"]),
        el("span", { class: "crmMockMuted" }, ["4 total"])
      ]),
      list
    ])
  ]);
}

function renderCustomersBody(): HTMLElement {
  const rows = el("ul", { class: "crmMockCustomerRows" });
  const customers: Array<[string, string, string, string, string, string, boolean]> = [
    ["jordan", "Jordan M.", "(416) 555-0192", "Assigned: you", "Working", "Approved", true],
    ["sam", "Sam K.", "(647) 555-0144", "Assigned: Taylor R.", "Approved", "Submitted", false],
    ["alex", "Alex R.", "(905) 555-0108", "Unassigned", "New lead", "", false],
    ["riley", "Riley P.", "(416) 555-0177", "Assigned: you", "Appointment", "", false]
  ];
  for (const [id, name, phone, assignee, stage, lender, active] of customers) {
    const stack = el("div", { class: "crmMockCustomerRowStack" }, [mockBadge(stage, stage === "Approved" ? "pipeline-alt" : "pipeline")]);
    if (lender) {
      stack.append(mockBadge(lender, "lender"));
    }
    rows.append(
      el("li", {}, [
        el("button", {
          type: "button",
          class: `crmMockCustomerRow${active ? " crmMockCustomerRow--active" : ""}`,
          "data-mock-customer": id
        }, [
          el("div", {}, [
            el("span", { class: "crmMockCustomerRowName" }, [name]),
            el("span", { class: "crmMockCustomerRowMeta" }, [phone]),
            el("span", { class: "crmMockCustomerRowMeta" }, [assignee])
          ]),
          stack
        ])
      ])
    );
  }

  const tasksPanel = el("section", {
    class: "crmMockCard crmMockTasksPanel",
    "data-mock-tasks-panel": "true",
    hidden: "true"
  }, [
    el("h4", { class: "crmMockTasksPanelTitle" }, ["Upcoming customer tasks"]),
    el("ul", { class: "crmMockTasksPanelList" }, [
      el("li", {}, ["2:00 PM · Call Alex R."]),
      el("li", {}, ["4:30 PM · Text Riley P."]),
      el("li", {}, ["Tomorrow · Follow up with Sam K."])
    ])
  ]);

  return el("div", { class: "crmMockCustomers" }, [
    el("div", { class: "crmMockCustomersHead" }, [
      el("div", {}, [
        el("h2", {}, ["Customers"]),
        el("p", { class: "crmMockCustomersCount" }, ["12 active"])
      ])
    ]),
    el("div", { class: "crmMockCard crmMockCustomersToolbar" }, [
      el("div", { class: "crmMockCustomersToolbarLead" }, [
        mockSegmented(
          [
            { label: "Active", value: "active" },
            { label: "Lost", value: "lost" }
          ],
          "active",
          "customers-list"
        ),
        mockActionBtn("+ Add customer", "primary")
      ]),
      el("div", { class: "crmMockCustomersSorters" }, [
        mockField("Assignee", "Everyone"),
        mockField("Pipeline", "All stages"),
        mockField("Sort by", "Recent activity")
      ])
    ]),
    el("div", { class: "crmMockCustomersGrid" }, [
      el("aside", { class: "crmMockCard crmMockSideRail", "aria-label": "List views" }, [
        el("button", {
          type: "button",
          class: "crmMockSideRailBtn crmMockSideRailBtn--active",
          "data-mock-side-rail": "customers",
          "aria-label": "Customers"
        }, [
          el("span", { class: "crmMockSideRailIcon" }),
          el("span", { class: "crmMockSideRailCount" }, ["12"])
        ]),
        el("button", {
          type: "button",
          class: "crmMockSideRailBtn",
          "data-mock-side-rail": "tasks",
          "aria-label": "Tasks"
        }, [
          el("span", { class: "crmMockSideRailIcon" }),
          el("span", { class: "crmMockSideRailCount" }, ["3"])
        ])
      ]),
      el("div", { class: "crmMockListColumn" }, [
        el("section", { class: "crmMockCard crmMockCustomerList" }, [
          el("div", { class: "crmMockCustomerListHead" }, [
            el("div", { class: "crmMockCustomerListTabs" }, [
              el("button", {
                type: "button",
                class: "crmMockCustomerListTab crmMockCustomerListTab--active",
                "data-mock-list-view": "customers"
              }, ["Active customers"]),
              el("button", {
                type: "button",
                class: "crmMockCustomerListTab",
                "data-mock-list-view": "tasks"
              }, ["Tasks"])
            ])
          ]),
          rows,
          el("p", { class: "crmMockMuted crmMockCustomersEmpty", "data-mock-customers-empty": "true", hidden: "true" }, [
            "No lost customers in this demo view."
          ])
        ]),
        tasksPanel
      ]),
      el("section", { class: "crmMockCard crmMockDetail" }, [
        el("div", { class: "crmMockDetailTop" }, [
          el("div", { "data-mock-detail-badges": "true" }),
          el("h3", { class: "crmMockProfileTitle", "data-mock-detail-title": "true" }, ["Jordan M."]),
          el("dl", { class: "crmMockProfileSummary", "data-mock-detail-summary": "true" }, [
            mockDlRow("Phone", "(416) 555-0192"),
            mockDlRow("Email", "jordan.m@email.com"),
            mockDlRow("Assignee", "You"),
            mockDlRow("Source", "Walk-in")
          ])
        ]),
        el("div", { class: "crmMockActivitySection" }, [
          el("h4", {}, ["Activity"]),
          el("div", { "data-mock-detail-activities": "true" })
        ])
      ])
    ])
  ]);
}

function renderChatBody(): HTMLElement {
  const threads = el("ul", { class: "crmMockChatThreadList" });
  const threadData: Array<[string, string, string, string, string, boolean]> = [
    ["jordan", "JM", "Jordan M.", "Sounds good — see you Saturday", "10:24 AM", true],
    ["alex", "AR", "Alex R.", "Can you send the application link?", "Yesterday", false],
    ["riley", "RP", "Riley P.", "Thanks!", "Mon", false],
    ["sam", "SK", "Sam K.", "I'll stop by after work", "Sun", false]
  ];
  for (const [id, initials, name, preview, time, active] of threadData) {
    threads.append(
      el("li", {}, [
        el("button", {
          type: "button",
          class: `crmMockChatThreadItem${active ? " crmMockChatThreadItem--active" : ""}`,
          "data-mock-chat": id
        }, [
          el("span", { class: "crmMockChatAvatar", style: "background:#5856d6" }, [initials]),
          el("span", {}, [
            el("span", { class: "crmMockChatThreadTop" }, [
              el("span", { class: "crmMockChatThreadName" }, [name]),
              el("span", { class: "crmMockChatThreadTime" }, [time])
            ]),
            el("span", { class: "crmMockChatThreadPreview" }, [preview])
          ])
        ])
      ])
    );
  }

  return el("section", { class: "crmMockCard crmMockChat" }, [
    el("header", { class: "crmMockChatHeader" }, [
      el("div", { class: "crmMockChatHeaderRow" }, [
        el("div", {}, [
          el("h2", {}, ["Chat"]),
          el("span", { class: "crmMockChatCount" }, ["4 conversations"])
        ]),
        mockField("Inbox for", "Jamie S. (you)")
      ])
    ]),
    el("div", { class: "crmMockChatToolbar" }, [
      el("span", { class: "crmMockFieldControl crmMockFieldControl--ghost" }, ["Search"]),
      mockSegmented(
        [
          { label: "All", value: "all" },
          { label: "My customers", value: "mine" },
          { label: "Unread", value: "unread" }
        ],
        "all",
        "chat-filter"
      ),
      mockActionBtn("New text", "primary")
    ]),
    el("div", { class: "crmMockChatBody" }, [
      el("aside", { class: "crmMockChatThreads" }, [threads]),
      el("div", { class: "crmMockChatPanel" }, [
        el("div", { class: "crmMockChatPanelHead", "data-mock-chat-head": "true" }, [
          "Jordan M. · (416) 555-0192"
        ]),
        el("div", { class: "crmMockChatMessages", "data-mock-chat-messages": "true" }),
        el("div", { class: "crmMockChatCompose" }, [
          el("span", {
            class: "crmMockChatComposeInput",
            "data-mock-chat-compose": "true",
            contenteditable: "true",
            role: "textbox",
            "aria-label": "Message"
          }, ["Write a message…"]),
          mockActionBtn("Send", "primary", { "data-mock-chat-send": "true" })
        ])
      ])
    ])
  ]);
}

function renderSystemLeadsBody(): HTMLElement {
  const list = el("ul", { class: "crmMockLeadsList" });
  const leads: Array<[string, string, string, string, string, string?]> = [
    [
      "Alex R.",
      "Jun 17, 2026, 10:18 AM",
      "alex.r@email.com",
      "(905) 555-0108",
      "2022 Honda CR-V",
      "Metro Logistics Inc."
    ],
    ["Casey L.", "Jun 17, 2026, 9:52 AM", "casey.l@email.com", "(416) 555-0133", "", undefined],
    [
      "Morgan T.",
      "Jun 17, 2026, 9:04 AM",
      "morgan.t@email.com",
      "(647) 555-0181",
      "2020 F-150",
      undefined
    ]
  ];

  for (const [name, time, email, phone, vehicle, employer] of leads) {
    const dl = el("dl", { class: "crmMockLeadDl" }, [
      mockDlRow("Email", email),
      mockDlRow("Phone", phone)
    ]);
    if (vehicle) {
      dl.append(mockDlRow("Vehicle", vehicle));
    }
    if (employer) {
      dl.append(mockDlRow("Employer", employer));
    }

    list.append(
      el("li", {}, [
        el("article", { class: "crmMockCard crmMockLeadCard", "data-mock-lead-card": "true" }, [
          el("header", { class: "crmMockLeadHeader" }, [
            el("time", { class: "crmMockLeadTime" }, [time]),
            el("span", { class: "crmMockLeadName" }, [name]),
            mockActionBtn("Print", "soft")
          ]),
          dl,
          el("div", { class: "crmMockLeadAssign" }, [
            el("label", { class: "crmMockField" }, [
              el("span", { class: "crmMockFieldLabel" }, ["Assign to"]),
              el("button", {
                type: "button",
                class: "crmMockFieldControl crmMockFieldControl--ghost",
                "data-mock-lead-select": "true"
              }, ["Select team member…"])
            ]),
            el("div", { class: "crmMockLeadAssignActions" }, [
              mockActionBtn("Assign", "primary", { "data-mock-lead-assign": "true" }),
              mockActionBtn("Lost", "soft", { "data-mock-lead-lost": "true" })
            ])
          ])
        ])
      ])
    );
  }

  return el("div", {}, [
    el("p", { class: "crmMockPanelIntro" }, [
      "New credit applications from the marketing site arrive here as ",
      el("strong", {}, ["system leads"]),
      ". Customer records are created automatically; assign each lead to a team member to work the deal in ",
      el("strong", {}, ["Customers"]),
      "."
    ]),
    el("p", {
      class: "crmMockLeadBanner",
      "data-mock-lead-banner": "true",
      hidden: "true",
      role: "status"
    }),
    list
  ]);
}

function renderTeamBody(): HTMLElement {
  const grid = el("div", { class: "crmMockTeamGrid" });
  const members: Array<[string, string, string, "online" | "away" | "offline"]> = [
    ["TR", "Taylor R.", "Sales", "online"],
    ["AP", "Alex P.", "Finance", "online"],
    ["KM", "Kim M.", "BDC", "away"],
    ["NP", "Noah P.", "Sales", "offline"]
  ];
  for (const [initials, name, role, status] of members) {
    grid.append(
      el("article", { class: "crmMockCard crmMockTeamCard" }, [
        el("span", { class: "crmMockTeamAvatar crmMockTeamCardAvatar" }, [initials]),
        el("div", {}, [
          el("p", { class: "crmMockTeamCardName" }, [name]),
          el("p", { class: "crmMockMuted" }, [role]),
          mockPresence(status, status === "online" ? "Online" : status === "away" ? "Away" : "Offline")
        ])
      ])
    );
  }

  return el("div", { class: "crmMockTeam" }, [
    el("header", { class: "crmMockTeamHeader" }, [
      el("p", { class: "crmMockMuted" }, [
        "See who is online and reach out when you need help on a deal."
      ]),
      el("div", { class: "crmMockTeamStats" }, [
        mockPresence("online", "2 online"),
        mockPresence("away", "1 away"),
        mockPresence("offline", "1 offline")
      ])
    ]),
    el("section", { class: "crmMockCard crmMockTeamSelf" }, [
      el("h3", {}, ["Your profile"]),
      el("div", { class: "crmMockTeamSelfBody" }, [
        el("span", { class: "crmMockTeamAvatar" }, ["JS"]),
        el("div", { class: "crmMockTeamSelfMeta" }, [
          el("p", { class: "crmMockTeamMemberName" }, ["Jamie S."]),
          mockPresence("online", "Online"),
          el("p", { class: "crmMockTeamMemberRole" }, ["Sales · Manager"]),
          el("p", { class: "crmMockTeamMemberEmail" }, ["jamie@demomotors.com"]),
          mockField("Display name", "Jamie S."),
          mockField("Phone for calls", "(416) 555-0100")
        ])
      ])
    ]),
    grid
  ]);
}

const mockBodies: Record<CrmMockTabId, () => HTMLElement> = {
  todo: renderTodoBody,
  customers: renderCustomersBody,
  chat: renderChatBody,
  systemLeads: renderSystemLeadsBody,
  team: renderTeamBody
};

function renderFrameNav(activeId: CrmMockTabId): HTMLElement {
  const nav = el("nav", { class: "crmMockTabBar", "aria-label": "CRM sections (preview)" });
  for (const tab of crmMockTabs) {
    const isActive = tab.id === activeId;
    nav.append(
      el("button", {
        type: "button",
        class: `crmMockAppTab${isActive ? " crmMockAppTab--active" : ""}`,
        "data-mock-nav": tab.id,
        "aria-current": isActive ? "page" : "false"
      }, [frameNavLabels[tab.id]])
    );
  }
  return nav;
}

export function renderCrmMockFrame(tabId: CrmMockTabId, imageSrc?: string): HTMLElement {
  const frame = el("div", { class: "crmMockFrame" });
  frame.append(
    el("header", { class: "crmMockHeader" }, [
      el("div", { class: "crmMockTopBar" }, [
        el("div", { class: "crmMockTitleBlock" }, [
          el("img", {
            class: "crmMockBrandLogo",
            src: logoUrl,
            alt: "",
            width: "32",
            height: "32",
            decoding: "async"
          }),
          el("div", {}, [
            el("h1", {}, ["Demo Motors"]),
            el("p", { class: "crmMockSubtitle" }, ["Customer management"])
          ])
        ]),
        el("div", { class: "crmMockTopBarTrail" }, [
          mockHeaderIconBtn("Personal settings", "minus"),
          mockHeaderIconBtn("Alerts", "close")
        ])
      ]),
      el("div", { class: "crmMockSearchRow" }, [
        el("input", {
          type: "search",
          class: "crmMockSearchInput",
          placeholder: "Quick customer search…",
          "aria-label": "Quick customer search",
          autocomplete: "off"
        })
      ])
    ]),
    renderFrameNav(tabId)
  );

  if (imageSrc) {
    frame.append(
      el("div", { class: "crmMockViewport crmMockViewport--image" }, [
        el("img", { src: imageSrc, alt: `${frameNavLabels[tabId]} screen preview`, class: "crmMockScreenshot" })
      ])
    );
  } else {
    frame.append(el("div", { class: "crmMockViewport" }, [mockBodies[tabId]()]));
  }

  return frame;
}
