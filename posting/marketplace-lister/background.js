const FB_CREATE_URL = "https://www.facebook.com/marketplace/create/vehicle";
const FB_CREATE_PATTERN = /^https:\/\/(www\.)?facebook\.com\/marketplace\/create/;

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.runtime.openOptionsPage();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "OPEN_MARKETPLACE") {
    (async () => {
      await chrome.storage.local.set({ pendingVehicle: message.vehicle });
      await chrome.tabs.create({ url: FB_CREATE_URL });
      sendResponse({ ok: true });
    })();
    return true;
  }
  return false;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") {
    return;
  }
  if (!tab.url || !FB_CREATE_PATTERN.test(tab.url)) {
    return;
  }

  (async () => {
    const { pendingVehicle } = await chrome.storage.local.get("pendingVehicle");
    if (!pendingVehicle) {
      return;
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"]
      });
    } catch (err) {
      console.error("[Marketplace Lister] Failed to inject content script:", err);
    }
  })();
});
