// ────────────────────────────────────────────────────────────────
// format.js — ฟังก์ชันช่วย format ตัวเลข + helper (pure functions)
// ทุกค่าเงิน/จำนวน = จำนวนเต็ม มี comma คั่นหลักพัน (ไม่มีทศนิยม)
// ────────────────────────────────────────────────────────────────

import { MONTHS } from "../config/constants.js";

// รวมค่าใน array ตาม key
export const sum = (arr, key) => arr.reduce((a, r) => a + (r[key] || 0), 0);

// ── ตัวเลขจำนวนเต็ม มี comma — ใช้เป็นค่ามาตรฐานทั้ง dashboard ──
//   เช่น 58951614 → "58,951,614" / 3400 → "3,400" / 567 → "567"
export const fmtNum = (n) =>
  (Number(n) || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

// fmt = จำนวนเต็มมี comma (เดิมเคยย่อเป็น พัน/หมื่น/ล้าน — ตอนนี้ใช้เต็มหมด)
export const fmt = (n) => fmtNum(n);

// แยกเป็น { num, unit } เพื่อให้ render หน่วยด้วยฟอนต์เล็กลงได้
//   num = ตัวเลขเต็มมี comma, unit = คำต่อท้าย เช่น "บาท"
//   เช่น fmtParts(58951614,"บาท") → { num:"58,951,614", unit:"บาท" }
export const fmtParts = (n, unitWord = "") => ({
  num: fmtNum(n),
  unit: unitWord,
});

// เดิมเติม ฿ — ตอนนี้ไม่เติมแล้ว (เก็บชื่อ fmtB ไว้ให้โค้ดเดิมเรียกได้)
export const fmtB = (n) => fmtNum(n);

// ตัวเลขทศนิยม d ตำแหน่ง — ใช้เฉพาะ ROAS (เช่น 2.35x)
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
