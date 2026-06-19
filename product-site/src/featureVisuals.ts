import { el } from "./dom";

export type FeatureVisualId =
  | "pipeline"
  | "comms"
  | "team"
  | "branding"
  | "alerts"
  | "mobile";

function miniFrame(modifier: FeatureVisualId, children: (Node | string)[]): HTMLElement {
  return el("div", {
    class: `featureVisual featureVisual--${modifier}`,
    "aria-hidden": "true"
  }, [
    el("div", { class: "fvMiniFrame" }, children)
  ]);
}

function pipelineVisual(): HTMLElement {
  return miniFrame("pipeline", [
    el("div", { class: "fvMiniToolbar" }, [
      el("span", { class: "fvMiniSegment fvMiniSegment--active" }, ["Active"]),
      el("span", { class: "fvMiniSegment" }, ["Lost"])
    ]),
    el("div", { class: "fvMiniCustomer fvMiniCustomer--active" }, [
      el("div", { class: "fvMiniCustomerText" }, [
        el("span", { class: "fvMiniCustomerName" }, ["Jordan M."]),
        el("span", { class: "fvMiniCustomerMeta" }, ["(416) 555-0192"])
      ]),
      el("span", { class: "fvMiniBadge fvMiniBadge--pipeline" }, ["Working"])
    ]),
    el("div", { class: "fvMiniCustomer" }, [
      el("div", { class: "fvMiniCustomerText" }, [
        el("span", { class: "fvMiniCustomerName" }, ["Sam K."]),
        el("span", { class: "fvMiniCustomerMeta" }, ["Assigned: Taylor"])
      ]),
      el("span", { class: "fvMiniBadge fvMiniBadge--pipelineAlt" }, ["Approved"])
    ])
  ]);
}

function commsVisual(): HTMLElement {
  return miniFrame("comms", [
    el("div", { class: "fvMiniSplit" }, [
      el("div", { class: "fvMiniProfile" }, [
        el("span", { class: "fvMiniProfileName" }, ["Jordan M."]),
        el("div", { class: "fvMiniPhoneRow" }, [
          el("span", { class: "fvMiniPhoneNum" }, ["(416) 555-0192"]),
          el("span", { class: "fvMiniIconBtn fvMiniIconBtn--call" }),
          el("span", { class: "fvMiniIconBtn fvMiniIconBtn--text" })
        ]),
        el("span", { class: "fvMiniActivityTag" }, ["Call · 4 min"])
      ]),
      el("div", { class: "fvMiniChat" }, [
        el("span", { class: "fvMiniChatBubble fvMiniChatBubble--in" }, ["Still interested in the SUV?"]),
        el("span", { class: "fvMiniChatBubble fvMiniChatBubble--out" }, ["Yes — Saturday works"])
      ])
    ])
  ]);
}

function teamVisual(): HTMLElement {
  return miniFrame("team", [
    el("div", { class: "fvMiniTeamRow" }, [
      el("span", { class: "fvMiniTeamAvatar" }, ["T"]),
      el("div", { class: "fvMiniTeamInfo" }, [
        el("span", { class: "fvMiniTeamName" }, ["Taylor R."]),
        el("span", { class: "fvMiniTeamRole" }, ["Sales · Manager"])
      ]),
      el("span", { class: "fvMiniPresence" }, [
        el("span", { class: "fvMiniPresenceDot" }),
        "Online"
      ])
    ]),
    el("div", { class: "fvMiniTeamRow fvMiniTeamRow--dim" }, [
      el("span", { class: "fvMiniTeamAvatar fvMiniTeamAvatar--b" }, ["J"]),
      el("div", { class: "fvMiniTeamInfo" }, [
        el("span", { class: "fvMiniTeamName" }, ["Jamie S."]),
        el("span", { class: "fvMiniTeamRole" }, ["Finance · Rep"])
      ]),
      el("span", { class: "fvMiniPresence fvMiniPresence--away" }, [
        el("span", { class: "fvMiniPresenceDot fvMiniPresenceDot--away" }),
        "Away"
      ])
    ])
  ]);
}

function brandingVisual(): HTMLElement {
  return miniFrame("branding", [
    el("div", { class: "fvMiniSettingsRow" }, [
      el("span", { class: "fvMiniSettingsLabel" }, ["Logo"]),
      el("span", { class: "fvMiniLogoUpload" })
    ]),
    el("div", { class: "fvMiniSettingsRow" }, [
      el("span", { class: "fvMiniSettingsLabel" }, ["Accent color"]),
      el("span", { class: "fvMiniColorPick" })
    ]),
    el("div", { class: "fvMiniHeaderPreview" }, [
      el("span", { class: "fvMiniHeaderLogo" }),
      el("span", { class: "fvMiniHeaderTitle" }, ["Your Motors CRM"])
    ])
  ]);
}

function alertsVisual(): HTMLElement {
  return miniFrame("alerts", [
    el("div", { class: "fvMiniTopBar" }, [
      el("span", { class: "fvMiniTopBarTitle" }, ["Tempt CRM"]),
      el("span", { class: "fvMiniBell" }, [
        el("span", { class: "fvMiniBellDot" })
      ])
    ]),
    el("div", { class: "fvMiniNotifList" }, [
      el("div", { class: "fvMiniNotif fvMiniNotif--hot" }, [
        el("span", { class: "fvMiniNotifTitle" }, ["Stale lead"]),
        el("span", { class: "fvMiniNotifBody" }, ["Alex R. · no activity 3 days"])
      ]),
      el("div", { class: "fvMiniNotif" }, [
        el("span", { class: "fvMiniNotifTitle" }, ["System lead"]),
        el("span", { class: "fvMiniNotifBody" }, ["Website application received"])
      ])
    ])
  ]);
}

function mobileVisual(): HTMLElement {
  return miniFrame("mobile", [
    el("div", { class: "fvMiniPhoneWrap" }, [
      el("div", { class: "fvMiniPhoneInner" }, [
        el("div", { class: "fvMiniPhoneTabs" }, [
          el("span", { class: "fvMiniPhoneTab" }, ["To-do"]),
          el("span", { class: "fvMiniPhoneTab fvMiniPhoneTab--active" }, ["Customers"]),
          el("span", { class: "fvMiniPhoneTab" }, ["Chat"])
        ]),
        el("div", { class: "fvMiniPhoneCustomer fvMiniPhoneCustomer--active" }, [
          el("span", { class: "fvMiniPhoneCustomerName" }, ["Riley P."]),
          el("span", { class: "fvMiniBadge fvMiniBadge--pipeline" }, ["Appt"])
        ]),
        el("div", { class: "fvMiniPhoneCustomer" }, [
          el("span", { class: "fvMiniPhoneCustomerName" }, ["Alex R."]),
          el("span", { class: "fvMiniBadge fvMiniBadge--pipeline" }, ["New lead"])
        ])
      ])
    ])
  ]);
}

export function renderFeatureVisual(id: FeatureVisualId): HTMLElement {
  switch (id) {
    case "pipeline":
      return pipelineVisual();
    case "comms":
      return commsVisual();
    case "team":
      return teamVisual();
    case "branding":
      return brandingVisual();
    case "alerts":
      return alertsVisual();
    case "mobile":
      return mobileVisual();
  }
}
