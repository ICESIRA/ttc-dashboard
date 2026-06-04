// ─────────────────────────────────────────────────────────────
// format.js — ฟังก์ชัน format ตัวเลข + helper (pure functions)
// หน่วยย่อเป็นภาษาไทย: พัน / ล้าน · ไม่มีสัญลักษณ์ ฿
// ─────────────────────────────────────────────────────────────

import { MONTHS } from "../config/constants.js";

// รวมค่าใน array ตาม key
export const sum = (arr, key) => arr.reduce((a, r) => a + (r[key] || 0), 0);

// ย่อตัวเลขเป็นไทย: 1.2 ล้าน / 58.9 ล้าน / 3.4 พัน / 567
export const fmt = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(2)} ล้าน`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)} พัน`;
  return String(Math.round(v));
};

// แยกเป็น { num, unit } เพื่อให้ render หน่วยด้วยฟอนต์เล็กลงได้
//   unitWord = คำต่อท้ายหน่วย เช่น "บาท" / "ครั้ง" (ใส่ "" ได้ถ้าไม่ต้องการ)
//   เช่น fmtParts(58951614,"บาท") → { num:"58.95", unit:"ล้านบาท" }
//        fmtParts(3400,"ครั้ง")    → { num:"3.4",   unit:"พันครั้ง" }
//        fmtParts(567,"บาท")       → { num:"567",   unit:"บาท" }
export const fmtParts = (n, unitWord = "") => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e6) return { num: (v / 1e6).toFixed(2), unit: `ล้าน${unitWord}` };
  if (Math.abs(v) >= 1e3) return { num: (v / 1e3).toFixed(1), unit: `พัน${unitWord}` };
  return { num: String(Math.round(v)), unit: unitWord };
};

// เดิมเติม ฿ — ตอนนี้ไม่เติมแล้ว (เก็บชื่อ fmtB ไว้ให้โค้ดเดิมเรียกได้)
export const fmtB = (n) => fmt(n);

// ตัวเลขเต็ม มี comma
export const fmtNum = (n) =>
  (Number(n) || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

// ทศนิยม d ตำแหน่ง
export const fmtDec = (n, d = 2) =>
  (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

// % change ระหว่าง cur กับ prev
export const pctChange = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : 0);

// คืน n เดือนล่าสุดของปีที่กำหนด (ใช้ default month chips)
export function getLatestMonthsForYear(year, currentYear, n = 3) {
  const monthIndex = year === currentYear ? new Date().getMonth() : MONTHS.length - 1;
  const result = [];
  for (let i = 0; i < n; i++) {
    const idx = monthIndex - i;
    if (idx >= 0) result.unshift(MONTHS[idx]);
  }
  return result;
}
