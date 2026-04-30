# Car Finance Dashboard

Vite + React app for lender guidelines, calculators, and feedback.

## Local development

1. Copy [`.env.example`](.env.example) to `.env.local` (or edit the existing `.env.local`).
2. Set:
   - **`VITE_SUPABASE_URL`**
   - **`VITE_SUPABASE_ANON_KEY`**
   from Supabase project **Settings → API**.
3. Install and run:

```bash
npm install
npm run dev
```

Without Supabase env vars, the app throws on startup with a clear error.

Optional: set **`VITE_LENDERS_CSV_URL`** to override the default published lender CSV URL (see `src/App.tsx`).

## Authentication (Supabase)

Access is gated for **signed-in users only** through a custom email/password form in-app.

### One-time Supabase setup

1. In Supabase, open **Authentication → Providers → Email** and enable email/password sign-ins.
2. Disable public signup by turning off **Enable email confirmations / self-signup** based on your workspace policy.
3. Create internal users from **Authentication → Users → Add user** (or invite users).
4. Copy API values from **Settings → API** into `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Deploying on Vercel

In the Vercel project → **Settings → Environment Variables**, add:

- **`VITE_SUPABASE_URL`**
- **`VITE_SUPABASE_ANON_KEY`**

Redeploy after changing env vars so the Vite build picks them up.

## Scripts

| Command           | Description        |
| ----------------- | ------------------ |
| `npm run dev`     | Dev server         |
| `npm run build`   | Production build   |
| `npm run preview` | Preview production |
| `npm run typecheck` | TypeScript check |
| `npm test`        | Vitest             |
