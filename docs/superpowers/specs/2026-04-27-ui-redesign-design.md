# TripSync AI — UI Redesign v2 ("Atlas") Design Spec

**Date:** 2026-04-27
**Branch:** `redesign/ui-v2`
**Base:** `main` @ `386b058`
**Scope:** Visual + UX overhaul only. Data flow, auth, and finance logic frozen.

---

## 1. Direction

**Atlas — editorial travel-magazine, dual-mode (dark default), newspaper-dense.**

National Geographic meets Linear. Warm neutrals, serif display headlines, a single primary teal accent + sparingly-used saffron, restrained motion, photography only where it earns its place. Replaces today's "cinematic dark glass" theme (black + cyan + violet glow + heavy framer-motion).

**Why this direction:** Travel apps benefit from warmth that generic SaaS lacks; editorial typography lets dense finance data look composed instead of cramped; the saffron accent reads as natural and culturally resonant for the Indian-traveler primary user without crossing into kitsch.

---

## 2. Hard Constraints (carried into every commit)

**Untouchable files:**

- `src/lib/AuthContext.tsx`
- `src/lib/firebase.ts`
- `src/lib/supabase.ts`
- `src/lib/authActions.ts`
- `src/middleware.ts`
- `src/lib/finance.ts`

**Untouchable behaviors:**

- All Supabase realtime channel names + subscriptions
- All `.eq() / .insert() / .upsert() / .delete()` Supabase calls
- Firebase `updateProfile` call in `src/app/profile/page.tsx`
- Modal a11y (`role=dialog`, `aria-modal`, `aria-labelledby`, ESC key, autoFocus on cancel)
- Footer hash anchors `#trips` and `#expenses` (must resolve to ids on dashboard)
- `/auth` page sign-in flow — chrome only, no logic edits, no third `router.replace`, no third `onAuthStateChanged`

**If a UI change forces a data-shape change → STOP and ask the user.**

---

## 3. Foundations

### 3.1 Token strategy

CSS variables on `:root` (light), overridden by `[data-theme="dark"]` on `<html>`. All component styling reads semantic tokens — components never reach for hex.

### 3.2 Surfaces (warm, not neutral)

| Token | Light | Dark |
|---|---|---|
| `--surface-canvas` | `#F7F1E5` (paper cream) | `#16120D` (warm charcoal) |
| `--surface-elevated` | `#FFFCF5` | `#1F1A14` |
| `--surface-overlay` | `#FBF6EC` | `#2B241B` |
| `--border-subtle` | `rgba(28,22,14,.06)` | `rgba(245,237,221,.06)` |
| `--border-default` | `rgba(28,22,14,.12)` | `rgba(245,237,221,.10)` |
| `--border-strong` | `rgba(28,22,14,.20)` | `rgba(245,237,221,.18)` |

### 3.3 Ink (text)

| Tier | Light | Dark |
|---|---|---|
| `--ink-primary` | `#1A1612` | `#F5EDDD` |
| `--ink-secondary` | `rgba(26,22,18,.72)` | `rgba(245,237,221,.72)` |
| `--ink-muted` | `rgba(26,22,18,.55)` | `rgba(245,237,221,.50)` |
| `--ink-subtle` | `rgba(26,22,18,.40)` | `rgba(245,237,221,.32)` |

Never pure white on dark — `#F5EDDD` is the editorial tell.

### 3.4 Accents

**Teal (primary):** links, primary CTA, focus rings, brand mark, charts.

| Step | Value |
|---|---|
| `--accent-teal-50` | `#E6F4F1` |
| `--accent-teal-100` | `#C2E6DF` |
| `--accent-teal-200` | `#9AD4C8` |
| `--accent-teal-300` | `#6FBFAE` |
| `--accent-teal-400` | `#4FB8A6` |
| `--accent-teal-500` | `#1F7A6B` |
| `--accent-teal-600` | `#155F54` |
| `--accent-teal-700` | `#0F4842` |

Light mode primary uses `500`; dark mode primary uses `400` (lifted for contrast).

**Saffron (secondary, used sparingly):** warmth highlights, currency emphasis on hero numbers, single trip-status pill, single most-owed settlement line. Never two saffron items adjacent.

| Step | Value |
|---|---|
| `--accent-saffron-100` | `#FBEDD0` |
| `--accent-saffron-300` | `#F0C677` |
| `--accent-saffron-400` | `#E8A23B` |
| `--accent-saffron-500` | `#D48420` |
| `--accent-saffron-600` | `#A66510` |
| `--accent-saffron-700` | `#7A4806` |

### 3.5 Semantic colors (dual-mode safe)

| Token | Light | Dark |
|---|---|---|
| `--semantic-success` | `#047857` | `#34D399` |
| `--semantic-warning` | `#B45309` | `#FBBF24` |
| `--semantic-danger` | `#B91C1C` | `#F87171` |
| `--semantic-info` | `#1F7A6B` | `#4FB8A6` |

### 3.6 Typography

- **Fraunces** (Google variable): display serif, `opsz` axis ~24 for headlines. Used for h1–h3 and prominent stat numbers. Slight italic on the wordmark "Sync".
- **Inter** (kept): body, h4–h6, all UI controls. Devanagari-friendly, ₹ glyph clean, tnums available.

**Modular scale** (ratio ~1.25):

| Token | Size | Use |
|---|---|---|
| `text-3xs` | 10px | micro labels |
| `text-2xs` | 11px | eyebrows |
| `text-xs` | 12px | small UI |
| `text-sm` | 14px | body small, dense rows |
| `text-base` | 16px | body |
| `text-lg` | 18px | body large |
| `text-xl` | 22px | h6 |
| `text-2xl` | 26px | h5 / modal headers |
| `text-3xl` | 32px | h4 / section headers |
| `text-4xl` | 40px | h3 |
| `text-5xl` | 52px | h2 / trip title |
| `text-6xl` | 72px | h1 / landing hero only |

**Body line-heights:** `26/16` (1.625) for editorial; `22/14` for dense tables.

### 3.7 Surfaces drop list

Removing entirely from `globals.css`:

- `.glass-card`, `.glass-card-hover`
- `.glow-orb`
- All `.shadow-glow-*`
- All `.gradient-text*`
- `body::before` SVG noise overlay
- `--animate-float`, `--animate-glow-pulse` keyframes
- All hardcoded `bg-dark-*`, `text-brand-*`, `bg-brand-*`, `bg-violet-*`, `bg-emerald-*`, `bg-rose-*`, `bg-amber-*` color-swatch overrides (current globals.css lines ~354–428 are largely orphaned legacy)

### 3.8 New surface primitive

`.surface-card`:

- Background: `--surface-elevated`
- Border: 1px `--border-subtle`
- Radius: 12px (down from 24px)
- Shadow: rim-light only on dark — `inset 0 1px 0 0 rgba(255,255,255,.04)`. Light mode relies on the border-subtle alone (any inset white rim on cream is too noisy).
- Hover: border-color → `--border-default` (no transform, no glow, no scale)

`.surface-card--photo`: trip cards. 16:10 image at top, 16px body padding, image `brightness(0.85)` in dark mode.

`.surface-card--stat`: dashboard stats. Eyebrow + Fraunces big number + caption.

---

## 4. Motion

**Philosophy:** Editorial = restraint. Newspaper-dense doesn't dance.

**What stays:**

- Modals: scale `0.96 → 1.0` + fade, 180ms in / 120ms out
- Tab content swap: opacity-only crossfade, 150ms
- FAB press: `scale(0.98)` on `:active` only — nothing on hover
- Skeleton shimmer (existing `--animate-shimmer` keyframe — keep, retint)
- Settle/pay success: one-shot 280ms checkmark draw — bounded, fires once per action
- Toast slide-in: `react-hot-toast` default

**What goes:**

- All card-entry stagger and `motion.div initial/animate/transition` on dashboards, trip grids, expense lists
- Card hover `translateY` / `scale` / glow `box-shadow` → border-color shift only
- Button hover `scale` → background-tint shift only
- `--animate-float`, `--animate-glow-pulse` keyframes (orbs are gone)
- Bouncy `cubic-bezier(0.175, 0.885, 0.32, 1.275)` everywhere → standard out/in curves

**Timing tokens (new):**

```css
--motion-fast: 120ms;
--motion-base: 180ms;
--motion-slow: 280ms;
--ease-out: cubic-bezier(0.2, 0, 0, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

**Reduced motion:** existing `@media (prefers-reduced-motion: reduce)` block in `globals.css` stays, broadened to disable success-checkmark draw.

**Net code impact:** ~80% of `motion.*` props in `src/app/page.tsx`, `src/app/dashboard/page.tsx`, tab components, and modals collapse to plain `<div>`. `framer-motion` package retained for the ~5 deliberate uses.

---

## 5. Components

### Buttons

Sizes: 32 / 40 / 48px tap height. **12px radius (pills retired except for badges).**

- **Primary**: solid teal, white ink. Hover: bg deepens one step. Press: deepens two. No scale.
- **Secondary**: 1px `--border-default`, transparent. Hover: bg fills with `--surface-overlay`.
- **Ghost**: text-only, ink-secondary. Hover: same overlay fill.
- **Destructive**: rose text, transparent. Fills rose only at confirm-delete step.
- **Icon**: 36px square, hover-only bg.

### Inputs

1px `--border-default`, `--surface-elevated` bg, 12px radius. Focus = 2px teal border + 4px teal/15% ring. Error = same shape with rose. Helper text below in `text-xs` ink-muted; error text in rose.

### Tabs

Underline tabs on a 1px ink-muted track. Active = 2px teal. Mobile overflow uses existing `scroll-x-snap`.

### Modals

Radix Dialog. Backdrop = `--surface-canvas` at 80% + 8px backdrop-blur (down from 16–20px). Content = `--surface-elevated`, 16px radius, 1px `--border-subtle`, max-w-md default. Header in Fraunces `text-2xl`. **All current a11y preserved.**

### Badges

Last home for pill shape. `text-2xs` uppercase, `letter-spacing: 0.08em`, weight 600. Tonal fill (e.g. teal-500/12% bg + teal-700 text on light; teal-500/15% + teal-200 on dark). Variants: teal (default), saffron (highlight), emerald (paid), amber (pending), rose (overdue), neutral.

### Avatars

Two-letter initial fallback, saffron tint background + saffron-700 text. Sizes 28 / 36 / 44 / 64. Group stacks: `-8px` overlap with `--surface-canvas` ring.

### Tooltips

Radix tooltip, `--surface-overlay` bg, `text-xs`, 6px radius, 400ms open delay. No glow shadow.

### Empty states

40px lucide icon at 40% opacity, Fraunces `text-lg` headline, Inter `text-sm` caption, single CTA. Center-aligned in card.

### Skeletons

Keep current `.skeleton` shimmer keyframe — retint for dual mode.

### Toasts

`react-hot-toast` config retuned in `layout.tsx`: `--surface-elevated` bg, 1px `--border-subtle`, 12px radius, success/error icons retinted.

### Specialty primitives

- **Invite code**: mono text in `--surface-overlay` with subtle saffron undertint. Tap-to-copy + toast.
- **Currency display**: ₹ + amount uses `font-feature-settings: "tnum"`. Headline contexts (dashboard total, trip card total, settlement headline) → Fraunces. Tabular contexts (expense rows, settlement matrix) → Inter tnums.
- **Balance bar** (Settlement): horizontal name + ₹amount + state lozenge. Single-tone fills, no gradients. Saffron reserved for the single most-owed line.

---

## 6. Pages

### Landing (`src/app/page.tsx`)

Newspaper masthead. Top: thin nav strip with logo + Sign in. Below: oversized Fraunces headline ("Plan together. Spend smarter.") with 1px rule underneath. One muted destination photo right ~40% width via `mix-blend-soft-light`. Saffron CTA "Start a trip" + ghost "Sign in." Feature section: three editorial columns with serif eyebrow numbers (01 / 02 / 03), no card chrome. Stats collapse to single horizontal rule. Rocket-CTA → saffron-underlined pull-quote. All glow orbs and entry stagger gone.

### Auth (`src/app/auth/page.tsx`)

Two-column desktop, stacked mobile. Left: half-bleed warm destination photo (single fixed image). Right: panel with wordmark, Fraunces "Welcome back", **untouched** Google sign-in button, T&C below. Mobile: photo collapses to 30vh hero band on top. **Zero changes to `handleGoogleSignIn`, `onAuthStateChanged`, no new `router.replace`.**

### Dashboard (`src/app/dashboard/page.tsx`)

- Nav: clean band, `--surface-elevated` + thin `border-bottom`. Logo / notifications / profile pill / sign-out / theme toggle.
- Greeting strip: Fraunces "Welcome back, {firstName}" + Inter date caption. Right: Create trip + Join trip buttons.
- Stats grid: 3-col desktop / 1-col mobile. `surface-card--stat` (eyebrow + Fraunces number + caption).
- **`id="trips"` preserved.** Heading "Your trips" Fraunces `text-3xl` + rule. Grid of `surface-card--photo`.
- **`id="expenses"` preserved.** "Recent expenses" sub-section, top 5 cross-trip rows in tight table.
- Empty state: editorial illustration + Fraunces "No trips yet" + Create CTA.

### Trip detail (`src/app/trips/[id]/page.tsx`)

- Header band: full-bleed destination photo at 16:5 / 0.7 brightness, gradient mask to `--surface-canvas` bottom. Fraunces `text-5xl` trip title. Caption strip: dates, destination, ₹ budget, member count, invite-code copy button.
- Tabs: underline tabs sticky on scroll. Order: Expenses / Settlement / Itinerary / Insights / Voting / Group.

### Tab interiors

- **ExpensesTab**: sticky filter bar (search + category + date range + Add). Editorial table — date (Inter tnum, ink-muted), description, category badge, amount (Inter tnum right-aligned, ₹). Hover row reveals delete (preserve confirm-modal a11y). `AutoDetectExpense` becomes inline magazine callout above table with saffron rules.
- **SettlementTab**: three big Fraunces numbers (You owe / You're owed / Net). Balance-bar list per Section 5 — saffron only on the single most-owed row. `TransactionHistory` collapses behind disclosure.
- **ItineraryTab**: day-by-day list with Fraunces "Day 01" left-rail. Tight activity rows. Single saffron rule on highest-cost activity per day. AI-generated badge top-right.
- **InsightsTab**: Fraunces italic pull-quote up top, saffron underline. Recharts retinted: single-teal accent, no rainbow, no drop shadows.
- **VotingTab**: each poll a `surface-card` with Fraunces question + horizontal balance-bar option rows.

### Profile + public profile

Two-column desktop, stack mobile. Left: 96px avatar + name + email + inline edit-name. Right: trip history list. Public profile = same chrome minus edit and email. **Firebase `updateProfile` call in `profile/page.tsx` untouched.**

### Modals

- `CreateTripModal`: Fraunces "Create a trip" header, single-form, saffron submit. A11y verbatim.
- `JoinTripModal`: invite code input in mono + Submit. A11y verbatim.

### FABs

Solid teal 56px circles, single lucide icon, 1px border, minimal shadow. Stack right-bottom 12px gap; group chat above chatbot. Open: right-anchored panel desktop / bottom-sheet mobile, `--surface-elevated`. Spacing reserves for `.mobile-action-bar` on mobile.

### Footer

- Drop "premium divider with glow" — single 1px `--border-subtle` rule.
- Three-column structure preserved.
- Caption rewritten: "Plan together. Spend smarter. Settle clean."
- **`#trips` / `#expenses` hash hrefs preserved.**
- Social icons: muted ink-secondary, hover = ink-primary. No per-platform color glow.
- Bottom strip: tighter spacing.

---

## 7. Theme switching

**Mechanism:** `data-theme` attribute on `<html>`. `[data-theme="dark"] { ... }` block in `globals.css` overrides root tokens.

**No-FOUC bootstrap** in `layout.tsx` `<head>` (synchronous, before hydration):

```js
(function () {
  const t = localStorage.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = t;
})();
```

**`useTheme()` hook**: exposes `theme`, `toggle()`. Persists to `localStorage.theme`. Listens to `matchMedia` change events only when no localStorage value is set.

**Toggle placement:** inside profile dropdown on dashboard nav. Sun/moon icon swap. No toggle on landing/auth (pre-auth users follow system preference).

**SSR:** `suppressHydrationWarning` on `<html>` (already present) covers post-script attribute.

**Default:** dark. First-time visitors with system light preference get light. Returning users see last choice.

---

## 8. Migration plan (commit-by-commit)

Each commit is independently verifiable. TS check + dev-server walk between each.

| # | Commit | Gate |
|---|---|---|
| 0 | `docs(redesign): ui-v2 design spec` | doc lands |
| 1 | `chore(redesign): tokens + theme foundation` | `tsc --noEmit` clean; app loads (visually broken — expected) |
| 2 | `redesign(footer): editorial chrome` | `#trips` / `#expenses` hash hrefs still navigate |
| 3 | `redesign(auth): two-column editorial layout` | sign-in works on Mac Chrome + Safari + mobile viewport |
| 4 | `redesign(dashboard): editorial masthead + tight grids` | `#trips` / `#expenses` IDs present, hash-scroll resolves; create-trip → detail flow works |
| 5 | `redesign(trip-detail): editorial header + underline tabs` | Radix tab keyboard nav; Supabase realtime subscriptions intact |
| 6a | `redesign(expenses-tab)` | add + delete expense roundtrip; confirm-modal a11y intact |
| 6b | `redesign(settlement-tab)` | settle a balance; transaction history collapse works |
| 6c | `redesign(itinerary-tab)` | AI generate-itinerary still posts + renders |
| 6d | `redesign(insights-tab)` | Recharts render with new tokens |
| 6e | `redesign(voting-tab)` | vote roundtrip |
| 6f | `redesign(group-chat)` | realtime messages still arrive |
| 7 | `redesign(profile): two-column editorial` | name edit → reload → name persists |
| 8 | `redesign(fabs): solid editorial circles` | positioning clears `.mobile-action-bar` on 375px viewport |

### Final verification before PR

- `npx tsc --noEmit` clean across whole branch
- `npm run dev` walk: sign-in → dashboard → create trip → add expense → delete expense → settle → sign out → sign back in. Profile name edit + reload persists.
- Mac Safari + Chrome + 375px mobile viewport
- PR to `main` with one screenshot per redesigned surface

---

## 9. Out of scope

- Adding actual Hindi (Devanagari) translation strings — direction supports it via Inter, but copy stays English
- Replacing `recharts` with a different chart library
- Replacing `framer-motion` (kept, used sparingly)
- Replacing `lucide-react` icon set
- Refactoring component architecture beyond visual concerns
- Backend / Supabase schema / Firebase auth flow changes
- Performance work beyond what falls out naturally from removing decorative effects
