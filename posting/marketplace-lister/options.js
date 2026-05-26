const form = document.getElementById("settings-form");
const crmBaseUrlInput = document.getElementById("crm-base-url");
const apiKeyInput = document.getElementById("api-key");
const confirmation = document.getElementById("confirmation");

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, "");
}

function showError(message) {
  let errorEl = document.getElementById("error-msg");
  if (!errorEl) {
    errorEl = document.createElement("p");
    errorEl.id = "error-msg";
    errorEl.className = "error-msg";
    form.insertBefore(errorEl, form.firstChild);
  }
  errorEl.textContent = message;
}

function clearError() {
  const errorEl = document.getElementById("error-msg");
  if (errorEl) {
    errorEl.remove();
  }
}

async function loadSettings() {
  const { crmBaseUrl = "", apiKey = "" } = await chrome.storage.sync.get([
    "crmBaseUrl",
    "apiKey"
  ]);
  crmBaseUrlInput.value = crmBaseUrl;
  apiKeyInput.value = apiKey;
}

async function requestHostPermission(baseUrl) {
  try {
    const origin = `${normalizeBaseUrl(baseUrl)}/*`;
    const hasPermission = await chrome.permissions.contains({ origins: [origin] });
    if (!hasPermission) {
      await chrome.permissions.request({ origins: [origin] });
    }
  } catch {
    // Permission denied or unavailable — user can retry from settings
  }
}

function showConfirmation() {
  confirmation.hidden = false;
  setTimeout(() => {
    confirmation.hidden = true;
  }, 2000);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  const crmBaseUrl = normalizeBaseUrl(crmBaseUrlInput.value.trim());
  const apiKey = apiKeyInput.value.trim();

  if (!crmBaseUrl.startsWith("https://")) {
    showError("CRM Base URL must start with https://");
    return;
  }

  if (!apiKey) {
    showError("API Key is required.");
    return;
  }

  await chrome.storage.sync.set({ crmBaseUrl, apiKey });
  await requestHostPermission(crmBaseUrl);
  showConfirmation();
});

document.addEventListener("DOMContentLoaded", loadSettings);
