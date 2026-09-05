# VORA — Claude Code Master Build Prompt
### NuxCine 2026 Hackathon · 48-hour build · Cameroon smart-mobility app

> **How to use this file.** Paste the whole document into Claude Code as the project brief, then work through **§8 Build Plan** one branch at a time. Each branch is scoped to be demoable on its own so you always have something working. When you ask Claude Code to build a branch, tell it: *"Build branch N from the VORA brief. Follow the data model in §6 and the design system in §7 exactly. Stop at the checkpoint and show me how to test it."*

---

## 1. Product vision & winning angle

**VORA** is a safety-first, moto-inclusive, landmark-aware urban mobility app built for how Cameroonians actually move — not a re-skin of Uber.

The one-sentence pitch:
> *"VORA is the ride app built for Cameroonian streets: book a bendskin, a taxi, or a shared ride by landmark instead of address, at a fair fixed price, with safety built in from the first tap."*

We are **not** trying to out-feature Yango or InDriver (they already do upfront fares and live tracking). We win by being **more local than any of them**: moto-first, landmark-based, safety-led, and trilingual (French / English / Pidgin).

---

## 2. The local realities VORA is built on

Every design decision traces back to a real fact about Cameroonian mobility. Use these in the pitch too.

1. **Moto-taxis (bendskin / okada) are the dominant urban mode** — ~35,000 in Yaoundé, ~50,000 in Douala; 12%+ of trips in Yaoundé, over a third in Douala. → **The moto is a first-class ride type, shown first, not an afterthought.**
2. **Moto safety is a real crisis** — in Douala, 7 of 10 traffic accidents involve a moto-taxi; hundreds of injuries and deaths yearly. → **Safety Shield is the headline feature, backed by data.**
3. **Shared taxis run informal fixed routes**, picking up multiple riders going the same way — the backbone of daily transport. → **Shared-ride ("Ensemble") matching digitizes this and cuts cost.**
4. **Fares are negotiated, not metered; overcharging is routine.** → **Transparent upfront "prix juste" pricing with a visible breakdown.**
5. **People navigate by quartier + landmark, not street address.** → **Landmark-based pickup is VORA's signature feature.**
6. **Hilly terrain, congestion, poor roads, rainy season.** → **Traffic-aware routing and honest ETAs.**
7. **Mobile Money is the payment default** (MTN MoMo, Orange Money); cash is still common. → **MoMo-native payments + cash + wallet.**
8. **Data is expensive and networks drop.** → **Installable PWA, low-data mode, offline tolerance.**
9. **Bilingual country + heavy Pidgin use.** → **French / English / Pidgin from day one.**

---

## 3. Feature scope (MoSCoW for 38 hours)

### MUST — the required hackathon features, done well (these are graded, non-negotiable)
- Phone-based **user authentication** (rider + driver), OTP flow (dev-mode OTP is fine).
- **Geolocation** (device location, permission handling, "use my location").
- **Interactive mapping** (branded Mapbox map, markers, current location).
- **Ride booking** flow (pick ride type → set pickup + destination → confirm).
- **Automatic route calculation** (polyline + distance + ETA via Mapbox Directions).
- **Fare estimation** (upfront price from the seeded price book, with breakdown).
- **Real-time driver tracking** (live driver marker moving toward rider, status updates).
- **Modern, intuitive, responsive UI** (see §7 — this is where the design score lives).

### MUST — the differentiators that win the innovation score (pick these, not extra polish)
- **Multi-modal, moto-first ride selection**: Moto / Taxi / Shared / Comfort.
- **Landmark-based pickup**: search a seeded landmark DB ("Carrefour Biyem-Assi") + AI free-text resolution.
- **Safety Shield**: driver verified badge, helmet-required flag (moto), share-trip link, SOS button, trip-start PIN.

### SHOULD — if time allows after MUSTs are solid
- **Shared-ride ("Ensemble")** matching + split fare.
- **AI copilot**: conversational trip entry ("I want to go to Mvan").
- **Voice announcements** (Web Speech API) + high-contrast accessibility mode.
- **In-app wallet** with MoMo top-up (sandbox).

### COULD — stretch, only if everything above is demo-ready
- Traffic-prediction hints on route choice.
- Ride history + ratings screen.
- Driver earnings summary.

### WON'T (this hackathon) — say this out loud in the pitch to show scope discipline
- Real payment settlement, KYC document OCR, production SMS, app-store binary, multi-city dispatch ops.

> **Rule:** never start a SHOULD until every MUST is demoable. A polished MUST-only app beats a broken feature-rich one.

---

## 4. Tech stack (final)

| Layer | Choice | Why |
|---|---|---|
| Rider + Driver app | **Next.js 15 (App Router) as an installable PWA**, TypeScript | One mobile-first codebase; installs to home screen; fastest path to a polished demo. Rider mode + driver mode in the same app. |
| Styling / UI | **Tailwind CSS + shadcn/ui + Framer Motion** | Premium look, accessible components, smooth micro-interactions. |
| Maps & routing | **Mapbox** GL JS + Directions + Geocoding + Map Matching | All-in-one, ride-hailing-proven, generous free tier. Fallback: MapLibre + OpenFreeMap + OSRM. |
| Client state / data | **Zustand** (UI state) + **TanStack Query** (server state) | Simple, fast, no boilerplate. |
| i18n | **next-intl** (fr / en / pidgin) | Trilingual from day one. |
| Backend | **NestJS + Prisma** | Matches your stack; clean modules; fast to scaffold. |
| Database | **PostgreSQL + PostGIS** | Real geospatial "nearest driver" queries = technical wow. |
| Realtime | **Socket.IO gateway (NestJS)** | Live driver location + ride status. |
| Auth | **JWT + phone OTP** (dev-mode auto-OTP) | Secure, quick, no SMS cost during build. |
| Payments | **Campay** (primary) / **Fapshi** (alt) sandbox, behind a `PaymentProvider` interface + **cash** default | MTN MoMo + Orange Money; swappable; cash for the live demo. |
| AI copilot | **OpenAI or Anthropic** API | Landmark parsing + conversational booking. |
| Voice | **Web Speech API** (browser) | Free TTS announcements + accessibility. |
| Deploy | **Vercel** (web) + **Railway** (API + Postgres) | You know Railway; Vercel gives instant PWA hosting. |

---

## 5. Repository & architecture

Single repo (safest — the organizers may hand you one repo per team):

```
vora/
├─ apps/
│  ├─ web/        # Next.js 15 PWA (rider + driver modes)
│  └─ api/        # NestJS backend
├─ packages/
│  └─ shared/     # shared TS types (Ride, User, enums, DTOs)
├─ package.json   # pnpm workspaces
└─ README.md
```

Use **pnpm workspaces** (skip Turborepo to save setup time). Keep shared enums/types in `packages/shared` so the ride-status lifecycle is identical on both sides.

**Environments:** `.env.example` in both apps. Never commit secrets. Keys needed: `DATABASE_URL`, `JWT_SECRET`, `MAPBOX_TOKEN` (public, on web), `MAPBOX_SECRET` (server geocoding), `CAMPAY_*` / `FAPSHI_*`, `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`).

---

## 6. Data model (Prisma outline)

Enums:
```
Role            = RIDER | DRIVER | ADMIN
RideType        = MOTO | TAXI | SHARED | COMFORT
RideStatus      = REQUESTED | SEARCHING | ACCEPTED | ARRIVING | ARRIVED | IN_PROGRESS | COMPLETED | CANCELLED
PaymentMethod   = CASH | MOMO_MTN | MOMO_ORANGE | WALLET
PaymentStatus   = PENDING | SUCCESS | FAILED
VerificationStatus = UNVERIFIED | PENDING | VERIFIED
```

Core models (fields abbreviated — Claude Code, expand sensibly and add timestamps + relations):
- **User**: id, phone (unique), name, role, language, avatarUrl, walletBalanceXaf, createdAt.
- **DriverProfile**: userId, rideTypes (RideType[]), plateNumber, vehicleModel, color, verification (VerificationStatus), helmetProvided (bool, moto), ratingAvg, ratingCount, isOnline, currentLat, currentLng, updatedAt.
- **Ride**: id, riderId, driverId?, rideType, status, pickupLat/Lng, pickupLabel, dropoffLat/Lng, dropoffLabel, distanceM, durationS, fareXaf, surgeMultiplier, paymentMethod, startPin (4-digit), sharedGroupId?, createdAt, timeline (JSON of status→timestamp).
- **FareQuote**: rideType, distanceM, durationS, baseXaf, perKmXaf, perMinXaf, surge, totalXaf (computed, returned to client before booking).
- **Payment**: rideId, method, status, providerRef, amountXaf.
- **WalletTransaction**: userId, type (TOPUP | RIDE | REFUND), amountXaf, ref.
- **SavedPlace**: userId, label ("Home"/"Work"), lat, lng, landmarkText.
- **Landmark** (seeded): id, name, aliases (String[]), quartier, city (YAOUNDE | DOUALA), lat, lng, category (CARREFOUR | MARKET | LANDMARK | QUARTIER | STOP). *Used for landmark-based pickup search.*
- **SafetyEvent**: rideId, type (SOS | ROUTE_DEVIATION | SHARE_STARTED), lat, lng, createdAt.
- **Rating**: rideId, fromUserId, toUserId, stars, comment.

**Seed the price book** (`prisma/seed.ts`) — example values in **FCFA (XAF)**, adjust to feel realistic for Yaoundé/Douala:

| RideType | base | per km | per min | minimum |
|---|---|---|---|---|
| MOTO | 300 | 100 | 15 | 500 |
| TAXI | 600 | 250 | 25 | 1000 |
| SHARED | 300 | 120 | — | 500 (then split) |
| COMFORT | 1000 | 350 | 40 | 2000 |

Surge: 1.0 default; 1.3 in a "peak hours" window; show it transparently.

**Seed landmarks** for Yaoundé and Douala. Do **not** hardcode coordinates from memory — at seed time, call **Mapbox Geocoding** for each name to get accurate lat/lng, then store them. Seed at least these (add more):
- *Yaoundé:* Bastos, Biyem-Assi, Mvan, Nkolbisson, Mvog-Mbi, Essos, Ngoa-Ekellé, Mendong, Etoudi, Nsam, Mokolo (Marché Mokolo), Carrefour Warda, Poste Centrale, Marché Central, Ngousso, Emana, Damas, Odza, Nsimalen Airport.
- *Douala:* Akwa, Bonanjo, Bonapriso, Deido, New Bell, Bonabéri, Makepe, Bépanda, Ndokotti, Marché Central, PK (Village), Douala International Airport.

---

## 7. Design system (professional — this decides the design score)

VORA must look like a real, funded product. Rounded, confident, map-hero, bottom-sheet UX like Bolt/Uber but with its own identity.

### Brand feel
Trustworthy, energetic, distinctly African-modern. The map is the hero; everything else floats over it in clean glassy sheets.

### Color tokens (CSS variables)
```css
--vora-green:      #0C7C59;  /* primary — go, trust, safety */
--vora-green-700:  #075740;  /* deep */
--vora-green-100:  #E3F3EC;  /* tint / surfaces */
--vora-amber:      #F6A609;  /* accent — energy, CTAs highlights, warmth */
--vora-amber-100:  #FDEFCF;
--vora-ink:        #0E1420;  /* text / dark base */
--vora-slate:      #5B6472;  /* muted text */
--vora-bg:         #F7F8F6;  /* app background */
--vora-surface:    #FFFFFF;
--vora-danger:     #E5484D;  /* SOS */
--vora-success:    #1FA971;
```
Route line on map: `--vora-green`. Pickup marker: `--vora-amber`. Driver marker: dark pill with vehicle icon. Dark map style for the ride screen; light for browsing.

### Typography
- Display / headings: **Space Grotesk** (or Sora) — geometric, characterful.
- Body / UI: **Inter** — clean, legible.
- Scale: 32/24/20 headings, 16 body, 14 caption. Generous line-height. Load via `next/font`.

### Shape, spacing, elevation
- Radii: cards 16px, bottom sheets 24px (top corners), buttons **pill** (full).
- Spacing: 8px base grid; generous padding (16–24px) on sheets.
- Shadows: soft, layered (`0 8px 24px rgba(14,20,32,.08)`); sheets get a stronger top shadow.
- Big tap targets (min 48px). Thumb-reachable primary CTA at the bottom.

### Motion (Framer Motion)
- Bottom sheet: spring slide-up (stiffness ~300, damping ~30), snap points (peek / half / full).
- Driver marker: smooth interpolation between location updates (don't teleport).
- Searching-for-driver: pulsing radar animation around pickup.
- Buttons: subtle scale-on-press (0.97). Skeleton loaders, never spinners-only.

### Signature UI patterns
- **Home:** map hero + a floating "Where to?" pill + saved places (Home/Work) + a ride-type carousel (Moto first, with icon + price-from).
- **Booking sheet:** pickup (with **"Set by landmark"** toggle) → destination → ride-type cards showing ETA + upfront price + breakdown chevron → big **"Book"** CTA.
- **On-trip:** live map, driver card (photo, name, rating, plate, **Verified** badge, helmet icon for moto), trip PIN chip, **Share trip** + **SOS** buttons always visible.
- **Trust cues everywhere:** verified badges, star ratings, plate numbers, upfront price locked in.

### Logo direction (for the designers)
Wordmark "VORA" in Space Grotesk, the "O" as a subtle location-pin / steering ring in amber-on-green. Ship an SVG mark + app icon + a splash. Keep a small Figma with: color styles, type styles, components (button, sheet, ride card, driver card), and the 6 core screens (splash, auth, home, booking, searching, on-trip). Design score criteria to hit: **ergonomics, accessibility, visual consistency, UX quality** — so keep spacing/tokens consistent and add a high-contrast toggle.

---

## 8. Build plan — ordered branches for 38 hours

Each branch ends at a **checkpoint** you can demo. Do them in order. Keep `main` always-demoable; merge each branch when its checkpoint passes.

**Branch 0 — Scaffold & foundations** *(target: first ~1h)*
- pnpm workspace, `apps/web` (Next 15 + TS + Tailwind + shadcn + Framer Motion + next-intl + PWA manifest), `apps/api` (NestJS + Prisma), `packages/shared`.
- Design tokens wired (colors, fonts, radii). Base layout, bottom-sheet component, button.
- ✅ *Checkpoint:* branded empty app runs on phone (installable), API health-check responds.

**Branch 1 — Auth (phone + OTP)** 
- NestJS auth module: request OTP → verify → JWT. Dev mode returns/logs the OTP.
- Web: phone entry → OTP screen → session. Role toggle (rider/driver) for demo.
- ✅ *Checkpoint:* log in as rider and as driver on two devices/windows.

**Branch 2 — Map + geolocation + places** 
- Mapbox map (dark ride style), current-location, recenter. Geocoding search.
- Landmark seed + `Landmark` search endpoint. **"Set pickup by landmark"** UI.
- ✅ *Checkpoint:* search "Biyem-Assi", map flies to it, pin drops.

**Branch 3 — Ride types, route & fare** 
- Directions API: route polyline + distance + duration.
- Price-book seed + `FareQuote` endpoint. Ride-type carousel (Moto-first) with upfront price + breakdown.
- ✅ *Checkpoint:* pick pickup + dropoff, see route drawn and a price per ride type.

**Branch 4 — Booking + realtime driver tracking (the core demo)** 
- Ride lifecycle in NestJS + Socket.IO gateway. PostGIS "nearest online driver".
- Rider requests → driver window gets request → accepts → driver marker streams toward pickup → status updates (accepted → arriving → arrived → in_progress → completed).
- Driver mode: go online, receive request, accept, "share my location" streaming.
- ✅ *Checkpoint:* **two windows** — rider books, driver accepts, rider watches the driver move live. This is the money shot for the jury.

**Branch 5 — Safety Shield** 
- Verified badge + helmet flag on driver card. Trip **PIN**. **Share trip** link (public read-only tracking page). **SOS** button → `SafetyEvent` + on-screen alert.
- ✅ *Checkpoint:* open a shared-trip link in a 3rd window; press SOS and see it register.

**Branch 6 — Payments (MoMo sandbox + cash)** 
- `PaymentProvider` interface; Campay/Fapshi sandbox impl + cash default. On complete → create `Payment`. Optional wallet top-up.
- ✅ *Checkpoint:* complete a ride with cash; trigger a MoMo sandbox charge.

**Branch 7 — Innovation polish (pick from SHOULD)** 
- **Shared-ride "Ensemble"** matching + split fare, **and/or** **AI copilot** ("I want to go to Mvan" → parsed pickup/dropoff), **and/or** **voice announcements** + high-contrast mode + Pidgin locale.
- ✅ *Checkpoint:* one differentiator working end-to-end.

**Branch 8 — Demo hardening** 
- Seed demo drivers, a scripted happy path, empty/error states, loading skeletons, i18n pass, deploy to Vercel + Railway, test on a real phone over mobile data.
- ✅ *Checkpoint:* full run on a phone, deployed URL, no dead ends.

> If you fall behind: ship **Branches 0–5 flawless + one item from Branch 7**. That is a winning demo. Do not chase COULDs.

---

## 9. Key implementation notes

- **Realtime:** rooms per ride (`ride:{id}`) and a drivers pool. Events: `driver:online`, `driver:location`, `ride:request`, `ride:accept`, `ride:status`, `sos`. Interpolate marker movement client-side between updates.
- **Nearest driver (PostGIS):** store driver location as `geography(Point)`, query `ST_DWithin` + `ORDER BY ST_Distance` filtered by `rideType` and `isOnline`.
- **Fare calc:** `max(minimum, base + perKm*km + perMin*min) * surge`, rounded to nearest 50 XAF. Always show the breakdown; lock the price at booking.
- **Landmark resolution:** exact/alias match in `Landmark` first → Mapbox geocoding → (optional) AI to parse free text like "en face de la pharmacie à Biyem-Assi" into a landmark + note. Seed coordinates via Mapbox at seed time, never hardcode from memory.
- **AI copilot:** small, tight system prompt that outputs **structured JSON only** (`{pickup, dropoff, rideType}`); parse and pre-fill the booking sheet. Keep it optional so a network hiccup never breaks the core flow.
- **Voice:** `speechSynthesis` for "Your driver is arriving" / "Trip started"; pick voice by locale.
- **PWA / low-data:** manifest + service worker (next-pwa), cache the shell, lazy-load map, compress markers, add a "low-data mode" that reduces map detail.
- **Payments abstraction:** one interface, cash as default so the live demo never depends on a sandbox being up.
- **Seed for demo:** 4–6 fake drivers (mix of moto/taxi) parked near a Yaoundé quartier so "nearby drivers" looks alive on first load.

---

## 10. Jury demo script (rehearse this — 3–4 minutes)

1. **Hook (15s):** "In Douala, 7 of 10 accidents involve a moto-taxi, and most rides are hailed on the street with no price and no safety. VORA fixes that."
2. **Local booking (45s):** Open app → "Where to?" → type a **landmark** ("Carrefour Biyem-Assi") → pick **Moto** (shown first) → upfront **fair price** with breakdown → Book.
3. **The money shot (60s):** Second window = driver, goes online, **accepts**, marker moves live toward pickup on the rider's screen. Show the **Verified badge**, **helmet icon**, and **trip PIN**.
4. **Safety (30s):** Tap **Share trip** (open the link in a third window) → tap **SOS** → alert registers.
5. **Innovation (30s):** Show your Branch-7 feature (AI/"I want to go to Mvan", or shared-ride split, or voice + Pidgin).
6. **Payment (15s):** Complete ride → cash + MoMo option.
7. **Close (20s):** "Moto-first, landmark-native, safety-led, MoMo-native, trilingual — built for Cameroon, not adapted to it."

Have a **backup screen recording** of the two-window live-tracking demo in case the network fails on stage.

---

## 11. Pitch / justification cheat-sheet

- **Problem (with data):** dominance of moto-taxis + accident stats + overcharging + address-less navigation.
- **Why we're different from Yango/InDriver:** moto-first, landmark-based pickup, safety-led, Pidgin support — hyper-local, not a global app bolted onto Cameroon.
- **Feasibility:** built and deployed in 48h on a lean, proven stack; MoMo via Campay/Fapshi; PostGIS for real dispatch; PWA installs instantly.
- **Impact:** safer rides, fair fixed prices, lower cost via shared rides, accessible to non-smartphone-native users via voice + landmarks.
- **What's next (shows vision):** driver KYC + document OCR, real SMS/USSD fallback, city dispatch dashboard, offline queueing, partnership with moto unions.

---

**Ship discipline beats feature count. Make the MUSTs beautiful, make one differentiator sing, and rehearse the two-window demo until it's flawless. Bonne chance. 🇨🇲🚀**
