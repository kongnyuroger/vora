# VORA — demo run sheet

The scripted happy path for the 3–4 minute jury demo in [`VORA-BUILD.md` §10](VORA-BUILD.md). Every step below has been walked end to end against the production web build and the containerised API.

## Before you stand up

- [ ] Two browser windows side by side, both on the deployed URL: **left = rider**, **right = driver**. Use two separate profiles or one normal + one incognito — the session is stored per-browser-profile, so two tabs in the same profile share one login.
- [ ] Log in on both **before** the demo starts. Dev-mode OTP is shown on screen, but typing it live wastes 30 seconds.
- [ ] Driver window: tap **Go online** and confirm it says "You're online". Dispatch only offers rides to a driver holding a live socket, so a driver who was online earlier but has since closed the tab will not receive anything.
- [ ] Driver window: open DevTools → **Sensors → Location** and set a custom location near the pickup. Driver movement comes from real device geolocation, so on a laptop this is how the marker moves.
- [ ] Third window ready (not yet navigated) for the share-trip link.
- [ ] **Wake the free tiers.** Render spins the API down after ~15 minutes idle and takes up to a minute to come back; Neon scales to zero separately. Load the app a few minutes before you present, and again just before you stand up — logging in on both windows already does this.
- [ ] Phone on mobile data as the backup device, plus the screen recording of the two-window run.

## The run

**1 · Hook (15s)** — "In Douala, 7 of 10 traffic accidents involve a moto-taxi, and most rides are hailed on the street with no price and no safety. VORA fixes that."

Rider window is already showing the map with **driver pins around Carrefour Warda** — say the city is live, don't dwell.

**2 · Local booking (45s)** — Tap **Where to?** → type **`Biyem`** → pick *Carrefour Biyem-Assi*. Landmark, not an address: that is the point. Destination → **`Mvan`**.

Ride types appear **moto first**, each with an upfront price. Tap the chevron on Moto to show the **breakdown** — base, distance, time. Leave **Cash** selected. Tap **Book**.

**3 · The money shot (60s)** — Driver window: **New ride request** → **Accept**.

Back to the rider: status flips to *Driver is on the way* and the driver's marker moves. Point at the **Verified badge**, the **helmet icon**, and the **Trip PIN**.

Nudge the DevTools location a couple of times so the marker visibly travels.

**4 · Safety (30s)** — Rider: **Share trip** → the public tracking page opens in the third window with the live driver and no PIN or rider identity. Then **SOS** → **Yes, send SOS** → the alert appears in **both** rider and driver windows.

**5 · Payment (30s)** — Driver: **I've arrived** → **Start trip** → **Complete trip**. Rider sees **"950 FCFA paid · Cash"**.

If you want to show Mobile Money, book a second ride with **MTN MoMo** selected: the fare sits *Waiting for payment* while the subscriber approves, then settles. Only do this if you have time — it costs about 10 seconds of dead air.

**6 · Close (20s)** — "Moto-first, landmark-native, safety-led, MoMo-native, trilingual — built for Cameroon, not adapted to it."

## If something goes wrong

| Symptom | Cause | What to say / do |
|---|---|---|
| *"No drivers nearby right now"* | The driver window isn't online, or its socket dropped | Tap **Go online** again in the driver window. This message is the app being honest, not a crash. |
| Search says *"Couldn't reach VORA"* | API unreachable | Tap **Retry**. If it persists, switch to the recording. |
| First request after a quiet spell hangs | Render spun the free service down, or Neon scaled to zero | Wait it out — up to a minute for Render, a few seconds for Neon — and retry. Keep both warm by loading a page shortly before presenting. |
| Driver marker doesn't move | Real geolocation, no GPS on a laptop | Change the location in DevTools → Sensors. |
| Map is a black rectangle | `NEXT_PUBLIC_MAPBOX_TOKEN` missing on the deployment | The app says so on the map itself. Nothing to do live — use the backup. |

## What we deliberately did not build

Worth saying out loud, it reads as scope discipline rather than omission: real payment settlement, KYC document OCR, production SMS, an app-store binary, multi-city dispatch ops.
