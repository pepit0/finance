# Marketplace Lister

A Chrome extension (Manifest V3) that lets your team browse vehicle inventory from your CRM and post listings to Facebook Marketplace with one click. The extension auto-fills the Facebook listing form — you review, attach photos manually, and publish.

## Load the extension in Chrome

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `marketplace-lister/` folder from this repository.
5. The extension icon appears in your toolbar. On first install, the settings page opens automatically.

## Configure settings

1. Open the extension settings (click the extension icon → **Open Settings**, or right-click the icon → **Options**).
2. Enter your **CRM Base URL** — for Temptation Motorsports this is your **website**, not the finance CRM: `https://temptmotorsports.com` (no trailing slash).
3. Enter your **API Key** — the same secret as `EXTENSION_API_KEY` on your **site** Vercel project (see `posting/SITE_API_SETUP.md` in the finance repo).
4. Click **Save**. Chrome may prompt you to grant host permission for your CRM domain — accept this so the extension can fetch inventory.
5. A brief "Settings saved!" confirmation appears.

Settings are stored in `chrome.storage.sync` and sync across Chrome profiles signed into the same Google account.

## Posting flow

1. Click the **Marketplace Lister** extension icon to open the popup.
2. The popup fetches your CRM inventory and displays vehicle cards with photo, year/make/model, price, mileage, and VIN.
3. Vehicles already posted to Facebook show a green **Listed on FB** badge with the posted date — no Post button.
4. For unlisted vehicles, click **Post to Marketplace**.
5. The extension saves the vehicle data and opens `https://www.facebook.com/marketplace/create/vehicle` in a new tab.
6. On the Facebook page, the extension auto-fills title, price, mileage, description, and condition (Good).
7. A banner appears at the top: "Form filled by Marketplace Lister — review details, attach photos, then publish."
8. Use the **Vehicle Photos** panel below the banner to open photo links in new tabs. Save each image and attach it to the Facebook listing manually.
9. Review all fields, attach photos, and publish the listing on Facebook.
10. Click **Mark as Posted** in the banner to update the CRM. The vehicle will show as listed the next time you open the popup.

## API contract (website / Vercel)

The extension expects your **marketing site** (e.g. temptmotorsports.com) to expose two endpoints backed by Supabase `inventory_units`. All requests include the header:

```
x-api-key: <your-api-key>
```

### GET `/api/extension/inventory`

Returns a JSON array of vehicle objects:

```json
[
  {
    "id": "abc-123",
    "year": 2019,
    "make": "Jeep",
    "model": "Cherokee",
    "price": 18999,
    "mileage": 45000,
    "vin": "1C4PJLLB2KD123456",
    "photos": [
      "https://example.com/photos/vehicle-1.jpg",
      "https://example.com/photos/vehicle-2.jpg"
    ],
    "posted_to_marketplace": false,
    "marketplace_listed_at": null
  }
]
```

When a vehicle has been posted, set `posted_to_marketplace` to `true` and `marketplace_listed_at` to an ISO 8601 date string.

### PATCH `/api/extension/inventory/:id/marketplace-status`

Request body:

```json
{
  "posted": true,
  "listedAt": "2026-05-26T14:30:00.000Z"
}
```

Your CRM should update the vehicle record in Supabase: set `posted_to_marketplace = true` and store the `listedAt` timestamp.

## Facebook form selectors

Facebook's Marketplace create form is built with React and its DOM structure changes frequently. Field targeting lives in **`content.js`** at the top of the file in the `FIELD_SELECTORS` object:

```js
const FIELD_SELECTORS = {
  title: { ariaLabels: [...], placeholders: [...], names: [...] },
  price: { ... },
  mileage: { ... },
  description: { ... },
  condition: { ... }
};
```

If auto-fill stops working after a Facebook UI update:

1. Open `https://www.facebook.com/marketplace/create/vehicle` in Chrome.
2. Right-click a form field → **Inspect** and note its `aria-label`, `placeholder`, or `name` attribute.
3. Update the corresponding hints in `FIELD_SELECTORS` in `content.js`.
4. Reload the extension at `chrome://extensions` (click the refresh icon on the extension card).

The extension uses a `MutationObserver` with a 15-second timeout to wait for fields to appear. It fills fields using React-compatible input events (native value setter + `InputEvent`), not plain DOM assignment.

## Limitations

- **No auto photo upload** — Chrome extensions cannot programmatically upload files to Facebook. Use the photo links panel to open and save images, then attach them manually.
- **Facebook UI changes** — Form selectors may need periodic updates (see above).
- **Manual publish** — The extension fills the form but does not click Publish. You must review and submit the listing yourself.

## File structure

```
marketplace-lister/
├── manifest.json      # Extension manifest (MV3)
├── background.js      # Opens settings on install
├── content.js         # Auto-fills Facebook form + banner UI
├── options.html/js/css  # Settings page
├── popup.html/js/css    # Inventory browser popup
└── README.md
```

## Permissions

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access the active tab when triggered by user gesture |
| `storage` | Save settings and pending vehicle data |
| `scripting` | Inject content scripts on Facebook |
| `https://www.facebook.com/*` | Run content script on Marketplace create pages |
| `https://*/*` (optional, requested at settings save) | Fetch inventory from your CRM domain |
