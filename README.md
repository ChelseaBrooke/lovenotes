# lovenotes

A private, two-person shared corkboard for the poems, quotes, screenshots, TikToks, and homemade videos you and your partner make and find for each other. Built with **Expo (React Native)** + **Supabase**, following [`docs/PRD.md`](docs/PRD.md).

Capture should disappear; viewing should make you feel something.

## What's built (Milestones M0 + M1 — the provable core)

- **No sign-in** — each device silently gets an anonymous identity on first launch (no email, no password). You just enter a name, create a space, and share a 6-character invite code; your partner joins (max two members enforced server-side).
- **Board** — two-column masonry of mixed cards, newest first, warm paper ground, search, paired-avatar cluster, empty state, pull-to-refresh.
- **Card souls** — poem, quote (blush), image/screenshot, own-video, and link/TikTok cards each get their own treatment (PRD §8.4).
- **Card detail** — content given room to breathe, heart reactions, replies — all syncing in real time.
- **Type-blind add** — one entry that auto-detects a link, a photo, or text (poem/quote toggle); notes always optional.
- **Ambient authorship** — every card shows "name · warm time" ("rainy Tuesday", "this morning").
- **Themes** — light "paper" and dark "candlelit", system-following with a manual override in settings.
- **Realtime** — board and detail subscribe to Supabase Realtime, scoped to your space by RLS.
- **Storage** — images compressed client-side before upload to a private `media` bucket; served via signed URLs.

## Tech

| Layer | Choice |
|---|---|
| App | Expo SDK 55, Expo Router, TypeScript |
| Backend | Supabase (Postgres, Auth, Storage, Realtime) |
| Fonts | Fraunces (serif, the words) + Inter (sans, the chrome) |
| Icons | lucide-react-native |

## Setup

1. Install dependencies:

```bash
npm install
```

2. Environment — `.env` is already populated with this project's Supabase URL and publishable key. To point at a different project, copy `.env.example` and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

3. Run:

```bash
npx expo start
```

Open in Expo Go (iOS) or a development build. The masonry, theming, and most UI work in Expo Go; the iOS **share extension** (M2) requires a development build.

## Supabase

The schema lives in [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and has already been applied to the project. It includes the five tables, row-level security scoped to each space, the private `media` storage bucket, Realtime publication, and the `create_space` / `join_space` RPCs.

> [!IMPORTANT]
> **Egress quota.** The Supabase organization is on the free plan and has exceeded its monthly egress quota, so the data API (REST / Realtime / Storage) currently returns **HTTP 402** for all projects in the org — including this one. The app is wired correctly but **cannot read or write data until the quota resets next billing cycle, or the org upgrades / removes spend caps** in the Supabase dashboard. This is an account action; nothing in the code needs to change.

### One-time setup: enable anonymous sign-ins

The app uses **anonymous auth** so there's no login screen. Enable it once in the dashboard: **Authentication → Sign In / Providers → Anonymous Sign-ins → enable**. Without this, `signInAnonymously()` returns "Anonymous sign-ins are disabled". (Anonymous users use the `authenticated` role, so the existing RLS policies apply unchanged.)

## Roadmap (from the PRD)

- **M2 — Capture magic.** iOS share extension (`expo-share-extension`), the deployed `resolve-link` Edge Function (stub in `supabase/functions/`), shared-Keychain auth so the extension and app share a session, **Apple Sign In**.
- **M3 — Delight.** Own-video upload polish, push notifications, haptics, accessibility passes.

## Project structure

```
app/            # Expo Router screens (sign-in, pair, board, card/[id], add, settings)
components/     # CardView + per-type card souls, Masonry, Authorship, ui primitives
lib/            # supabase client, theme, providers, data hooks, media + link helpers
supabase/       # migrations + resolve-link edge function
docs/PRD.md     # the product spec
```
