# Feath marketing site

Static marketing site for **Feath**. Multi-page layout:

| Page | URL |
|------|-----|
| Home | `/` |
| Website | `/website/` |
| CRM | `/crm/` |
| Portfolio | `/portfolio/` |
| Book | `/contact/` |

Legacy URLs `/features/`, `/add-ons/`, and `/demo/` redirect to the matching section on `/crm/`.

**Rebrand:** edit [`src/site.config.ts`](src/site.config.ts) (`productName`, copy, features, portfolio, emails, demo URL).

## Local dev

```powershell
cd product-site
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

Optional overrides — copy [`.env.example`](.env.example) to `.env.local`:

```env
VITE_CONTACT_EMAIL=info@feath.ai
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
   - `VITE_CONTACT_EMAIL` — your sales inbox (default `info@feath.ai`)
   - `VITE_DEMO_URL` — playground CRM URL
   - `VITE_FORMSPREE_FORM_ID` — Formspree form id for the consultation booker on `/contact/`
8. Deploy → use `https://<project-name>.vercel.app`

## After deploy

1. Set your real contact email in `site.config.ts` or `VITE_CONTACT_EMAIL` on Vercel, then redeploy.
2. In [Formspree](https://formspree.io), set the form notification email (e.g. `info@feath.ai`) and add `VITE_FORMSPREE_FORM_ID` on Vercel.
3. Open the live demo link on the CRM page — should open your playground CRM URL.
4. On **Book**, submit a test consultation request — you should receive an email with name, preferred date/time, and notes.

## Related

- CRM app: repo root (`npm run build:crm`)
- Playground demo: [docs/PLAYGROUND.md](../docs/PLAYGROUND.md)
