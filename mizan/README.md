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
