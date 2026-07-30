// Resolves app-config.json (Factory Spec §3) the same way the backend does
// (src/config.js in template-backend): preset defaults + per-module
// overrides. The scaffold stage commits a client-specific app-config.json
// here at build time — this file never needs to change per client.
import raw from "./app-config.json";

const PRESETS = {
  services: {
    inventory: false, sales: true, invoices: true, customers: true,
    purchase_orders: false, shipping: false, expenses: true, reports: true,
    agent: true, telegram_bot: false, serial_tracking: false,
  },
  trader: {
    inventory: true, sales: true, invoices: true, customers: true,
    purchase_orders: true, shipping: true, expenses: true, reports: true,
    agent: true, telegram_bot: false, serial_tracking: false,
  },
  full: {
    inventory: true, sales: true, invoices: true, customers: true,
    purchase_orders: true, shipping: true, expenses: true, reports: true,
    agent: true, telegram_bot: true, serial_tracking: true,
  },
};

const preset = PRESETS[raw.preset] || PRESETS.trader;
export const config = { ...raw, modules: { ...preset, ...(raw.modules || {}) } };
export const isModuleEnabled = (name) => !!config.modules[name];

// Same slugging rule as template-backend/src/lib/categories.js so product
// category / customer type values match between frontend selects and the
// backend's app-layer validation.
export const slugify = (s) =>
  String(s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "other";

export const PRODUCT_CATEGORIES = config.business.product_categories.map((label) => ({ value: slugify(label), label }));
export const CUSTOMER_TYPES = config.business.customer_types.map((label) => ({ value: slugify(label), label }));
// Fixed built-in list — not part of the client-configurable schema.
export const EXPENSE_CATEGORIES = ["shipping", "tools", "repairs", "rent", "marketing", "salaries", "customs", "other"];

export const money = (n) => {
  const v = Number(n) || 0;
  return v.toLocaleString(config.client.locale || "en-US", { maximumFractionDigits: 2 }) + " " + config.client.currency;
};

// Derives the {100,400,500,600} accent tints Tailwind's --color-sand-*
// variables expect from a single branding.color_primary hex.
const hexToRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
const mix = (hex, withHex, amount) => {
  const [r1, g1, b1] = hexToRgb(hex), [r2, g2, b2] = hexToRgb(withHex);
  return "#" + toHex(r1 + (r2 - r1) * amount) + toHex(g1 + (g2 - g1) * amount) + toHex(b1 + (b2 - b1) * amount);
};
export const brandShades = (primary) => ({
  100: mix(primary, "#ffffff", 0.75),
  400: mix(primary, "#ffffff", 0.25),
  500: primary,
  600: mix(primary, "#000000", 0.15),
});
