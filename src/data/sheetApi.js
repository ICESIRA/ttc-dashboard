// ──────────────────────────────────────────────────────────────
// sheetApi.js (v2) — ดึงข้อมูลจาก Apps Script (2 tab) → normalize เป็น schema เดียว
//
// schema กลาง: { id, year, month, day, sku, channel, customerName, customerType,
//                quotedRevenue, revenue, orders, qaCount, customers, cogs, adSpend }
//
// ── tab "กล่อง" ──
//   header จริง: วันที่ / วัน / เดือน / ปี / เห็นจากช่องทาง / ช่องทางที่ทักมา /
//                ชื่อลูกค้า / กลุ่มสินค้า(STD|Custom) / รหัสสินค้า / ราคา / MOQ /
//                ยอดขายเสนอ / ยอดขายจริง / ขายจริง (วันที่) / วันที่โอน 50% แรก
//   ปิดการขาย: ยอดขายจริง > 0  ·  วัน revenue = "ขายจริง (วันที่)" ถ้ามี ไม่งั้น fallback วัน/เดือน/ปี
//
// ── tab "STK" ──
//   header จริง: วันที่(ISO) / เดือน/ปี("5/2026") / ช่องทาง / ประเภท / ลูกค้า /
//                Model / ชนิดกระดาษ / ... / ยอดเงิน / สถานะ("เสนอราคา"|"ขายได้")
//   ปิดการขาย: สถานะ === "ขายได้"  ·  ระดับเดือน (ไม่มีวันแยก → day = 1)
// ──────────────────────────────────────────────────────────────

import { SHEET_API_URL } from "../config/dataSource.js";
import { MONTHS } from "../config/constants.js";

const MIN_YEAR = 2024;
const MAX_YEAR = new Date().getFullYear();

// แปลงค่าตัวเลข (ตัด comma / บาท / ช่องว่าง)
const toNum = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/[,฿\s]/g, "").replace(/^-$/, "").trim());
  return Number.isFinite(n) ? n : 0;
};

// เลขเดือน 1-12 → ชื่อเดือนไทย (ม.ค. ...)
const monthFromNumber = (n) => MONTHS[n - 1] || "";

// parse "ขายจริง (วันที่)" แบบ "15/5/2026" หรือ "15/05/2026" → { day, month, year }
const parseSlashDate = (str) => {
  const m = String(str || "").trim().match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})/);
  if (!m) return null;
  const day = Number(m[1]);
  const mo = Number(m[2]);
  const yr = Number(m[3]);
  if (yr < MIN_YEAR || yr > MAX_YEAR) return null;
  if (mo < 1 || mo > 12 || day < 1 || day > 31) return null;
  return { day, month: monthFromNumber(mo), year: yr };
};

// parse "5/2026" (เดือน/ปี) → { month, year }  ·  ระดับเดือน
const parseMonthYear = (str) => {
  const m = String(str || "").trim().match(/(\d{1,2})\s*\/\s*(\d{4})/);
  if (!m) return { month: "", year: 0 };
  const mo = Number(m[1]);
  const yr = Number(m[2]);
  if (yr < MIN_YEAR || yr > MAX_YEAR) return { month: "", year: 0 };
  if (mo < 1 || mo > 12) return { month: "", year: 0 };
  return { month: monthFromNumber(mo), year: yr };
};

// เดาช่องทางจาก text (เห็นจากช่องทาง / ชื่อลูกค้า)
const parseChannel = (raw) => {
  const s = String(raw || "");
  if (/shopee/i.test(s)) return "Shopee";
  if (/lazada/i.test(s)) return "Lazada";
  if (/line/i.test(s)) return "LINE OA";
  if (/\bfb\b|facebook/i.test(s)) return "Facebook";
  if (/tiktok/i.test(s)) return "TikTok Shop";
  if (/\big\b|instagram/i.test(s)) return "Instagram";
  if (/web/i.test(s)) return "Website";
  return "Others";
};

// ── normalize tab "กล่อง" ──
function normalizeBox(row, idx) {
  const seen = row["เห็นจากช่องทาง"] ?? "";
  const group = String(row["กลุ่มสินค้า"] ?? "").trim(); // "STD" | "Custom"
  const actual = toNum(row["ยอดขายจริง"]);
  const quoted = toNum(row["ยอดขายเสนอ"]);
  const isClosed = actual > 0;

  // วันที่ใช้คำนวณ: ถ้าปิดแล้วและมี "ขายจริง (วันที่)" → ใช้วันปิด ไม่งั้น fallback วัน/เดือน/ปี (วันเสนอ)
  const closeDate = isClosed ? parseSlashDate(row["ขายจริง (วันที่)"]) : null;
  const year = closeDate ? closeDate.year : toNum(row["ปี"]);
  const month = closeDate ? closeDate.month : monthFromNumber(toNum(row["เดือน"]));
  const day = closeDate ? closeDate.day : toNum(row["วัน"]);

  return {
    id: `box-${idx}`,
    year,
    month,
    day,
    sku: group.toLowerCase() === "custom" ? "Box Custom" : "Box STD",
    channel: parseChannel(seen),
    customerName: String(row["ชื่อลูกค้า"] ?? "").trim() || "N/A",
    customerType: /ลูกค้าเก่า|เก่า/.test(String(seen)) ? "Returning" : "New",
    quotedRevenue: quoted,
    revenue: isClosed ? actual : 0,
    orders: isClosed ? 1 : 0,
    qaCount: 1,
    customers: isClosed ? 1 : 0,
    cogs: 0,
    adSpend: 0,
    _group: group, // ใช้กรองแถวขยะ (STD/Custom เท่านั้น)
  };
}

// ── normalize tab "STK" ──
function normalizeStk(row, idx) {
  const { month, year } = parseMonthYear(row["เดือน/ปี"]);
  const status = String(row["สถานะ"] ?? "").trim();
  const amount = toNum(row["ยอดเงิน"]);
  const isClosed = status === "ขายได้";
  const customerName = String(row["ลูกค้า"] ?? "").trim();
  const channelRaw = String(row["ช่องทาง"] ?? "") || customerName;

  return {
    id: `stk-${idx}`,
    year,
    month,
    day: 1, // STK ระดับเดือน ไม่มีวันแยก
    sku: "Sticker",
    channel: parseChannel(channelRaw),
    customerName: customerName || "N/A",
    customerType: "New",
    quotedRevenue: amount,
    revenue: isClosed ? amount : 0,
    orders: isClosed ? 1 : 0,
    qaCount: 1,
    customers: isClosed ? 1 : 0,
    cogs: 0,
    adSpend: 0,
  };
}

export async function fetchRows() {
  if (!SHEET_API_URL) {
    throw new Error("SHEET_API_URL is not set — see README / src/config/dataSource.js");
  }
  const res = await fetch(`${SHEET_API_URL}?t=${Date.now()}`, { method: "GET", redirect: "follow" });
  if (!res.ok) throw new Error(`Failed to load data (HTTP ${res.status})`);

  const data = await res.json();
  if (data.error) throw new Error(`Apps Script error: ${data.error}`);

  const box = (data.box || []).map(normalizeBox);
  const stk = (data.stk || []).map(normalizeStk);

  // กรองแถวที่มีเดือน + ปีในช่วงที่ยอมรับ + กล่องต้องเป็น STD/Custom
  const rows = [...box, ...stk]
    .filter((r) => r.month && r.year >= MIN_YEAR && r.year <= MAX_YEAR)
    .filter((r) => r._group === undefined || r._group === "STD" || r._group === "Custom")
    .map(({ _group, ...rest }) => rest);

  // ad spend ยังไม่มีใน sheet นี้ → ส่ง array ว่าง (ไว้ต่อทีหลัง)
  return { rows, adSpendDaily: [] };
}
