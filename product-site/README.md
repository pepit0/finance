# Tempt CRM marketing site

Static marketing site for Tempt CRM. Multi-page layout:

| Page | URL |
|------|-----|
| Home | `/` |
| Features | `/features/` |
| Add-ons | `/add-ons/` |
| Pricing | `/pricing/` |
| Demo | `/demo/` |
| Contact | `/contact/` |

**Rebrand:** edit [`src/site.config.ts`](src/site.config.ts) (`productName`, copy, features, add-ons, emails, demo URL).

## Local dev

```powershell
cd product-site
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Optional overrides — copy [`.env.example`](.env.example) to `.env.local`:

```env
VITE_CONTACT_EMAIL=you@example.com
VITE_DEMO_URL=https://demo.sharifian.cfd/crm
VITE_FORMSPREE_FORM_ID=your_form_id
```

`VITE_FORMSPREE_FORM_ID` is the id from your Formspree endpoint (`https://formspree.io/f/xyz` → use `xyz`, or paste the full URL).

## Build

```powershell
npm run build
npm run preview
```

Output: `dist/`

## Deploy on Vercel

1. Push this repo to GitHub.
2. Vercel → **Add New Project** → import the repo.
3. **Root Directory:** `product-site`
4. Framework: **Vite** (auto-detected)
5. **Build command:** `npm run build`
6. **Output directory:** `dist`
7. Environment variables (optional):
   - `VITE_CONTACT_EMAIL` — your sales inbox (shown on the site; Formspree sends to the email you set in the Formspree dashboard)
   - `VITE_DEMO_URL` — playground CRM URL
   - `VITE_FORMSPREE_FORM_ID` — Formspree form id for the contact booker on `/contact/`
8. Deploy → use `https://<project-name>.vercel.app`

No custom domain required for v1.

## After deploy

1. Set your real contact email in `site.config.ts` or `VITE_CONTACT_EMAIL` on Vercel, then redeploy.
2. In [Formspree](https://formspree.io), set the form notification email (e.g. `info@tempt.com`) and add `VITE_FORMSPREE_FORM_ID` on Vercel.
3. Click **View live demo** — should open `demo.sharifian.cfd/crm` (playground sample data).
4. On **Contact**, submit a test walkthrough request — you should receive an email with name, preferred date/time, and notes.

## Related

- CRM app: repo root (`npm run build:crm`)
- Playground demo: [docs/PLAYGROUND.md](../docs/PLAYGROUND.md)
- Licensing / tenant provisioning: [docs/PROVISIONING.md](../docs/PROVISIONING.md)
