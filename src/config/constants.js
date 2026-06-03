// ─────────────────────────────────────────────────────────────
// constants.js — ค่าคงที่ของ dashboard (SKU, ช่องทาง, เดือน, สี)
// แก้ที่นี่ที่เดียวถ้า business เปลี่ยน SKU / ช่องทาง / สี
// ─────────────────────────────────────────────────────────────

// SKU 3 กลุ่มใหญ่ (จัดกลุ่มจากข้อมูลจริง 2 tab)
export const SKUS = [
  "กล่อง STD",
  "กล่อง Custom",
  "สติกเกอร์",
];

export const CHANNELS = [
  "Shopee",
  "Lazada",
  "LINE OA",
  "Facebook",
  "TikTok Shop",
  "Instagram",
  "Website",
  "อื่นๆ",
];

export const MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

export const YEARS = [2024, 2025, 2026];
export const CURRENT_YEAR = 2026;

export const DAYS_IN_MONTH = {
  "ม.ค.": 31, "ก.พ.": 28, "มี.ค.": 31, "เม.ย.": 30,
  "พ.ค.": 31, "มิ.ย.": 30, "ก.ค.": 31, "ส.ค.": 31,
  "ก.ย.": 30, "ต.ค.": 31, "พ.ย.": 30, "ธ.ค.": 31,
};

// สี SKU (3 กลุ่ม + fallback)
export const PALETTE = {
  "กล่อง STD": "#3b82f6",
  "กล่อง Custom": "#f59e0b",
  "สติกเกอร์": "#10b981",
  "อื่นๆ": "#64748b",
};

// สีช่องทางขาย
export const CH_COLOR = {
  Shopee: "#f97316",
  Lazada: "#8b5cf6",
  "LINE OA": "#22c55e",
  Facebook: "#3b82f6",
  "TikTok Shop": "#ec4899",
  Instagram: "#d946ef",
  Website: "#06b6d4",
  "อื่นๆ": "#94a3b8",
};

export const ACCENT = "var(--accent)";

// auto-refresh ทุกกี่ ms (30 วินาที)
export const REFRESH_INTERVAL_MS = 30_000;
