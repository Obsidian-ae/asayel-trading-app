# Changelog

## 1.0.0 — template-v1.0.0

Templatization (Factory Plan Phase 1): the former Al Hadad Aero frontend
becomes the App Factory golden template.

- Added `src/app-config.json` + `src/config.js` resolving `preset`
  (`services`/`trader`/`full`) and per-module overrides — the single
  source of truth for branding, currency, categories, and module flags.
- Branding (`color_primary`, `color_bg_dark`, `theme_default`, `logo_file`)
  now overrides the app's look at runtime; no rebuild needed to re-brand.
- Replaced hardcoded "Al Hadad Aero" / AED / drone category strings with
  config-driven values throughout (`money()`, `PRODUCT_CATEGORIES`,
  `CUSTOMER_TYPES`).
- Nav, routes, and the AI chat suggestion chips are now gated per
  `modules.*`; disabled modules disappear from the UI entirely.
- Added a full-screen paywall shown when `settings.subscription_status`
  is `suspended` (Factory Spec §9).
- Added the `/custom` plugin interface: `src/custom/index.js` (nav +
  route merge point for AI-generated client customizations).
- PWA manifest (`vite.config.js`) is generated from `app-config.json`.
