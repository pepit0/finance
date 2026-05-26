/**
 * Facebook Marketplace form field selectors.
 * Update FIELD_SELECTORS if Facebook changes their UI.
 */
const FIELD_SELECTORS = {
  title: {
    ariaLabels: ["title", "listing title", "vehicle title"],
    placeholders: ["title"],
    names: ["title"],
    labels: ["title"]
  },
  year: {
    ariaLabels: ["year"],
    placeholders: ["year"],
    names: ["year"],
    labels: ["year"]
  },
  make: {
    ariaLabels: ["make", "manufacturer"],
    placeholders: ["make"],
    names: ["make"],
    labels: ["make"]
  },
  model: {
    ariaLabels: ["model"],
    placeholders: ["model"],
    names: ["model"],
    labels: ["model"]
  },
  price: {
    ariaLabels: ["price", "vehicle price", "listing price", "amount"],
    placeholders: ["price"],
    names: ["price"],
    labels: ["price"]
  },
  mileage: {
    ariaLabels: ["mileage", "odometer"],
    placeholders: ["mileage", "odometer"],
    names: ["mileage", "odometer"],
    labels: ["mileage", "odometer"]
  },
  description: {
    ariaLabels: ["description", "describe", "tell buyers"],
    placeholders: ["description", "describe"],
    names: ["description"],
    labels: ["description"]
  },
  condition: {
    ariaLabels: ["condition"],
    placeholders: ["condition"],
    names: ["condition"],
    labels: ["condition"]
  }
};

const OBSERVER_TIMEOUT_MS = 120000;
const BANNER_ID = "ml-banner";
const PHOTO_PANEL_ID = "ml-photo-panel";

const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  "value"
)?.set;

const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
  HTMLTextAreaElement.prototype,
  "value"
)?.set;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function reactSetValue(el, value) {
  const str = String(value);
  el.focus();
  const setter =
    el instanceof HTMLTextAreaElement ? nativeTextareaValueSetter : nativeInputValueSetter;
  if (setter) {
    setter.call(el, str);
  } else if ("value" in el) {
    el.value = str;
  } else if (el.isContentEditable) {
    el.textContent = str;
  }
  el.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: str
    })
  );
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
  el.blur();
}

function matchesHint(value, hints) {
  if (!value) return false;
  const lower = value.toLowerCase();
  return hints.some((hint) => lower.includes(hint));
}

function hintsMatchElement(el, hints) {
  const ariaLabel = el.getAttribute("aria-label") || "";
  const placeholder = el.getAttribute("placeholder") || "";
  const name = el.getAttribute("name") || "";
  const labelledBy = el.getAttribute("aria-labelledby") || "";
  let labelText = "";
  if (labelledBy) {
    labelText = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim() || "")
      .join(" ");
  }
  return (
    matchesHint(ariaLabel, hints.ariaLabels) ||
    matchesHint(placeholder, hints.placeholders) ||
    matchesHint(name, hints.names) ||
    matchesHint(labelText, hints.labels || hints.ariaLabels)
  );
}

function findInputByHints(hints) {
  const candidates = document.querySelectorAll(
    'input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]), textarea, [role="textbox"], [contenteditable="true"]'
  );
  for (const el of candidates) {
    if (hintsMatchElement(el, hints)) {
      return el;
    }
  }

  for (const el of document.querySelectorAll("[aria-label]")) {
    const ariaLabel = el.getAttribute("aria-label") || "";
    if (matchesHint(ariaLabel, hints.ariaLabels)) {
      const nested = el.querySelector(
        'input, textarea, [role="textbox"], [contenteditable="true"]'
      );
      if (nested) return nested;
      if (el.getAttribute("role") === "combobox" || el.getAttribute("role") === "textbox") {
        return el;
      }
    }
  }

  for (const label of document.querySelectorAll("label")) {
    const text = label.textContent?.trim() || "";
    if (matchesHint(text, hints.labels || hints.ariaLabels)) {
      const forId = label.getAttribute("for");
      if (forId) {
        const target = document.getElementById(forId);
        if (target) return target;
      }
      const nested = label.querySelector(
        'input, textarea, [role="textbox"], [contenteditable="true"], [role="combobox"]'
      );
      if (nested) return nested;
    }
  }

  return null;
}

function findConditionControl(hints) {
  for (const select of document.querySelectorAll("select")) {
    if (hintsMatchElement(select, hints)) return select;
  }
  for (const box of document.querySelectorAll('[role="combobox"], [role="listbox"]')) {
    if (hintsMatchElement(box, hints)) return box;
  }
  return null;
}

async function pickOptionMatching(value) {
  await sleep(350);
  const target = String(value).trim().toLowerCase();
  for (const option of document.querySelectorAll('[role="option"], [role="menuitemradio"]')) {
    const text = option.textContent?.trim().toLowerCase() || "";
    if (text === target || text.includes(target) || target.includes(text)) {
      option.click();
      return true;
    }
  }
  return false;
}

async function fillField(el, value) {
  if (!el || value == null || value === "") return false;

  const role = el.getAttribute("role");
  if (role === "combobox" || el.closest('[role="combobox"]')) {
    const combo = role === "combobox" ? el : el.closest('[role="combobox"]');
    combo.click();
    combo.focus();
    const inner = combo.querySelector("input") || combo;
    reactSetValue(inner, value);
    return pickOptionMatching(value);
  }

  reactSetValue(el, value);
  return true;
}

async function setConditionGood(control) {
  if (!control) return false;

  if (control instanceof HTMLSelectElement) {
    for (const option of control.options) {
      if (option.textContent.trim().toLowerCase() === "good") {
        control.value = option.value;
        control.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    }
  }

  if (control.getAttribute("role") === "combobox") {
    control.click();
    return pickOptionMatching("good");
  }

  return false;
}

function buildDescription(vehicle) {
  const lines = [
    [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" "),
    `${Number(vehicle.mileage || 0).toLocaleString()} miles`
  ];
  if (vehicle.vin) {
    lines.push(`VIN: ${vehicle.vin}`);
  }
  lines.push("", "Financing available — call us today!");
  return lines.join("\n");
}

function buildTitle(vehicle) {
  return [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");
}

function buildCopyText(vehicle) {
  return [
    `Title: ${buildTitle(vehicle)}`,
    `Price: $${Number(vehicle.price || 0).toLocaleString()}`,
    `Mileage: ${Number(vehicle.mileage || 0).toLocaleString()} mi`,
    vehicle.vin ? `VIN: ${vehicle.vin}` : "",
    "",
    "Description:",
    buildDescription(vehicle)
  ]
    .filter(Boolean)
    .join("\n");
}

function injectStyles() {
  if (document.getElementById("ml-styles")) return;

  const style = document.createElement("style");
  style.id = "ml-styles";
  style.textContent = `
    #${BANNER_ID} {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      padding: 12px 20px;
      background: #1e1e2e;
      color: #ffffff;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    #${BANNER_ID} .ml-banner-text { flex: 1; line-height: 1.4; }
    #${BANNER_ID} .ml-banner-btn {
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      background: #2563eb;
      color: #ffffff;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
    }
    #${BANNER_ID} .ml-banner-btn:hover { background: #1d4ed8; }
    #${BANNER_ID} .ml-banner-btn.secondary { background: #475569; }
    #${BANNER_ID} .ml-banner-btn:disabled { background: #475569; cursor: default; }
    #${PHOTO_PANEL_ID} {
      position: fixed;
      top: 52px;
      left: 0;
      right: 0;
      z-index: 999998;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      font-family: system-ui, -apple-system, sans-serif;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    #${PHOTO_PANEL_ID} .ml-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 20px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #1e293b;
      user-select: none;
    }
    #${PHOTO_PANEL_ID} .ml-panel-body { padding: 0 20px 12px; display: none; }
    #${PHOTO_PANEL_ID}.ml-expanded .ml-panel-body { display: block; }
    #${PHOTO_PANEL_ID} .ml-photo-list { list-style: none; margin: 0; padding: 0; }
    #${PHOTO_PANEL_ID} .ml-photo-list li { margin-bottom: 6px; }
    #${PHOTO_PANEL_ID} .ml-photo-list a { color: #2563eb; font-size: 13px; }
    #${PHOTO_PANEL_ID} .ml-photo-note { margin: 8px 0 0; font-size: 12px; color: #64748b; }
  `;
  document.head.appendChild(style);
}

function injectPhotoPanel(photos) {
  if (document.getElementById(PHOTO_PANEL_ID)) return;

  const panel = document.createElement("div");
  panel.id = PHOTO_PANEL_ID;
  panel.innerHTML = `
    <div class="ml-panel-header">
      <span>Vehicle Photos</span>
      <span class="ml-panel-toggle">Show</span>
    </div>
    <div class="ml-panel-body"></div>
  `;

  const header = panel.querySelector(".ml-panel-header");
  const toggle = panel.querySelector(".ml-panel-toggle");
  const body = panel.querySelector(".ml-panel-body");

  header.addEventListener("click", () => {
    panel.classList.toggle("ml-expanded");
    toggle.textContent = panel.classList.contains("ml-expanded") ? "Hide" : "Show";
  });

  const list = document.createElement("ul");
  list.className = "ml-photo-list";
  const photoUrls = Array.isArray(photos) ? photos : [];
  if (!photoUrls.length) {
    list.innerHTML = "<li>No photos available.</li>";
  } else {
    photoUrls.forEach((url, index) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = `Photo ${index + 1}`;
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  const note = document.createElement("p");
  note.className = "ml-photo-note";
  note.textContent =
    "Open each photo link, save the image, then attach to the Facebook listing. Use Copy details on the banner to paste text fields.";

  body.appendChild(list);
  body.appendChild(note);
  document.body.prepend(panel);
}

function injectBanner(vehicle, crmBaseUrl, apiKey, initialText) {
  let textEl;

  if (document.getElementById(BANNER_ID)) {
    textEl = document.querySelector(`#${BANNER_ID} .ml-banner-text`);
    if (textEl && initialText) textEl.textContent = initialText;
    return { setText: (msg) => { if (textEl) textEl.textContent = msg; } };
  }

  const banner = document.createElement("div");
  banner.id = BANNER_ID;

  textEl = document.createElement("span");
  textEl.className = "ml-banner-text";
  textEl.textContent =
    initialText ||
    "Marketplace Lister — click through Facebook's steps; we'll fill fields as they appear.";
  banner.appendChild(textEl);

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "ml-banner-btn secondary";
  copyBtn.textContent = "Copy details";
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText(vehicle));
      copyBtn.textContent = "Copied!";
      setTimeout(() => { copyBtn.textContent = "Copy details"; }, 2000);
    } catch {
      copyBtn.textContent = "Copy failed";
    }
  });
  banner.appendChild(copyBtn);

  if (vehicle.id) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ml-banner-btn";
    btn.textContent = "Mark as Posted";
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "Saving…";
      try {
        const base = crmBaseUrl.replace(/\/+$/, "");
        const response = await fetch(
          `${base}/api/extension/inventory/${vehicle.id}/marketplace-status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "x-api-key": apiKey },
            body: JSON.stringify({ posted: true, listedAt: new Date().toISOString() })
          }
        );
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        await chrome.storage.local.remove("pendingVehicle");
        textEl.textContent = "✓ Marked as posted in CRM";
        btn.remove();
      } catch (err) {
        btn.disabled = false;
        btn.textContent = "Mark as Posted";
        textEl.textContent = `Failed to update CRM: ${err instanceof Error ? err.message : "Unknown error"}`;
      }
    });
    banner.appendChild(btn);
  }

  document.body.prepend(banner);
  return { setText: (msg) => { textEl.textContent = msg; } };
}

async function tryFillForm(vehicle, filledKeys) {
  const tasks = [
    ["title", findInputByHints(FIELD_SELECTORS.title), buildTitle(vehicle)],
    ["year", findInputByHints(FIELD_SELECTORS.year), vehicle.year ? String(vehicle.year) : ""],
    ["make", findInputByHints(FIELD_SELECTORS.make), vehicle.make || ""],
    ["model", findInputByHints(FIELD_SELECTORS.model), vehicle.model || ""],
    ["price", findInputByHints(FIELD_SELECTORS.price), String(Number(vehicle.price) || 0)],
    ["mileage", findInputByHints(FIELD_SELECTORS.mileage), String(Number(vehicle.mileage) || 0)],
    ["description", findInputByHints(FIELD_SELECTORS.description), buildDescription(vehicle)]
  ];

  let newFills = 0;
  for (const [key, el, value] of tasks) {
    if (filledKeys.has(key) || !el || !value) continue;
    const ok = await fillField(el, value);
    if (ok) {
      filledKeys.add(key);
      newFills += 1;
    }
  }

  if (!filledKeys.has("condition")) {
    const conditionEl = findConditionControl(FIELD_SELECTORS.condition);
    if (conditionEl && (await setConditionGood(conditionEl))) {
      filledKeys.add("condition");
      newFills += 1;
    }
  }

  const hasIdentity =
    filledKeys.has("title") ||
    (filledKeys.has("year") && filledKeys.has("make")) ||
    (filledKeys.has("year") && filledKeys.has("model"));
  const hasDetails =
    filledKeys.has("price") || filledKeys.has("mileage") || filledKeys.has("description");
  const success = hasIdentity && hasDetails && filledKeys.size >= 3;

  return { success, newFills, filledKeys, filledCount: filledKeys.size };
}

async function getPendingVehicle() {
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const { pendingVehicle } = await chrome.storage.local.get("pendingVehicle");
    if (pendingVehicle) return pendingVehicle;
    await sleep(200);
  }
  return null;
}

async function main() {
  if (globalThis.__marketplaceListerActive) return;
  globalThis.__marketplaceListerActive = true;

  injectStyles();
  const pendingVehicle = await getPendingVehicle();
  if (!pendingVehicle) {
    injectBanner({ id: "", photos: [] }, "", "", "Marketplace Lister is active on this tab.");
    injectPhotoPanel([]);
    return;
  }

  const { crmBaseUrl = "", apiKey = "" } = await chrome.storage.sync.get(["crmBaseUrl", "apiKey"]);
  const banner = injectBanner(
    pendingVehicle,
    crmBaseUrl,
    apiKey,
    `Marketplace Lister — ${buildTitle(pendingVehicle)}. Click through FB steps; fields fill as they appear.`
  );
  injectPhotoPanel(pendingVehicle.photos);

  const filledKeys = new Set();
  let complete = false;

  const attemptFill = async () => {
    if (complete) return;
    const result = await tryFillForm(pendingVehicle, filledKeys);
    if (result.newFills > 0) {
      banner.setText(
        `Filled ${result.filledCount} field(s): ${[...result.filledKeys].join(", ")}. Keep clicking Next on Facebook if needed.`
      );
    }
    if (result.success) {
      complete = true;
      banner.setText(
        "✓ Form filled by Marketplace Lister — review details, attach photos, then publish"
      );
    }
  };

  const observer = new MutationObserver(() => {
    void attemptFill();
  });

  const intervalId = setInterval(() => {
    void attemptFill();
  }, 2000);

  const timeoutId = setTimeout(() => {
    observer.disconnect();
    clearInterval(intervalId);
    if (!complete) {
      banner.setText(
        `Filled ${filledKeys.size} field(s). Use Copy details + Vehicle Photos. Finish remaining FB steps manually, then Mark as Posted.`
      );
    }
  }, OBSERVER_TIMEOUT_MS);

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
    void attemptFill();
  }
}

main();
