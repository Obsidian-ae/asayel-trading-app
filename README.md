# template-app — App Factory golden template (frontend)

React 18 + Vite + Tailwind v4 PWA, fully driven by `src/app-config.json`
(Factory Spec §3). This is the golden template every client frontend is
stamped from — no client-specific code edits for the standard path.

## Setup

```bash
npm install
npm run dev          # http://localhost:5173, expects the backend on :4000
```

Set `VITE_API_URL` (see `src/api.js`) if the backend runs on a different
host/port.

## app-config.json

Branding, currency, categories, and module flags — see
`template-backend/app-config.schema.json` for the full shape (both repos
share the same config). Swap the active config locally (mirrors the
Factory's scaffold stage):

```bash
node scripts/use-config.js examples/gulf-drones.config.json
node scripts/use-config.js examples/falcon-ridge.config.json
```

`branding.logo_file` names a file already present in `public/` (e.g.
`logo.png`, `falcon-logo.svg`) — no restart needed, Vite serves it as a
static asset. Restart `npm run dev` after switching configs so the PWA
manifest (`vite.config.js`) picks up the change.

## Module flags

Every nav item and view is gated behind `config.modules.*` (see
`src/config.js` / `App.jsx`). Disabling a module removes it from the UI
and stops the frontend from calling its API — matching endpoints are
also removed on the backend, so there is no orphaned dead link.
