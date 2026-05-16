# Supabase & env — beginner click-by-click

The AI in Cursor **cannot** open your Supabase or GitHub in a browser or paste keys for you. It **can** change files in this repo (that is what was “done for you” before). Anything that needs **your** password or **your** dashboard is always a manual step.

This page walks through the confusing parts in **maximum** detail. Do it twice if you have **two** projects (marketing + CRM)—same clicks, different project selected at the top.

---

## 1. Open the right project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. You see a list of **organizations** and **projects**.
3. Click the **project** you want (e.g. “marketing” or “CRM”).  
   You should land on **Project overview** / **Home** for that project.

---

## 2. Get the two values for `.env.local` (URL + anon key)

1. Look at the **left sidebar** (vertical menu).
2. Scroll to the bottom and click **Project Settings** (gear icon).  
   - If you do not see it: click your **project name** at the top of the sidebar, then choose **Settings** or **Project settings**.
3. In the **settings sub-menu** (still on the left), click **API** (sometimes under “Configuration”).
4. On the **API** page you will see:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`  
     → This whole string is `VITE_SUPABASE_URL`.
   - **Project API keys** — find the row named **`anon`** and **`public`** (not `service_role`).  
     → Click **Reveal** if hidden, then copy the long key. That is `VITE_SUPABASE_ANON_KEY`.

Never put the **service_role** key in a Vite app; it must stay server-side only.

---

## 3. Create `.env.local` on your computer (Windows / Cursor)

You are **not** pasting secrets into the AI chat. You put them in a file next to the app’s `package.json`.

### Marketing site (`site` folder)

1. In Cursor’s **Explorer** (left file tree), open the **`site`** folder.
2. **Right‑click** empty space in the folder list → **New File**.
3. Name the file exactly: **`.env.local`** (leading dot, no `.txt`).
4. Paste (replace with your real values from step 2):

   ```env
   VITE_SUPABASE_URL=https://YOUR-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=paste-the-anon-public-key-here
   VITE_SITE_MARKETING_ONLY=true
   ```

5. Save the file (**Ctrl+S**).

### CRM app (`auto-finance-manager` folder)

1. Open the **`auto-finance-manager`** folder in Explorer (the repo that has `sql/`).
2. New file **`.env.local`** next to **its** `package.json`.
3. Paste:

   ```env
   VITE_SUPABASE_URL=https://YOUR-CRM-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=paste-the-anon-public-key-here
   ```

   Use the **CRM** project’s URL and anon key from that project’s **Settings → API** (repeat step 2 while the CRM project is selected).

4. Save.

---

## 4. Run the SQL script (creates the pre-approval table + function)

Do this **on the marketing project** first (the one whose keys you put in **`site/.env.local`**).

1. Supabase left sidebar → **SQL Editor** (icon often looks like `>_` or “SQL”).
2. Click **New query** (or a blank query tab).
3. On your PC, open this file in Cursor:  
   **`sql/crm_public_preapproval_leads_marketing_project.sql`** (inside **auto-finance-manager**).
4. **Select all** in that file (**Ctrl+A**) → **Copy** (**Ctrl+C**).
5. Paste into the Supabase SQL Editor (**Ctrl+V**).
6. Click **Run** (or press **Ctrl+Enter**, depending on UI).
7. You should see **Success** with no red error. If you see an error, copy the **full** message and ask for help.

For the **CRM** project, use the main checklist file `docs/SETUP_CHECKLIST.md` for which extra scripts to run (`crm_security.sql`, etc.). Do **not** run the marketing-only script on the CRM project if you already use the full `crm_public_preapproval_leads.sql` there—follow the checklist.

---

## 5. Auth URL configuration (stops weird login / redirect issues)

Still in the **same** Supabase project (e.g. marketing):

1. Left sidebar → **Authentication**.
2. Find **URL configuration** (sometimes under Authentication → **Providers** is wrong; keep looking for “URL” or “Redirect”).
3. Set **Site URL** to your dev URL, e.g. `http://localhost:5173` (use the port Vite prints when you run `npm run dev`).
4. Add **Redirect URLs** — add the same URL, and add a wildcard if the UI allows, e.g. `http://localhost:5173/**`.
5. Save.

Repeat for the **CRM** project with the CRM dev URL (e.g. `http://localhost:5174`).

---

## 6. Run the app locally

**Marketing site**

```powershell
cd path\to\site
npm install
npm run dev
```

**CRM**

```powershell
cd path\to\auto-finance-manager
npm install
npm run dev
```

If you see **Configuration needed**, Supabase env vars are still missing or the file is not named `.env.local` in the correct folder.

---

## Again: what was “done for you” before?

| Done in repo (AI / commits) | Only you (browser / your machine) |
|----------------------------|-----------------------------------|
| React pages, Supabase client code, SQL **files** | Clicking Run in **your** Supabase SQL Editor |
| `.env.example` templates | Creating **`.env.local`** with real keys |
| Docs and checklists | Logging into **your** Supabase / host |
| | Typing **your** passwords |

If you tell me **one** stuck step (e.g. “I cannot find API” or “SQL errors”), paste **exact** wording from the screen and I will narrow that step further.
