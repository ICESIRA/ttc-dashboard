// ─────────────────────────────────────────────────────────────
// format.js — ฟังก์ชัน format ตัวเลข + helper (pure functions)
// หน่วยย่อเป็นภาษาไทย: พัน / ล้าน · ไม่มีสัญลักษณ์ ฿
// ─────────────────────────────────────────────────────────────

import { MONTHS } from "../config/constants.js";

// รวมค่าใน array ตาม key
export const sum = (arr, key) => arr.reduce((a, r) => a + (r[key] || 0), 0);

// ── หน่วยย่อภาษาไทย: พัน / หมื่น / แสน / ล้าน ตามจริง ──
// คืน { num, unit } : ตัวเลข + ชื่อหน่วย (สำหรับ render แยกขนาด)
// ตั้งแต่ล้านขึ้นไปใช้ "ล้าน" ต่อเนื่อง (เช่น 58,000,000 → 58.0 ล้าน)
const thaiScale = (n) => {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  if (a >= 1e6) return { num: (v / 1e6).toFixed(2), unit: "ล้าน" };
  if (a >= 1e5) return { num: (v / 1e5).toFixed(2), unit: "แสน" };
  if (a >= 1e4) return { num: (v / 1e4).toFixed(2), unit: "หมื่น" };
  if (a >= 1e3) return { num: (v / 1e3).toFixed(1), unit: "พัน" };
  return { num: String(Math.round(v)), unit: "" };
};

// ย่อตัวเลขเป็น string เดียว เช่น "5.80 หมื่น" / "58.95 ล้าน" / "567"
export const fmt = (n) => {
  const { num, unit } = thaiScale(n);
  return unit ? `${num} ${unit}` : num;
};

// แยกเป็น { num, unit } เพื่อให้ render หน่วยด้วยฟอนต์เล็กลงได้
//   unitWord = คำต่อท้ายหน่วย เช่น "บาท" / "ครั้ง" (ใส่ "" ได้ถ้าไม่ต้องการ)
//   เช่น fmtParts(58951614,"บาท") → { num:"58.95", unit:"ล้านบาท" }
//        fmtParts(3400,"ครั้ง")    → { num:"3.4",   unit:"พันครั้ง" }
//        fmtParts(567,"บาท")       → { num:"567",   unit:"บาท" }
export const fmtParts = (n, unitWord = "") => {
  const { num, unit } = thaiScale(n);
  return { num, unit: unit ? `${unit}${unitWord}` : unitWord };
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
