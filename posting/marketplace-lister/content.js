/**
 * Facebook Marketplace form field selectors.
 * Update these if Facebook changes their UI.
 * Only use aria-label, placeholder, and name attributes — never class names or IDs.
 */
const FIELD_SELECTORS = {
  title: {
    ariaLabels: ["title", "listing title"],
    placeholders: ["title"],
    names: ["title"]
  },
  year: {
    ariaLabels: ["year"],
    placeholders: ["year"],
    names: ["year"]
  },
  make: {
    ariaLabels: ["make", "manufacturer"],
    placeholders: ["make"],
    names: ["make"]
  },
  model: {
    ariaLabels: ["model"],
    placeholders: ["model"],
    names: ["model"]
  },
  price: {
    ariaLabels: ["price"],
    placeholders: ["price"],
    names: ["price"]
  },
  mileage: {
    ariaLabels: ["mileage", "odometer"],
    placeholders: ["mileage", "odometer"],
    names: ["mileage", "odometer"]
  },
  description: {
    ariaLabels: ["description"],
    placeholders: ["description", "describe"],
    names: ["description"]
  },
  condition: {
    ariaLabels: ["condition"],
    placeholders: ["condition"],
    names: ["condition"]
  }
};

const OBSERVER_TIMEOUT_MS = 60000;
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

function reactSetValue(el, value) {
  el.focus();
  const setter =
    el instanceof HTMLTextAreaElement ? nativeTextareaValueSetter : nativeInputValueSetter;
  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }
  el.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: String(value)
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

function findInputByHints(hints) {
  const inputs = document.querySelectorAll("input, textarea");
  for (const input of inputs) {
    const ariaLabel = input.getAttribute("aria-label") || "";
    const placeholder = input.getAttribute("placeholder") || "";
    const name = input.getAttribute("name") || "";
    if (
      matchesHint(ariaLabel, hints.ariaLabels) ||
      matchesHint(placeholder, hints.placeholders) ||
      matchesHint(name, hints.names)
    ) {
      return input;
    }
  }

  const labelled = document.querySelectorAll("[aria-label]");
  for (const el of labelled) {
    const ariaLabel = el.getAttribute("aria-label") || "";
    if (matchesHint(ariaLabel, hints.ariaLabels)) {
      const nested = el.querySelector("input, textarea");
      if (nested) return nested;
    }
  }

  return null;
}

function findConditionControl(hints) {
  const selects = document.querySelectorAll("select");
  for (const select of selects) {
    const ariaLabel = select.getAttribute("aria-label") || "";
    const name = select.getAttribute("name") || "";
    if (matchesHint(ariaLabel, hints.ariaLabels) || matchesHint(name, hints.names)) {
      return select;
    }
  }

  const comboboxes = document.querySelectorAll('[role="combobox"], [role="listbox"]');
  for (const box of comboboxes) {
    const ariaLabel = box.getAttribute("aria-label") || "";
    if (matchesHint(ariaLabel, hints.ariaLabels)) {
      return box;
    }
  }

  return null;
}

function setConditionGood(control) {
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
    requestAnimationFrame(() => {
      const options = document.querySelectorAll('[role="option"]');
      for (const option of options) {
        if (option.textContent.trim().toLowerCase() === "good") {
          option.click();
          break;
        }
      }
    });
    return true;
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
      justify-content: space-between;
      gap: 16px;
      padding: 12px 20px;
      background: #1e1e2e;
      color: #ffffff;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    #${BANNER_ID} .ml-banner-text { flex: 1; line-height: 1.4; }
    #${BANNER_ID} .ml-banner-btn {
      padding: 8px 16px;
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
    #${BANNER_ID} .ml-banner-btn:disabled {
      background: #475569;
      cursor: default;
    }
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
    #${PHOTO_PANEL_ID} .ml-panel-header:hover { background: #f8fafc; }
    #${PHOTO_PANEL_ID} .ml-panel-toggle { font-size: 12px; color: #64748b; }
    #${PHOTO_PANEL_ID} .ml-panel-body {
      padding: 0 20px 12px;
      display: none;
    }
    #${PHOTO_PANEL_ID}.ml-expanded .ml-panel-body { display: block; }
    #${PHOTO_PANEL_ID} .ml-photo-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    #${PHOTO_PANEL_ID} .ml-photo-list li { margin-bottom: 6px; }
    #${PHOTO_PANEL_ID} .ml-photo-list a {
      color: #2563eb;
      font-size: 13px;
      text-decoration: none;
    }
    #${PHOTO_PANEL_ID} .ml-photo-list a:hover { text-decoration: underline; }
    #${PHOTO_PANEL_ID} .ml-photo-note {
      margin: 8px 0 0;
      font-size: 12px;
      color: #64748b;
      line-height: 1.4;
    }
  `;
  document.head.appendChild(style);
}

function injectPhotoPanel(photos) {
  if (document.getElementById(PHOTO_PANEL_ID)) return;

  const panel = document.createElement("div");
  panel.id = PHOTO_PANEL_ID;

  const header = document.createElement("div");
  header.className = "ml-panel-header";

  const title = document.createElement("span");
  title.textContent = "Vehicle Photos";
  header.appendChild(title);

  const toggle = document.createElement("span");
  toggle.className = "ml-panel-toggle";
  toggle.textContent = "Show";
  header.appendChild(toggle);

  header.addEventListener("click", () => {
    panel.classList.toggle("ml-expanded");
    toggle.textContent = panel.classList.contains("ml-expanded") ? "Hide" : "Show";
  });

  const body = document.createElement("div");
  body.className = "ml-panel-body";

  const list = document.createElement("ul");
  list.className = "ml-photo-list";

  const photoUrls = Array.isArray(photos) ? photos : [];
  if (photoUrls.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No photos available.";
    list.appendChild(item);
  } else {
    photoUrls.forEach((url, index) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `Photo ${index + 1}`;
      item.appendChild(link);
      list.appendChild(item);
    });
  }

  const note = document.createElement("p");
  note.className = "ml-photo-note";
  note.textContent =
    "Chrome extensions cannot auto-upload photos — open each link and save the image, then attach to the listing.";

  body.appendChild(list);
  body.appendChild(note);
  panel.appendChild(header);
  panel.appendChild(body);
  document.body.prepend(panel);
}

function injectBanner(vehicle, crmBaseUrl, apiKey, initialText) {
  let textEl;

  if (document.getElementById(BANNER_ID)) {
    textEl = document.querySelector(`#${BANNER_ID} .ml-banner-text`);
    if (textEl && initialText) {
      textEl.textContent = initialText;
    }
    return { setText: (msg) => { if (textEl) textEl.textContent = msg; } };
  }

  const banner = document.createElement("div");
  banner.id = BANNER_ID;

  textEl = document.createElement("span");
  textEl.className = "ml-banner-text";
  textEl.textContent =
    initialText ||
    "Marketplace Lister — waiting for Facebook form fields… (navigate through any setup steps)";
  banner.appendChild(textEl);

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
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey
            },
            body: JSON.stringify({
              posted: true,
              listedAt: new Date().toISOString()
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        await chrome.storage.local.remove("pendingVehicle");
        textEl.textContent = "✓ Marked as posted in CRM";
        btn.remove();
      } catch (err) {
        btn.disabled = false;
        btn.textContent = "Mark as Posted";
        textEl.textContent = `Failed to update CRM: ${err instanceof Error ? err.message : "Unknown error"}. Try again.`;
      }
    });

    banner.appendChild(btn);
  }

  document.body.prepend(banner);

  return { setText: (msg) => { textEl.textContent = msg; } };
}

function tryFillForm(vehicle) {
  const titleEl = findInputByHints(FIELD_SELECTORS.title);
  const yearEl = findInputByHints(FIELD_SELECTORS.year);
  const makeEl = findInputByHints(FIELD_SELECTORS.make);
  const modelEl = findInputByHints(FIELD_SELECTORS.model);
  const priceEl = findInputByHints(FIELD_SELECTORS.price);
  const mileageEl = findInputByHints(FIELD_SELECTORS.mileage);
  const descriptionEl = findInputByHints(FIELD_SELECTORS.description);
  const conditionEl = findConditionControl(FIELD_SELECTORS.condition);

  let filledCount = 0;

  if (titleEl) {
    reactSetValue(titleEl, buildTitle(vehicle));
    filledCount += 1;
  } else {
    if (yearEl && vehicle.year) {
      reactSetValue(yearEl, String(vehicle.year));
      filledCount += 1;
    }
    if (makeEl && vehicle.make) {
      reactSetValue(makeEl, vehicle.make);
      filledCount += 1;
    }
    if (modelEl && vehicle.model) {
      reactSetValue(modelEl, vehicle.model);
      filledCount += 1;
    }
  }

  if (priceEl) {
    reactSetValue(priceEl, String(Number(vehicle.price) || 0));
    filledCount += 1;
  }
  if (mileageEl) {
    reactSetValue(mileageEl, String(Number(vehicle.mileage) || 0));
    filledCount += 1;
  }
  if (descriptionEl) {
    reactSetValue(descriptionEl, buildDescription(vehicle));
    filledCount += 1;
  }
  if (conditionEl) {
    setConditionGood(conditionEl);
    filledCount += 1;
  }

  const hasIdentity = titleEl || (yearEl && makeEl) || (yearEl && modelEl);
  const success = filledCount >= 2 && hasIdentity && (priceEl || descriptionEl);

  return { success, filledCount };
}

async function getPendingVehicle() {
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const { pendingVehicle } = await chrome.storage.local.get("pendingVehicle");
    if (pendingVehicle) {
      return pendingVehicle;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return null;
}

async function main() {
  if (globalThis.__marketplaceListerActive) {
    return;
  }
  globalThis.__marketplaceListerActive = true;

  injectStyles();

  const pendingVehicle = await getPendingVehicle();
  if (!pendingVehicle) {
    injectBanner(
      { id: "", photos: [] },
      "",
      "",
      "Marketplace Lister is active — open the extension popup and click Post to Marketplace for this tab."
    );
    injectPhotoPanel([]);
    console.warn("[Marketplace Lister] No pendingVehicle in storage.");
    return;
  }

  const { crmBaseUrl = "", apiKey = "" } = await chrome.storage.sync.get([
    "crmBaseUrl",
    "apiKey"
  ]);

  injectStyles();
  const banner = injectBanner(
    pendingVehicle,
    crmBaseUrl,
    apiKey,
    `Marketplace Lister — loading ${buildTitle(pendingVehicle)}…`
  );
  injectPhotoPanel(pendingVehicle.photos);

  let filled = false;

  const attemptFill = () => {
    if (filled) return;
    const result = tryFillForm(pendingVehicle);
    if (result.success) {
      filled = true;
      banner.setText(
        "✓ Form filled by Marketplace Lister — review details, attach photos, then publish"
      );
      console.info("[Marketplace Lister] Filled", result.filledCount, "fields.");
    }
  };

  const observer = new MutationObserver(() => {
    attemptFill();
  });

  const timeoutId = setTimeout(() => {
    observer.disconnect();
    if (!filled) {
      banner.setText(
        "Marketplace Lister — could not auto-fill all fields. Click through Facebook's steps, or fill manually. Use Vehicle Photos below."
      );
      console.warn("[Marketplace Lister] Timed out waiting for Facebook form fields.");
    }
  }, OBSERVER_TIMEOUT_MS);

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
    attemptFill();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      observer.observe(document.body, { childList: true, subtree: true });
      attemptFill();
    });
  }
}

main();
