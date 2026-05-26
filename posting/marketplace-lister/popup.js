const loadingEl = document.getElementById("loading");
const unconfiguredEl = document.getElementById("unconfigured");
const errorEl = document.getElementById("error");
const errorMessageEl = document.getElementById("error-message");
const inventoryEl = document.getElementById("inventory");
const openSettingsBtn = document.getElementById("open-settings");
const retryBtn = document.getElementById("retry");

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

function showState(state) {
  loadingEl.hidden = state !== "loading";
  unconfiguredEl.hidden = state !== "unconfigured";
  errorEl.hidden = state !== "error";
  inventoryEl.hidden = state !== "inventory";
}

function formatListedDate(isoDate) {
  if (!isoDate) return "";
  try {
    return new Date(isoDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return isoDate;
  }
}

function buildVehicleTitle(vehicle) {
  return [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");
}

function createThumbnail(vehicle) {
  const photoUrl = Array.isArray(vehicle.photos) ? vehicle.photos[0] : null;
  if (!photoUrl) {
    const placeholder = document.createElement("div");
    placeholder.className = "vehicle-thumb-placeholder";
    placeholder.textContent = "No photo";
    return placeholder;
  }

  const img = document.createElement("img");
  img.className = "vehicle-thumb";
  img.alt = buildVehicleTitle(vehicle);
  img.src = photoUrl;
  img.addEventListener("error", () => {
    const placeholder = document.createElement("div");
    placeholder.className = "vehicle-thumb-placeholder";
    placeholder.textContent = "No photo";
    img.replaceWith(placeholder);
  });
  return img;
}

function createVehicleCard(vehicle) {
  const card = document.createElement("div");
  card.className = "vehicle-card";

  card.appendChild(createThumbnail(vehicle));

  const info = document.createElement("div");
  info.className = "vehicle-info";

  const title = document.createElement("h2");
  title.className = "vehicle-title";
  title.textContent = buildVehicleTitle(vehicle);
  info.appendChild(title);

  const price = document.createElement("p");
  price.className = "vehicle-price";
  price.textContent = money.format(Number(vehicle.price) || 0);
  info.appendChild(price);

  const mileage = document.createElement("p");
  mileage.className = "vehicle-mileage";
  mileage.textContent = `${Number(vehicle.mileage || 0).toLocaleString()} mi`;
  info.appendChild(mileage);

  if (vehicle.vin) {
    const vin = document.createElement("p");
    vin.className = "vehicle-vin";
    vin.textContent = vehicle.vin;
    info.appendChild(vin);
  }

  const actions = document.createElement("div");
  actions.className = "card-actions";

  if (vehicle.posted_to_marketplace) {
    const badge = document.createElement("span");
    badge.className = "badge-listed";
    badge.textContent = "Listed on FB";
    actions.appendChild(badge);

    const listedDate = vehicle.marketplace_listed_at;
    if (listedDate) {
      const dateEl = document.createElement("span");
      dateEl.className = "listed-date";
      dateEl.textContent = formatListedDate(listedDate);
      actions.appendChild(dateEl);
    }
  } else {
    const postBtn = document.createElement("button");
    postBtn.type = "button";
    postBtn.className = "btn-primary";
    postBtn.textContent = "Post to Marketplace";
    postBtn.addEventListener("click", async () => {
      await chrome.storage.local.set({ pendingVehicle: vehicle });
      await chrome.tabs.create({
        url: "https://www.facebook.com/marketplace/create/vehicle"
      });
      window.close();
    });
    actions.appendChild(postBtn);
  }

  info.appendChild(actions);
  card.appendChild(info);
  return card;
}

function renderInventory(vehicles) {
  inventoryEl.innerHTML = "";

  if (!vehicles.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No vehicles in inventory.";
    inventoryEl.appendChild(empty);
  } else {
    for (const vehicle of vehicles) {
      inventoryEl.appendChild(createVehicleCard(vehicle));
    }
  }

  showState("inventory");
}

async function fetchInventory(crmBaseUrl, apiKey) {
  const base = crmBaseUrl.replace(/\/+$/, "");
  const response = await fetch(`${base}/api/extension/inventory`, {
    headers: {
      "x-api-key": apiKey,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Server returned ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.vehicles ?? [];
}

async function loadInventory() {
  showState("loading");

  const { crmBaseUrl = "", apiKey = "" } = await chrome.storage.sync.get([
    "crmBaseUrl",
    "apiKey"
  ]);

  if (!crmBaseUrl || !apiKey) {
    showState("unconfigured");
    return;
  }

  try {
    const vehicles = await fetchInventory(crmBaseUrl, apiKey);
    renderInventory(vehicles);
  } catch (err) {
    errorMessageEl.textContent =
      err instanceof Error ? err.message : "Unable to load inventory.";
    showState("error");
  }
}

openSettingsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

retryBtn.addEventListener("click", loadInventory);

document.addEventListener("DOMContentLoaded", loadInventory);
