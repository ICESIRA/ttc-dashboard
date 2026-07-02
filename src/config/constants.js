// ─────────────────────────────────────────────────────────────
// constants.js — dashboard constants (SKU, channels, months, colors)
// Edit here only if the business changes SKU / channel / colors
// ─────────────────────────────────────────────────────────────

// 3 main SKU groups (grouped from the 2 real data tabs)
export const SKUS = [
  "Box STD",
  "Box Custom",
  "Sticker",
];

export const CHANNELS = [
  "Shopee",
  "Lazada",
  "LINE OA",
  "Facebook",
  "TikTok Shop",
  "Instagram",
  "Website",
  "Others",
];

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Year is derived from real data (see getYearsFromRows) — not hardcoded
export const CURRENT_YEAR = new Date().getFullYear() + 543 > 2500
  ? new Date().getFullYear() // use A.D. (sheet stores years in A.D.)
  : new Date().getFullYear();

// Return the list of years present in the data (ascending)
export function getYearsFromRows(rows) {
  const set = new Set(rows.map((r) => r.year).filter(Boolean));
  return [...set].sort((a, b) => a - b);
}

// Month abbreviation → index 0-11
export const monthIndex = (m) => MONTHS.indexOf(m);

export const DAYS_IN_MONTH = {
  Jan: 31, Feb: 28, Mar: 31, Apr: 30,
  May: 31, Jun: 30, Jul: 31, Aug: 31,
  Sep: 30, Oct: 31, Nov: 30, Dec: 31,
};

// SKU colors (3 groups + fallback)
export const PALETTE = {
  "Box STD": "#3b82f6",
  "Box Custom": "#f59e0b",
  "Sticker": "#10b981",
  "Others": "#64748b",
};

// Sales channel colors
export const CH_COLOR = {
  Shopee: "#f97316",
  Lazada: "#8b5cf6",
  "LINE OA": "#22c55e",
  Facebook: "#3b82f6",
  "TikTok Shop": "#ec4899",
  Instagram: "#d946ef",
  Website: "#06b6d4",
  "Others": "#94a3b8",
};

export const ACCENT = "var(--accent)";

// auto-refresh interval in ms (30 seconds)
export const REFRESH_INTERVAL_MS = 30_000;
