// ─────────────────────────────────────────────────────────────
// sheetApi.js — ดึงข้อมูลจาก Apps Script (2 tab) แล้ว normalize เป็น schema เดียว
//
// Apps Script คืน { box: [...], stk: [...] }
//   box = tab "กล่อง"        · stk = tab "เสนอราคา stk"
// รวมเป็น array เดียว schema:
//   { id, year, month, day, sku, channel, customerName, customerType,
//     quotedRevenue, revenue, orders, qaCount, customers, cogs, adSpend }
//
// กฎ (ยืนยันกับเจ้าของข้อมูลแล้ว):
//   - SKU 3 กลุ่ม: "กล่อง STD" / "กล่อง Custom" / "สติกเกอร์"
//   - ยอดปิดได้: box = มีเลขใน "ยอดขายจริง" · stk = สถานะ "ขายได้"
//   - ช่องทาง: box = ดึงจาก "เห็นจากช่องทาง" · stk = ดึงจากชื่อลูกค้า
//   - ลูกค้าเก่า: "เห็นจากช่องทาง" มีคำว่า "ลูกค้าเก่า"
//   - COGS / adSpend = 0 ชั่วคราว
// ─────────────────────────────────────────────────────────────

import { SHEET_API_URL } from "../config/dataSource.js";
import { MONTHS } from "../config/constants.js";

const toNum = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/[, ฿\-]/g, "").trim());
  return Number.isFinite(n) ? n : 0;
};

// เดือนเลข 1-12 → ชื่อย่อไทย
const monthFromNumber = (n) => MONTHS[n - 1] || "";

// "5/2026" หรือ "2/2026" → { month: "พ.ค.", year: 2026 }
const parseMonthYear = (str) => {
  const s = String(str || "").trim();
  const m = s.match(/(\d{1,2})\s*\/\s*(\d{4})/);
  if (!m) return { month: "", year: 0 };
  return { month: monthFromNumber(Number(m[1])), year: Number(m[2]) };
};

// ดึงคำช่องทางจากข้อความ "เห็นจากช่องทาง" (เช่น "ลูกค้าเก่า/Line@", "Shopee/Line@")
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

// ── normalize tab "กล่อง" ──
function normalizeBox(row, idx) {
  const seenChannel = row["เห็นจากช่องทาง"] ?? "";
  const boxType = String(row["ประเภทกล่อง"] ?? "").trim(); // "STD" / "Custom"
  const actual = toNum(row["ยอดขายจริง"]);
  const quoted = toNum(row["ยอดขายเสนอ"]);
  const isClosed = actual > 0; // มีเลขใน ยอดขายจริง = ปิดได้

  const sku = boxType.toLowerCase() === "custom" ? "กล่อง Custom" : "กล่อง STD";

  return {
    id: `box-${idx}`,
    year: toNum(row["ปี"]),
    month: monthFromNumber(toNum(row["เดือน"])),
    day: toNum(row["วัน"]),
    sku,
    channel: parseChannel(seenChannel),
    customerName: String(row["ชื่อลูกค้า"] ?? "").trim() || "ไม่ระบุ",
    customerType: /ลูกค้าเก่า/.test(String(seenChannel)) ? "เก่า" : "ใหม่",
    quotedRevenue: quoted,
    revenue: isClosed ? actual : 0,
    orders: isClosed ? 1 : 0,
    qaCount: 1, // 1 row = 1 inquiry/QA
    customers: isClosed ? 1 : 0,
    cogs: 0,
    adSpend: 0,
  };
}

// ── normalize tab "เสนอราคา stk" ──
function normalizeStk(row, idx) {
  const { month, year } = parseMonthYear(row["เดือน/ปี"] ?? row["สำหรับ Key ข้อมูล/เดือน/ปี"]);
  const status = String(row["สถานะ"] ?? "").trim();
  const amount = toNum(row["ยอดเงิน"]);
  const isClosed = status === "ขายได้";
  const customerName = String(row["ลูกค้า"] ?? "").trim();

  return {
    id: `stk-${idx}`,
    year,
    month,
    day: toNum(String(row["วันที่"] ?? "").split("-")[0]), // "4-มี.ค." → 4
    sku: "สติกเกอร์",
    channel: parseChannel(customerName),
    customerName: customerName || "ไม่ระบุ",
    customerType: "ใหม่", // tab stk ไม่มีข้อมูลเก่า/ใหม่
    quotedRevenue: amount,
    revenue: isClosed ? amount : 0,
    orders: isClosed ? 1 : 0,
    qaCount: 1,
    customers: isClosed ? 1 : 0,
    cogs: 0,
    adSpend: 0,
  };
}

// ดึง + รวม 2 tab
export async function fetchRows() {
  if (!SHEET_API_URL) {
    throw new Error("ยังไม่ได้ตั้งค่า SHEET_API_URL — ดู README / src/config/dataSource.js");
  }

  const url = `${SHEET_API_URL}?t=${Date.now()}`;
  const res = await fetch(url, { method: "GET", redirect: "follow" });
  if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);

  const data = await res.json();
  if (data.error) throw new Error(`Apps Script error: ${data.error}`);

  const box = (data.box || []).map(normalizeBox);
  const stk = (data.stk || []).map(normalizeStk);

  // กรองแถวที่ไม่มีเดือน/ปี ออก (แถวขยะ)
  return [...box, ...stk].filter((r) => r.month && r.year);
}
