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
```

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
   - `VITE_CONTACT_EMAIL` — your sales inbox
   - `VITE_DEMO_URL` — playground CRM URL
8. Deploy → use `https://<project-name>.vercel.app`

No custom domain required for v1.

## After deploy

1. Set your real contact email in `site.config.ts` or `VITE_CONTACT_EMAIL` on Vercel, then redeploy.
2. Click **View live demo** — should open `demo.sharifian.cfd/crm` (playground sample data).
3. Click **Contact** — should open your mail client.

## Related

- CRM app: repo root (`npm run build:crm`)
- Playground demo: [docs/PLAYGROUND.md](../docs/PLAYGROUND.md)
- Licensing / tenant provisioning: [docs/PROVISIONING.md](../docs/PROVISIONING.md)
