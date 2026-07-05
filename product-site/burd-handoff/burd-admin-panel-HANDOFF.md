# Burd Admin Panel — Handoff to Daniel

##(read first)

- **Where it lives:** `burdapp.com/admin` if u can , live.
- **Auth:** a single shared login for all three of us (MJ, Sahand, Daniel). One account, identical full read/write access — no per-user identities or permissions.
- **Concurrency:** last-write-wins is the accepted behavior. No locking, no merge logic needed.
- **Storage mechanism:** still your call — pick whatever's fastest given the existing stack (see "What we're asking for" below).
- **Seed data:** the five data blocks are pre-extracted into `burd-seed-data.json` (included in this handoff) — import that rather than scraping the arrays out of the HTML. **One open item:** confirm which seed rows are real vs. demo placeholder before treating them as history — see "Suggested cutover plan" step 2.

## What this is

A single-file internal ops tool for tracking product/eng state across the team. Built as a static HTML prototype (`burd-feature-board.html`) so MJ and Sahand could use and edit it immediately without needing a backend. It's not user-facing — internal only, should sit behind whatever auth gate you use for other admin routes.

The app opens on a **Dashboard** ("Projects") screen. Right now there's one project card — **Burd** — which opens into the actual tool. This is intentionally structured so more internal tools/projects can be added as separate cards later without a rebuild.

Inside the Burd project, there are 5 tabs, all cross-referencing each other:

| Tab | Purpose |
|---|---|
| **Feature Board** | Every feature Burd has/will have — status, owner, technical profile (cost/speed/complexity ratings), and a feature-flag profile (storage type, kill switch severity, rollout type) |
| **Decision Log** | Record of major tech/product/business decisions — context, options considered, rationale, consequences |
| **Sprint** | Lightweight weekly kanban (This week / In review / Done) with sub-tasks, blocking, and owner tags |
| **Bugs** | P0/P1/P2 severity-based bug tracker with repro steps and status (Open → In Progress → Fixed → Verified) |
| **Launch** | Launch readiness checklist grouped by Tech/Legal/Marketing/Ops, checkbox-only, no due dates |

Every tab can optionally link back to a feature on the Feature Board by ID (`linkedFeatureId`), which is how the tabs stay connected.

Also included:
- **Light/dark mode toggle** (top right of header) — persists per-browser via `localStorage`, applied before first paint to avoid a flash of the wrong theme
- **Custom confirm modal** for all delete actions — deliberately *not* using the native browser `confirm()`, since that dialog can be silently blocked in some in-app/webview browsers
- **Burd logo mark** (inline SVG, not an image file) used in the header and on the Dashboard project card
- **Session audit log** — a floating "🕓 Audit log" button (bottom-right) opens a slide-in panel listing every change made during the current session (create / edit / delete across all 5 tabs, plus sprint-card moves, launch checkbox toggles, and subtask checks), grouped by day with timestamps. No "who" — single shared login, so it's actions only. See the port note below on making this persist.

## Current state — read this first

**Everything is in-memory.** All data lives in plain JS arrays (`features`, `decisions`, `sprintTasks`, `bugs`, `launchItems`) defined directly in the `<script>` tag. There is no backend, no API, no database. Refreshing the page resets everything to the seeded defaults. It currently works because each of us has a local copy and edits the file by hand when something changes — that doesn't scale past this prototype stage.

**This is the one thing you need to decide before wiring it into burdapp.com**: where does the data live?

## What we're asking for

MJ's preference: **simplest thing that works — a JSON file or lightweight DB you already control**, not a new service. No strong opinion beyond, If Supabase/Postgres is already part of the stack and adding 5 tables is trivial, that's fine too — your call on what's fastest for you specifically.

Suggested approach if starting from scratch:

1. **Storage**: A single JSON file (or SQLite/lowdb) with 5 top-level keys — `features`, `decisions`, `sprintTasks`, `bugs`, `launchItems`. Matches the current in-memory shape almost exactly, so porting the data model is close to copy-paste.
2. **API**: 5 pairs of endpoints — `GET/POST /api/admin/{features,decisions,sprint,bugs,launch}`. POST just overwrites the relevant array (or does simple CRUD if you'd rather). No need for anything fancier — this is a 3-person internal tool, not a public API.
3. **Auth**: Gate the whole `/admin` route behind whatever simplest auth check you already have for internal tooling. **Decided:** a single shared login for all three of us — one account, identical full read/write, no per-user identities. (Attribution is handled manually inside the tool via the `owner`/`foundBy` fields, so a shared login loses nothing.)
4. **Frontend**: The existing HTML/CSS/JS can mostly be dropped in as-is. The only real change needed is replacing the hardcoded array declarations with a `fetch()` call on page load, and adding a `fetch()` POST call inside each `save*()` function (currently they just mutate the array and re-render — you'd add a network call there).
5. **Theme preference**: currently stored client-side in `localStorage` under the key `burd-theme`. Fine as-is for a personal preference — if you want it to follow a user across devices later, move it into whatever user-settings storage you're already using. Low priority.

## Data shapes (copy-paste reference)

> The actual seed data is in **`burd-seed-data.json`** — a single file with the five arrays under keys `features`, `decisions`, `sprintTasks`, `bugs`, `launchItems`. Import that directly. The field reference below is just for quick lookup.

Each item's exact fields, pulled directly from the current file:

**Feature** (`features[]`)
```js
{
  id, title, group, status, owners: [], desc, flag: bool,
  cost, requestSpeed, implComplexity, cacheUse, updateSpeed, flexibility, // 1-5 ratings
  storage, killSwitch, rollout, lifespan, flagNotes // feature-flag profile
}
```

**Decision** (`decisions[]`)
```js
{ id, title, cat, owner, date, context, options, rationale, consequences, linkedFeatureId }
```

**Sprint task** (`sprintTasks[]`)
```js
{ id, title, notes, owner, status, linkedFeatureId, blocked: bool, blockedReason, subtasks: [{id, text, done}] }
```

**Bug** (`bugs[]`)
```js
{ id, title, severity, status, foundBy, owner, date, steps, expected, linkedFeatureId, fixNotes }
```

**Launch item** (`launchItems[]`)
```js
{ id, category, title, owner, done: bool, notes }
```

`status`, `severity`, `category` etc. are all fixed string enums — see the `*_LABELS` constants near the top of the `<script>` block in the HTML file for the exact allowed values per field.

## Navigation structure (for the port)

- `panel-dashboard` — landing view, shown by default
- `panel-features`, `panel-decisions`, `panel-sprint`, `panel-bugs`, `panel-launch` — the 5 tool tabs, hidden until you click into the Burd project card
- `goToDashboard()` — returns to the project list (bound to clicking the logo)
- `openProject('burd')` — enters the Burd tool and lands on the Feature Board tab
- `switchTab(tabName)` — switches between the 5 tabs once inside the project

If you add a second project later, the pattern to follow is: add a new Dashboard card calling `openProject('yourProjectId')`, and branch that function to show whatever panel(s) belong to that project instead of hardcoding it to Burd.

## Suggested cutover plan

1. Stand up the 5 endpoints (or one combined `/api/admin/state` endpoint returning all 5 arrays if that's less work for you).
2. Seed the DB/JSON from **`burd-seed-data.json`** (already extracted from the HTML for you — no need to scrape the arrays out by hand). **Open item before you treat this as real history:** some rows are real (e.g. the tech-stack decisions, the feature list) and some are realistic-looking placeholder generated to make the tool demoable (some bug reports, some sprint tasks). MJ to confirm what's real — ideally by editing `burd-seed-data.json` to delete the placeholder rows before you import it.
3. Swap the hardcoded `let features = [...]` etc. for a `fetch()` on load.
4. Wire each `save*()` / `delete*()` function to also POST the updated array.
5. Add basic auth to the route.
6. Ship it under `burdapp.com/admin`.

## Technical notes for the port (from a read of the file)

Two spots that don't survive the port as-is:

1. **ID generation** — the app assigns IDs with an in-memory `nextId++` counter. This needs to become the database's job (auto-increment or UUID) on the port. Worth calling out specifically because we've accepted last-write-wins: two people creating items around the same time could otherwise be handed the same ID.
2. **`exportUpdatedFile()`** — the "save updated file" button bakes the in-memory data back into a downloadable copy of the HTML. It was mjs workaround for having no backend and becomes dead code once storage is real. Safe to delete.
3. **Audit log persistence** — the session audit log lives in an in-memory `auditLog` array (search `let auditLog`), populated by `logAudit(verb, entity, label)` calls inside each `save*()`/`delete*()`/toggle/move function. It's intentionally session-only (clears on refresh), matching the rest of the prototype. If you want change history that persists across sessions, the entries are already the right shape to POST to a `audit_log` table/collection — append-only, no updates. Optional; only do it if we actually want durable history.

Everything else ports cleanly: every entity follows the same `save* → mutate array → render*` pattern, so adding a `fetch()` on load and a POST inside each `save*()`/`delete*()` is repetitive but mechanical.

## Not needed / explicitly out of scope atm (too much time unless u want to tackle it)

- Real-time sync between simultaneous editors (last-write-wins is fine for 3 people)
- User-specific permissions (all 3 of us should have full read/write)
- Launch readiness "blocking" logic — Launch tab is just tracking, not gating anything
- Due dates on launch checklist items — intentionally left out to keep it simple
- Multi-project support beyond Burd — the Dashboard structure allows for it, but only build it if/when we actually add a second project

## File

`burd-feature-board.html` — the whole thing, ~5,100 lines, no external dependencies. Everything (HTML/CSS/JS) is in one file so you can read it top to bottom without hunting across a project structure. The seed data has already been pulled out into `burd-seed-data.json` for you; if you do want to find the blocks in the HTML itself, search for `let features =`, `let decisions =`, `let sprintTasks =`, `let bugs =`, `let launchItems =`.
