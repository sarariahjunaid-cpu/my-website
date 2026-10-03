# Mizan Group FZCO website (demo frontend)

Vanilla HTML/CSS/JS, no build step. Open `mizan/index.html` or serve the folder statically.

- `js/config.js` — single source of truth for strategy figures, `DEMO_CONTENT` flag, backend endpoints.
- `js/app.js` — rendering, hash router, selector, comparison, FAQ, Start Investing and Plan een call funnels.
- `css/styles.css` — design system.

## Before public launch
1. **Legal reconciliation:** the older Real Estate Investor Information Memorandum states EUR 500,000 target, EUR 50,000 minimum,
   36 months and 15% annual. The current website terms are EUR 25,000 / up to 14% p.a. / 3 years. The memorandum was NOT edited.
   Update/reconcile the legal documents so site and documentation agree.
2. Replace every highlighted `[PLACEHOLDER]` (registration number, address, emails, phone, governing law, privacy contact, regulatory status).
3. Supply real imagery (hero, corporate/founder image, Dubai/real-estate photography). Hero image: set `heroImage` in config.js.
4. Have counsel review the Privacy, Disclaimer and Terms drafts.
5. Fonts: the Didot/Bodoni-style stack falls back to system serif unless fonts are installed; self-host licensed font files if required.

## Backend (not implemented — forms are honest about this)
Set `endpoints.investmentApplication` (POST JSON) and `endpoints.callRequest`, or embed Cal.com / Calendly. Still required:
secure HTTPS API, CRM, email notifications, KYC/AML provider, document generation/signing, secure investor database, optional portal.
Investor data is held in memory only; never stored in localStorage.

## Analytics
`track()` emits `mizan:track` DOM events and fills `window.mizanEvents`. No third-party tracker is installed.

## Logo and motion
- `img/logo.svg` (vector trace), `img/logo.png` (transparent, 1200px) and white variants were made from the supplied stamp. Replace with the original vector artwork if available.
- `js/fx.js`: hero skyline + forex-style candles, ticker, sparklines and the interactive Real Estate tower. All are synthetic and decorative, labelled "illustrative"; never bind them to real prices or returns. They pause off-screen and honour reduced motion.

## Version 2 hero: skyline > skyscraper > trading floor
`js/scene.js` draws the plates in code: dusk sky, two city layers, a glass skyscraper, a close-up curtain-wall facade and an animated trading floor with simulated screens. `js/cine.js` maps scroll to CSS variables (the camera zoom). The previous generated hero is saved untouched in `mizan-v1-generated/`.
For true photographic realism, supply photographs through `MIZAN_CONFIG.cinePlates = { sky, far, mid, tower, facade, floor }` in `config.js` (any plate you set replaces the generated canvas; use transparent PNG/WebP for `far`, `mid` and `tower`). Trading-floor screens always show simulated data: never use real prices or performance there.

## Logo
The supplied "Mizan Capital" horizontal logo is used in the header and footer (`img/logo-capital*.svg/png`: vector trace and transparent PNG; the `-light` version has white lettering for dark backgrounds; `img/favicon.svg` is the column mark). Replace with the original vector artwork if you have it. The legal entity name on the site is still "Mizan Group FZCO"; say if the brand name in headings and legal text should change to Mizan Capital too.

## Real footage (exact shot, scroll-scrubbed)
The generated city cannot be photographically real. To use a real shot, supply a video you have the rights to (stock, drone or your own footage) and set in `js/config.js`:
```js
cineVideo: { src: "media/mizan-journey.mp4", start: 0, end: null }   // end null = full length
```
The scroll position then scrubs the video (skyline > into the building) and replaces the generated scenes; the strategy chamber still appears at the end. For smooth scrubbing, re-encode with every frame a keyframe, for example (start at 1:17, 25 s):
```
ffmpeg -ss 77 -t 25 -i source.mp4 -an -vf scale=1920:-2 -c:v libx264 -g 1 -crf 22 -pix_fmt yuv420p -movflags +faststart media/mizan-journey.mp4
```
Do not use third-party footage without a licence. Still photographs can be used instead through `cinePlates`.
