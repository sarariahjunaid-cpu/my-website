/*
 * MIZAN CAPITAL — central configuration
 * ---------------------------------------------------------------
 * Single source of truth for every strategy figure on the site.
 * Cards, selector, comparison, strategy pages, forms, FAQ and
 * [data-bind] text are all rendered from this object.
 *
 * DEV / ADMIN WARNING (do not remove before launch review):
 *   The older Real Estate Investor Information Memorandum still
 *   states EUR 500,000 target, EUR 50,000 minimum, 36 months and
 *   15% annual. The CURRENT website terms are EUR 25,000 minimum,
 *   up to 14% per year, 3 years. The legal documentation has NOT
 *   been silently altered here and MUST be reconciled with this
 *   site before public launch.
 */
window.MIZAN_CONFIG = {
  /* false = no fictional reviews, investor counts, media logos or performance history. */
  DEMO_CONTENT: false,

  /* Optional: path/URL of the supplied hero photograph. null = built-in abstract skyline. */
  heroImage: null,

  /*
   * BACKEND INTEGRATION POINTS (all null = frontend demo; nothing is transmitted).
   * Production must use a secure HTTPS backend. Never put API keys here.
   */
  endpoints: {
    investmentApplication: null,   // e.g. "/api/investment-application"  (POST, JSON)
    callRequest: null,             // e.g. "/api/call-request"  or a Cal.com / Calendly embed
    // Future: CRM, email notifications, KYC/AML provider, document signing, investor portal.
  },

  strategies: {
    goldFx: {
      slug: "gold-fx",
      label: "Gold FX",
      name: "Mizan Group Gold FX Algorithm Trader Premium",
      subtitle: "Algorithm Trader Premium",
      minimum: 10000,
      potentialReturn: 17,
      duration: 1,
      approach: "Algorithmic Gold / FX",
      summary: "An algorithmic Gold / FX investment strategy with a one-year horizon.",
      description:
        "Mizan Group Gold FX Algorithm Trader Premium is an algorithmic Gold / FX investment strategy. " +
        "It is the shortest-duration approach on the platform. The methodology, instruments, risk controls and reporting " +
        "are set out in the definitive investment documentation, not on this website.",
      points: [
        "Algorithmic approach to Gold and FX markets",
        "One-year investment duration",
        "Lowest minimum investment on the platform"
      ]
    },
    realEstate: {
      slug: "real-estate",
      label: "Real Estate",
      name: "Mizan Group Real Estate",
      subtitle: "Real Estate",
      minimum: 25000,
      potentialReturn: 14,
      duration: 3,
      approach: "Real Estate",
      summary: "A three-year real-estate investment approach.",
      description:
        "Mizan Group Real Estate is a three-year investment approach. Proceeds may be used for real-estate related purposes, " +
        "which can include property acquisition, development, renovation, refurbishment, project financing, land acquisition, " +
        "preparatory development costs, sales and marketing, and other relevant project costs. " +
        "Specific projects, locations and terms are defined in the definitive investment documentation.",
      points: [
        "Property acquisition, development and renovation",
        "Project financing and land acquisition",
        "Three-year investment duration"
      ]
    },
    stable: {
      slug: "stable",
      label: "Stable",
      name: "Mizan Group Stable",
      subtitle: "Stable",
      minimum: 50000,
      potentialReturn: 10,
      duration: 5,
      approach: "Longer-term Stable strategy",
      summary: "A longer-term, measured and disciplined approach over five years.",
      description:
        "Mizan Group Stable is the longer-term approach on the platform: measured, disciplined and focused on stability over a five-year horizon. " +
        "The name describes the intended character of the strategy. It is not a guarantee, and it does not imply protection of capital. " +
        "The underlying composition is described in the definitive investment documentation.",
      points: [
        "Longer-term, measured and disciplined",
        "Five-year investment duration",
        "Not capital protected; the name is not a guarantee"
      ]
    }
  },

  disclosure:
    "Potential returns are not guaranteed. Investing involves risk, including the possible loss of part or all of the invested capital. " +
    "Final rights, obligations and investment conditions are governed by the definitive investment documentation."
};
