// ─────────────────────────────────────────────────────────────
// sheetApi.js — ดึงข้อมูลจาก Apps Script (2 tab) → normalize เป็น schema เดียว
// header ถูก clean จากฝั่ง Apps Script แล้ว (trim + ตัด prefix หลัง "/")
//
// schema: { id, year, month, day, sku, channel, customerName, customerType,
//           quotedRevenue, revenue, orders, qaCount, customers, cogs, adSpend }
//
// กฎ: SKU 3 กลุ่ม (กล่อง STD / กล่อง Custom / สติกเกอร์)
//     ปิดได้: box = มีเลขใน "ยอดขายจริง" · stk = สถานะ "ขายได้"
//     ปีที่ยอมรับ: 2024–ปีปัจจุบัน (กันปีขยะ 1899 / ปีอนาคต)
// ─────────────────────────────────────────────────────────────

import { SHEET_API_URL } from "../config/dataSource.js";
import { MONTHS } from "../config/constants.js";

const MIN_YEAR = 2024;
const MAX_YEAR = new Date().getFullYear(); // ปีปัจจุบัน (ค.ศ.) — ตัดปีอนาคตออก

const toNum = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/[, ฿]/g, "").replace(/^-$/, "").trim());
  return Number.isFinite(n) ? n : 0;
};

const monthFromNumber = (n) => MONTHS[n - 1] || "";

// "5/2026" → { month:"พ.ค.", year:2026 } · กันขยะ "12/1899"
const parseMonthYear = (str) => {
  const m = String(str || "").trim().match(/(\d{1,2})\s*\/\s*(\d{4})/);
  if (!m) return { month: "", year: 0 };
  const mo = Number(m[1]);
  const yr = Number(m[2]);
  if (yr < MIN_YEAR || yr > MAX_YEAR) return { month: "", year: 0 }; // ขยะ
  if (mo < 1 || mo > 12) return { month: "", year: 0 };
  return { month: monthFromNumber(mo), year: yr };
};

const parseChannel = (raw) => {
  const s = String(raw || "");
  if (/shopee/i.test(s)) return "Shopee";
  if (/lazada/i.test(s)) return "Lazada";
  if (/line/i.test(s)) return "LINE OA";
  if (/\bfb\b|facebook/i.test(s)) return "Facebook";
  if (/tiktok/i.test(s)) return "TikTok Shop";
  if (/\big\b|instagram/i.test(s)) return "Instagram";
  if (/web/i.test(s)) return "Website";
  return "อื่นๆ";
};

// ── tab "กล่อง" (อ่านด้วยชื่อ header จริง) ──
// คอลัมน์ "กลุ่มสินค้า" = STD/Custom · "ยอดขายเสนอ"/"ยอดขายจริง" = ยอดเงิน
function normalizeBox(row, idx) {
  const seen = row["เห็นจากช่องทาง"] ?? "";
  const group = String(row["กลุ่มสินค้า"] ?? "").trim(); // "STD" | "Custom"
  const actual = toNum(row["ยอดขายจริง"]);
  const quoted = toNum(row["ยอดขายเสนอ"]);
  const year = toNum(row["ปี"]);
  const isClosed = actual > 0;

  return {
    id: `box-${idx}`,
    year,
    month: monthFromNumber(toNum(row["เดือน"])),
    day: toNum(row["วัน"]),
    sku: group.toLowerCase() === "custom" ? "กล่อง Custom" : "กล่อง STD",
    channel: parseChannel(seen),
    customerName: String(row["ชื่อลูกค้า"] ?? "").trim() || "ไม่ระบุ",
    customerType: /ลูกค้าเก่า/.test(String(seen)) ? "เก่า" : "ใหม่",
    quotedRevenue: quoted,
    revenue: isClosed ? actual : 0,
    orders: isClosed ? 1 : 0,
    qaCount: 1,
    customers: isClosed ? 1 : 0,
    cogs: 0,
    adSpend: 0,
    _group: group, // ใช้กรองแถวสรุป (ถ้าไม่ใช่ STD/Custom = แถวขยะ)
  };
}

// ── tab "เสนอราคา stk" ──
function normalizeStk(row, idx) {
  const { month, year } = parseMonthYear(row["เดือน/ปี"]);
  const status = String(row["สถานะ"] ?? "").trim();
  const amount = toNum(row["ยอดเงิน"]);
  const isClosed = status === "ขายได้";
  const customerName = String(row["ลูกค้า"] ?? "").trim();

  return {
    id: `stk-${idx}`,
    year,
    month,
    day: toNum(String(row["วันที่"] ?? "").split("-")[0]),
    sku: "สติกเกอร์",
    channel: parseChannel(customerName),
    customerName: customerName || "ไม่ระบุ",
    customerType: "ใหม่",
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
    throw new Error("ยังไม่ได้ตั้งค่า SHEET_API_URL — ดู README / src/config/dataSource.js");
  }
  const res = await fetch(`${SHEET_API_URL}?t=${Date.now()}`, { method: "GET", redirect: "follow" });
  if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);

  const data = await res.json();
  if (data.error) throw new Error(`Apps Script error: ${data.error}`);

  const box = (data.box || []).map(normalizeBox);
  const stk = (data.stk || []).map(normalizeStk);

  // เก็บเฉพาะแถวที่มีเดือน + ปีในช่วงที่ยอมรับ
  // box: ต้องมี กลุ่มสินค้า = STD/Custom (กันแถวสรุปยอดที่ไม่มีค่านี้)
  return [...box, ...stk]
    .filter((r) => r.month && r.year >= MIN_YEAR && r.year <= MAX_YEAR)
    .filter((r) => r._group === undefined || r._group === "STD" || r._group === "Custom")
    .map(({ _group, ...rest }) => rest); // ตัด field ช่วยออก
}
