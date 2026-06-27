import "./crm-mock.css";
import { crmMockTabs, renderCrmMockFrame, type CrmMockTabId } from "./crmMocks";
import { initMockInteractions } from "./crmMockInteractions";
import { el } from "./dom";

function setActiveTab(root: HTMLElement, tabId: CrmMockTabId): void {
  const buttons = root.querySelectorAll<HTMLButtonElement>("[data-crm-preview-tab]");
  const panels = root.querySelectorAll<HTMLElement>("[data-crm-preview-panel]");

  for (const button of buttons) {
    const isActive = button.dataset.crmPreviewTab === tabId;
    button.classList.toggle("crmPreviewTab--active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
    button.tabIndex = isActive ? 0 : -1;
  }

  for (const panel of panels) {
    const isActive = panel.dataset.crmPreviewPanel === tabId;
    panel.classList.toggle("crmPreviewPanel--hidden", !isActive);
    panel.hidden = !isActive;
  }
}

export function renderCrmPreview(): HTMLElement {
  const root = el("div", { class: "crmPreview" });
  const tabList = el("div", {
    class: "crmPreviewTabs",
    role: "tablist",
    "aria-label": "CRM screen previews"
  });

  const panels = el("div", { class: "crmPreviewPanels" });
  const defaultTab = crmMockTabs[0].id;

  for (const tab of crmMockTabs) {
    const isDefault = tab.id === defaultTab;
    const button = el("button", {
      type: "button",
      class: `crmPreviewTab${isDefault ? " crmPreviewTab--active" : ""}`,
      role: "tab",
      "aria-selected": isDefault ? "true" : "false",
      "aria-controls": `crm-preview-${tab.id}`,
      id: `crm-preview-tab-${tab.id}`,
      "data-crm-preview-tab": tab.id,
      tabindex: isDefault ? "0" : "-1"
    }, [tab.label]);

    button.addEventListener("click", () => setActiveTab(root, tab.id));

    tabList.append(button);

    const panelAttrs: Record<string, string> = {
      class: `crmPreviewPanel${isDefault ? "" : " crmPreviewPanel--hidden"}`,
      role: "tabpanel",
      id: `crm-preview-${tab.id}`,
      "aria-labelledby": `crm-preview-tab-${tab.id}`,
      "data-crm-preview-panel": tab.id
    };
    if (!isDefault) {
      panelAttrs.hidden = "true";
    }

    panels.append(
      el("div", panelAttrs, [renderCrmMockFrame(tab.id, tab.imageSrc)])
    );
  }

  const openChatThread = (threadId: string): void => {
    setActiveTab(root, "chat");
    const chatFrame = root.querySelector<HTMLElement>(
      '[data-crm-preview-panel="chat"] .crmMockFrame'
    );
    chatFrame?.dispatchEvent(
      new CustomEvent("mock-select-chat", { detail: { threadId } })
    );
  };

  for (const tab of crmMockTabs) {
    const panel = panels.querySelector<HTMLElement>(`[data-crm-preview-panel="${tab.id}"]`);
    const frame = panel?.querySelector<HTMLElement>(".crmMockFrame");
    if (frame && !tab.imageSrc) {
      initMockInteractions(
        frame,
        tab.id,
        (nextTab) => setActiveTab(root, nextTab),
        openChatThread
      );
    }
  }

  root.append(
    el("div", { class: "crmPreviewToolbar" }, [
      tabList,
      el("p", { class: "crmPreviewCaption" }, ["Interactive preview · sample data"])
    ]),
    panels
  );

  return root;
}
