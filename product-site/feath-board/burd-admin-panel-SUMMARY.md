# Burd Admin Panel — Plain English Summary

## What it is

An internal dashboard for the 3 of us to keep track of everything happening with Burd in one place — no more scattered notes, chat threads, or "wait, did we decide that?" moments.

## What's inside

Open the tool and you land on a **Projects** screen. Right now there's one project — **Burd** — click it to get to the actual tool. Think of this screen as the front door; if we ever build a second internal tool, it'll show up here as another card.

Inside Burd, there are 5 sections:

1. **Feature Board** — every feature the app has or might have, whether it's shipped, in progress, or just an idea. Click any feature to see who owns it and some technical notes about how risky/complex it is to build.

2. **Decision Log** — a running record of the big calls we've made and why. If someone asks "why did we choose X," the answer lives here instead of in someone's memory.

3. **Sprint** — a simple this-week board. Three columns: what's happening now, what's being reviewed, what's done. Nothing fancy, just enough to see who's working on what.

4. **Bugs** — anything broken gets logged here with how bad it is (P0 = drop everything, P2 = minor), who found it, and who's fixing it.

5. **Launch** — a checklist of everything that needs to happen before we go live, split into Tech / Legal / Marketing / Operations. Just checkboxes — check something off when it's done.

## A few nice extras

- **Dark mode** — there's a toggle in the top corner if you prefer a dark screen.
- Everything **links together** — a bug can point to the feature it affects, a sprint task can point to a feature, etc. — so you're never digging through multiple places to understand something.

## What it's NOT (yet)

Right now, this is a **file you open on your own computer** — it's not live on the website yet, and each of us has our own copy. That means if you add a bug on your computer, it won't automatically show up on someone else's. Daniel is going to hook it up to a real database and put it on burdapp.com so it works the same for all 3 of us, live, all the time.

## Why this exists

As we move faster and split up responsibilities (Daniel on engineering, MJ on product/ops, Sahand on design/growth)(these are just examples btw), it gets easy to lose track of what's actually happening. This tool is meant to solve that — one shared source of truth, without needing to pay for or learn some big enterprise software.
