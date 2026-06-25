# lovenotes — Product Requirements Document

A private, two-person shared corkboard for keeping the poems, quotes, screenshots, TikToks, and homemade videos that you and your partner make and find for each other. One beautiful place for all of it, where adding something costs almost nothing and looking at it later feels like a love letter.

> **Platform & form factor:** lovenotes is a **native iOS app for iPhone**, built with **React Native (Expo)**, phone-first and portrait. It is **not** a web app, and v1 targets iOS only (Android is a possible later port — see §13). Distribution is via TestFlight, not the public App Store.

> **How to use this doc in Cursor:** drop it at `/docs/PRD.md` and reference it in prompts ("follow /docs/PRD.md"), or paste the relevant section into context when building a given screen. The Design System and Data Model sections are the two you'll reference most.

---

## 1. Vision & principles

lovenotes has two halves that are deliberately designed against *opposite* goals, and every decision should respect which half it belongs to:

- **Capture should disappear.** Adding something costs at most two taps and never interrupts what you were doing. No required fields, no forced categorization, no friction. Capture feels like tossing something in a drawer.
- **Viewing should make you feel something.** Slowness, warmth, intentional typography. The board reads like a kept commonplace book, not a feed. This is where all the design love goes.

Three principles thread through the whole product:

1. **Ambient authorship is the romance.** Every card quietly remembers *who* added it and *when*. "Jay · rainy Tuesday" turns a saved file into a memory, for almost no engineering cost. This is non-negotiable and appears everywhere cards appear.
2. **Different content gets different soul.** A poem, a quote, a screenshot, and a TikTok should not look like the same card with different contents. Each type has its own treatment (see Design System).
3. **Restraint over decoration.** Warm paper, one accent color, serif reserved for the *words*. No literal cork texture or pushpin clipart — the corkboard is a feeling, not a skin.

---

## 2. Goals & non-goals

**Goals**
- A genuinely private space for exactly two people.
- Frictionless capture from TikTok, Photos, Notes, and the browser via the iOS share sheet.
- A polished, romantic board that makes mixed content types feel cohesive and intentional.
- Real-time sync so a card one person pins appears on the other's board within seconds.
- Effectively free to run at two-person scale.

**Non-goals (for v1)**
- No public sharing, discovery, social graph, or more than two members per space.
- No in-app video *editing* or creation — videos are made elsewhere and uploaded.
- No re-hosting of TikToks/links — those are stored as URLs and rendered via preview metadata.
- No Android in v1 (architecture leaves the door open; see §13).
- No ads, no analytics on content.

---

## 3. Users & core use case

Two people in a relationship who already send each other TikToks, screenshots, quotes, poems, and short videos across scattered apps. The job to be done: *"give us one place to keep all of it that's beautiful enough to actually revisit."*

There is no "discovery" or growth surface. Success is the two of them opening it regularly and the board accumulating meaning over time.

---

## 4. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| App framework | **Expo (React Native)** + Expo Router | Reuses existing Expo familiarity. **Requires a development build**, not Expo Go (the share extension and custom fonts both need native code). |
| Backend | **Supabase** | Postgres, Auth, Storage, Realtime, Edge Functions. Free tier is sufficient at two-person scale. |
| Auth | **Apple Sign In** via `expo-apple-authentication` → Supabase Auth | Clean on iOS; enables a shared auth session for the share extension. |
| Share extension | **`expo-share-extension`** (MaxAst) | Custom-view extension ("pin it" card pops *over* TikTok). Pinterest-style. |
| Link previews | **Supabase Edge Function** + provider oEmbed | One reliable server-side place; avoids CORS in app and extension. |
| Icons | **`lucide-react-native`** | Clean line icons matching the editorial aesthetic. No custom icon files needed. |
| Fonts | **`@expo-google-fonts/fraunces`** + **`@expo-google-fonts/inter`** | No manual font files (see §8). |
| Distribution | **TestFlight** | A two-person private app does not need a public App Store listing. Builds last 90 days. |
| Build | **EAS Build** or local Xcode | Local Xcode build is free; EAS has a free tier. |

---

## 5. Architecture overview

The whole capture system rests on one idea: **you integrate with iOS once (the share sheet), not with TikTok/Notes/Photos individually.** The app registers a share extension; from then on it appears as a destination in every app with a Share button. What differs per source is the *payload type*, and that type chooses the card.

```
TikTok / Photos / Notes / Safari
        │  (tap Share)
        ▼
   iOS share sheet  ──►  lovenotes share extension  ──►  typed payload
                                                          { url | images | videos | text }
        ┌──────────────────────┬──────────────────────┬──────────────────────┐
        ▼                      ▼                      ▼                      ▼
   url → link card       image → image card     video → video card      text → poem/quote card
        └──────────────────────┴──────────┬───────────┴──────────────────────┘
                                           ▼
                              Supabase (insert card row,
                              upload media, resolve link)
                                           ▼
                              Realtime → partner's board updates live
```

Payload truths to build around:
- **TikTok / Safari** hand you a **URL**, never the video file. Store the URL; render a preview via oEmbed metadata.
- **Photos** hand you the **image data** → upload to Storage.
- **Notes / selected text** hand you **plain text** → poem/quote card. (Selecting text and sharing the selection is the reliable path; sharing a whole Note can arrive messier.)
- **Your own videos** are the only thing actually uploaded as heavy media (the one storage-cost watch item).

---

## 6. Data model (Supabase / Postgres)

### Tables

```sql
-- A shared board for exactly two people.
create table spaces (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  invite_code text unique,                 -- short code the 2nd person enters to join
  created_at  timestamptz default now()
);

-- One row per authenticated user, linked to their space.
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  space_id     uuid references spaces(id) on delete set null,
  display_name text,
  accent_color text default '#C2502E',
  created_at   timestamptz default now()
);

create type card_type as enum ('poem','quote','screenshot','image','video','link');

-- Every pinned item. Type-specific columns are nullable; `type` decides which apply.
create table cards (
  id                  uuid primary key default gen_random_uuid(),
  space_id            uuid not null references spaces(id) on delete cascade,
  author_id           uuid not null references profiles(id),
  type                card_type not null,
  note                text,                -- optional caption from author; NEVER required
  -- text content (poem | quote)
  title               text,
  body                text,
  -- media (screenshot | image | video)
  media_path          text,                -- object path in the 'media' storage bucket
  media_width         int,
  media_height        int,
  -- link (link/tiktok)
  url                 text,
  link_title          text,
  link_author         text,
  link_thumbnail_url  text,
  link_provider       text,                -- 'tiktok' | 'youtube' | 'instagram' | 'web'
  created_at          timestamptz default now()
);
create index cards_space_created_idx on cards (space_id, created_at desc);

-- Heart reactions ("you loved this").
create table reactions (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null references cards(id) on delete cascade,
  user_id    uuid not null references profiles(id),
  created_at timestamptz default now(),
  unique (card_id, user_id)
);

-- Short replies on a card.
create table replies (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null references cards(id) on delete cascade,
  author_id  uuid not null references profiles(id),
  body       text not null,
  created_at timestamptz default now()
);
```

### Row-level security

Everything keys off "is this row in *my* space?" A small helper keeps policies readable:

```sql
create or replace function current_space_id() returns uuid
language sql stable security definer as $$
  select space_id from profiles where id = auth.uid()
$$;

alter table cards     enable row level security;
alter table reactions enable row level security;
alter table replies   enable row level security;
alter table profiles  enable row level security;
alter table spaces    enable row level security;

-- cards: members of the space can read; author must match on write.
create policy cards_select on cards for select
  using (space_id = current_space_id());
create policy cards_insert on cards for insert
  with check (space_id = current_space_id() and author_id = auth.uid());
create policy cards_modify on cards for update using (author_id = auth.uid());
create policy cards_delete on cards for delete using (author_id = auth.uid());

-- reactions / replies: scoped through the card's space (repeat the pattern).
-- profiles: a user can read both profiles in their space; write only their own row.
-- spaces: a member can read their space; invite_code lookup for joining is done
--         through a SECURITY DEFINER function so the code can be matched pre-join.
```

### Storage

- Bucket **`media`** (private). Path convention: `{space_id}/{card_id}.{ext}`.
- Storage RLS mirrors the card policy: a user may read/write objects whose first path segment equals `current_space_id()`.
- Serve images through Supabase's **CDN/transform** URLs (CDN-served assets don't count against the bandwidth quota, and on-the-fly resizing keeps the board light).
- **Compress images client-side before upload** (see §10) to protect the 1 GB free-tier storage and keep egress low.

### Realtime

Enable Realtime on `cards`, `reactions`, `replies`. The board subscribes filtered to `space_id = current_space_id()` and applies inserts/updates/deletes live.

---

## 7. Feature spec by screen

### 7.1 Onboarding & pairing
- **Sign in with Apple** → Supabase session.
- First user: prompted to **create a space** (optionally name it). A short `invite_code` is generated and shown to share.
- Second user: signs in → enters the invite code → joins the space (`profiles.space_id` set).
- Enforce **max two members** per space at join time.
- After both joined, app routes straight to the board on every launch.

### 7.2 Board (home / viewing)
- **Two-column masonry** of mixed cards, newest first, warm paper ground.
- Card treatments differ by `type` (see Design System §8.4). Each card shows the **authorship line** (heart + name + relative-warm time, e.g. "rainy Tuesday").
- Header: lovenotes wordmark (serif italic) + search + paired-avatars cluster.
- Bottom bar: board / **center add (+)** / reactions-or-activity.
- Links render from stored `link_thumbnail_url` + title (no live embeds in the grid — thumbnails keep the board fast). Tapping a link card opens the TikTok/URL.
- Empty state: a quiet "pin your first note" prompt (in-app vector, not an asset file).

### 7.3 Card detail
- Tap a card → full-screen, content given room to breathe.
- Poems/quotes set large in **Fraunces** on paper; images/videos shown full with a soft frame; links show a large preview + open button.
- Footer: "{author} pinned this {warm-time}" + **heart reaction** + **reply**.
- Reactions and replies sync in real time.

### 7.4 In-app add
- Reached from the center (+). **Type-blind**: one entry that auto-detects what you give it.
  - Paste/typed URL → link card (calls `resolve-link`).
  - Pick from Photos → image card.
  - Write text → poem or quote (a subtle toggle; defaults sensibly, never blocks saving).
- **No required fields.** Note/caption is always optional and can be added later from detail view.

### 7.5 Share extension (the capture magic) — see §9
- A custom card slides up *over* the host app (e.g. TikTok) showing the auto-detected item, an optional note, and a single **pin it** button. User never leaves the host app.

---

## 8. Design system

### 8.1 Light "paper" theme (default)

| Token | Hex | Use |
|---|---|---|
| `paper` | `#FBF7F1` | App background |
| `surface` | `#FFFDF9` | Cards (warm white) |
| `surfacePlain` | `#FFFFFF` | Screenshot/image card frame |
| `hairline` | `#ECE1D2` | Card borders, dividers |
| `hairlineStrong` | `#E5DACB` | Outer frame |
| `ink` | `#34251A` | Primary text / serif body |
| `inkSoft` | `#3A2A1C` | Wordmark, serif headings |
| `textSecondary` | `#8C7E6C` | Secondary UI text |
| `textMuted` | `#9A8C79` | Captions, authorship, icons |
| `accent` | `#C2502E` | Terracotta — primary accent, CTAs |
| `accentDeep` | `#993C1D` | Pressed/active accent |
| `accentSoft` | `#E8896B` | Accent on dark thumbnails |
| `blushBg` | `#FBEAF0` | Quote card background |
| `blushBorder` | `#F1CFDB` | Quote card border |
| `blushAccent` | `#D4537E` | Quote mark, hearts on blush |
| `blushInk` | `#4B1528` | Quote text |
| `blushInkSoft` | `#993556` | Quote authorship |

### 8.2 Dark "candlelit" theme

Deep espresso paper for night; warmer and more intimate. Same structure, remapped:

| Token | Hex |
|---|---|
| `paper` | `#1E1813` |
| `surface` | `#2A211B` |
| `hairline` | `#3A2E25` |
| `ink` | `#F0E6DA` |
| `textSecondary` | `#B5A492` |
| `textMuted` | `#9C8C79` |
| `accent` | `#E8896B` |
| `blushBg` | `#3A2630` |
| `blushAccent` | `#E89BB4` |
| `blushInk` | `#F0C9D6` |

Implement as a single `theme.ts` exporting `light` and `dark` token objects; select on system color scheme with a manual override toggle in settings.

### 8.3 Typography

- **Serif — Fraunces.** The *words*: poem/quote bodies, card-detail text, the wordmark (Fraunces italic). Fraunces' soft optical sizing suits the romantic editorial feel.
- **Sans — Inter.** All interface chrome: labels, buttons, captions, authorship lines, eyebrows.
- **Two weights of intent only:** regular (400) and medium (500–600). Avoid heavy weights.

| Role | Font | Size / style |
|---|---|---|
| Wordmark | Fraunces Italic | 21 |
| Detail serif body | Fraunces | 22 / line-height 1.85 |
| Card serif (poem) | Fraunces | 15 / 1.65 |
| Quote | Fraunces | 14.5 / 1.6 |
| UI body | Inter | 16 |
| Label / button | Inter | 13–14.5 |
| Eyebrow (e.g. "poem") | Inter | 11, uppercase, +0.5 letter-spacing, accent color |
| Authorship / caption | Inter | 11–12, textMuted |

### 8.4 Card treatments (the souls)

- **Poem** — warm `surface`, terracotta uppercase "poem" eyebrow, verse in Fraunces, authorship line.
- **Quote** — `blushBg`, oversized Fraunces opening quotation mark in `blushAccent`, line in Fraunces, blush authorship.
- **Screenshot / image** — `surfacePlain` with a thin `hairline` frame; image fills; authorship below.
- **Link / TikTok** — dark thumbnail (from `link_thumbnail_url`) with a centered play affordance and small provider label; caption strip + authorship below.
- **Video (own)** — like image but with play affordance; streams from Storage.

### 8.5 Shape, spacing, motion
- Radii: cards `16`, sheets `22` top corners, pills/buttons `14`, avatars full.
- Borders: hairline `0.5px`.
- Spacing rhythm: 10–14px card padding, generous vertical air on detail.
- Motion: slow and soft — cards settle in (fade + slight rise), never snap. Honor reduced-motion.
- Haptics: a gentle success haptic on "pin it" (later milestone).

---

## 9. Share extension — technical spec

**Library:** `expo-share-extension`. Requires a dev build (EAS or local Xcode), not Expo Go.

**`app.json` (Expo config) essentials:**

```jsonc
{
  "expo": {
    "plugins": [
      ["expo-share-extension", {
        "activationRules": [
          { "type": "url",   "max": 1 },
          { "type": "text" },
          { "type": "image", "max": 4 },
          { "type": "video", "max": 1 }
        ]
      }]
    ],
    "ios": {
      "bundleIdentifier": "com.YOURNAME.lovenotes",
      "infoPlist": { "AppGroup": "group.com.YOURNAME.lovenotes" },
      "privacyManifests": {
        "NSPrivacyAccessedAPITypes": [
          { "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryFileTimestamp",
            "NSPrivacyAccessedAPITypeReasons": ["C617.1"] }
        ]
      }
    }
  }
}
```

**Extension root component** receives `InitialProps`:
```ts
type InitialProps = {
  url?: string; text?: string;
  images?: string[]; videos?: string[]; files?: string[];
};
```
Flow inside the extension: detect type from which prop is present → show the "pin it" mini card (note optional) → write to Supabase → `close()`.

**Auth sharing (the key detail):** the extension is a separate process, so it must read the *same* Supabase session as the main app. Persist the Supabase session in a **shared Keychain access group** scoped to the App Group, and configure the Supabase client's storage adapter to use it in both targets. Without this, the extension can't authenticate as the user. Treat this as the main technical risk to validate early.

**Why an App Group at all:** it's what lets the extension and the app share storage/keychain — and it's a *paid* Apple Developer entitlement (already covered by an existing membership; free Apple IDs can't create App Groups).

---

## 10. Link resolution (Edge Function `resolve-link`)

A single server-side function so both the app and the extension get reliable previews without CORS pain.

- **Input:** `{ url: string }`
- **Logic:**
  - TikTok → `GET https://www.tiktok.com/oembed?url={url}` → `thumbnail_url`, `title`, `author_name`.
  - YouTube / Instagram / X also expose oEmbed — branch by host.
  - Unknown host → attempt OpenGraph (`og:image`, `og:title`); on failure, store the URL with `link_provider = 'web'` and no thumbnail (card falls back to a plain link treatment).
- **Output:** `{ provider, title, author, thumbnail_url }` → written onto the `cards` row.
- Call it on insert of any `link` card (fire-and-forget; the card can render plainly until metadata arrives, then update live via Realtime).

---

## 11. Non-functional requirements

- **Privacy:** strictly two-person; RLS enforced on every table and storage bucket; no third-party analytics on card content.
- **Performance:** grid uses stored thumbnails (no live embeds); images served via CDN/transform URLs; client-side image compression before upload.
- **Storage discipline:** the free tier's 1 GB file storage is only pressured by *own-video uploads* (links are URLs; screenshots/text are tiny). Compress images; consider capping video length; revisit a dedicated video host (Mux / Cloudflare Stream) only if it becomes real.
- **Offline / optimism:** inserts apply optimistically to the local board and reconcile on round-trip.
- **Accessibility:** support Dynamic Type, VoiceOver labels on cards ("poem by Jay, pinned in March"), and reduced-motion.
- **Backups:** the Supabase free tier has **no automatic backups** — set up the GitHub Actions → free backup workaround once real data accrues.
- **Inactivity pause:** free projects pause after ~7 days of zero activity; a daily-use couple app won't trip it, but a scheduled ping removes the risk entirely.

---

## 12. Milestones

- **M0 — Setup.** Expo dev build; Supabase project; Apple Sign In; fonts + `theme.ts`; design tokens.
- **M1 — Provable core (no extension yet).** Pairing flow (spaces/profiles/invite code); `cards` table; **in-app add** (link/photo/text); masonry board; card detail; Realtime; heart reactions. *Goal: confirm the two of you actually use it daily before polishing plumbing.*
- **M2 — Capture magic.** iOS share extension; `resolve-link` Edge Function; oEmbed previews on link cards; shared-keychain auth.
- **M3 — Delight.** Dark candlelit theme; replies; own-video upload; search; push notifications (Expo push); haptics.

---

## 13. Open questions & future doors

- **Android parity** — `expo-share-intent` covers both platforms via one config if/when Android is wanted; v1 is iOS-only.
- **Video hosting** — Supabase Storage is fine to start; graduate to Mux/Cloudflare Stream only if uploads grow.
- **Notifications** — Expo push for "Jay pinned something" / "Chelsea loved your poem."
- **Search** — start with simple text/`note` search; full-text later if needed.

---

## 14. Suggested repo structure (Expo Router)

```
app/
  _layout.tsx            # fonts, theme provider, auth gate
  (auth)/sign-in.tsx
  (auth)/pair.tsx        # create or join a space
  (tabs)/index.tsx       # board (masonry)
  card/[id].tsx          # card detail
  add.tsx                # in-app type-blind add
share/
  index.tsx              # share-extension root component
components/
  cards/PoemCard.tsx QuoteCard.tsx LinkCard.tsx ImageCard.tsx VideoCard.tsx
  Authorship.tsx Masonry.tsx
lib/
  supabase.ts            # client + shared-keychain storage adapter
  theme.ts               # light + dark tokens
  types.ts               # Card, Profile, Space, card_type
  resolveLink.ts         # calls the edge function
supabase/
  migrations/            # schema + RLS
  functions/resolve-link/
assets/
  icon.png splash.png    # the only image files you must create (see §8 of assets)
```

### Environment variables
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 15. Fonts, packages & asset files you need

### Fonts — **no manual files**, just two packages
```bash
npx expo install expo-font expo-splash-screen
npx expo install @expo-google-fonts/fraunces @expo-google-fonts/inter
```
Load at the root (`app/_layout.tsx`), keeping the splash up until ready:
```tsx
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Fraunces_400Regular, Fraunces_500Medium, Fraunces_600SemiBold,
  Fraunces_400Regular_Italic,
} from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Fraunces_400Regular, Fraunces_500Medium, Fraunces_600SemiBold,
    Fraunces_400Regular_Italic,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
  });
  if (!loaded) return null;
  SplashScreen.hideAsync();
  // ...render app
}
```
*Weights used:* Fraunces 400 / 500 / 600 + 400 Italic (wordmark); Inter 400 / 500 / 600.

### Icons — **no manual files**, one package
```bash
npx expo install lucide-react-native react-native-svg
```
Icons used across the app: `Heart`, `Plus`, `Play`, `Search`, `LayoutGrid`, `ChevronDown`, `Share2`, `MessageCircle`, `Pin`, `MoreHorizontal`.

### Image files you actually need to create
This is genuinely short — almost everything visual is type, color, icons, or user content.

| File | Spec | Notes |
|---|---|---|
| `assets/icon.png` | 1024×1024 PNG, no alpha | App icon. Suggestion: a terracotta heart or a folded-letter mark on `#FBF7F1` paper. Also used by the share extension (iOS derives it). |
| `assets/splash.png` | ~1284×2778 PNG (or use a centered mark) | Splash; set background to `#FBF7F1` and center the wordmark/heart. |
| `assets/adaptive-icon.png` *(only if Android later)* | 1024×1024 foreground | Background color `#FBF7F1`. |

Things you might *expect* to need but **don't**:
- Link/TikTok thumbnails — fetched at runtime via `resolve-link`, not bundled.
- A link fallback image — render an in-app card with a Lucide `Link` glyph instead.
- Empty-state and tab icons — drawn with Lucide / vectors, not asset files.
- Any card textures or "cork" art — intentionally none (restraint > skin).

---

*End of PRD. The two sections to keep open while building are §6 (Data model) and §8 (Design system); §9 is the one to prototype first to de-risk the share extension's shared-auth requirement.*
