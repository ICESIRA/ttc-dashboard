// ─────────────────────────────────────────────────────────────
// format.js — ฟังก์ชัน format ตัวเลข/เงิน + helper เล็ก ๆ
// pure functions ทั้งหมด (ไม่มี side effect) — test ง่าย
// ─────────────────────────────────────────────────────────────

import { MONTHS, CURRENT_YEAR } from "../config/constants.js";

// รวมค่าใน array ตาม key
export const sum = (arr, key) => arr.reduce((a, r) => a + (r[key] || 0), 0);

// ย่อตัวเลข: 1.2M / 3.4K / 567
export const fmt = (n) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(2)}M`
  : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K`
  : String(Math.round(n));

// เติมสัญลักษณ์เงินบาท
export const fmtB = (n) => `฿${fmt(n)}`;

// ตัวเลขเต็ม มี comma
export const fmtNum = (n) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 0 });

// ทศนิยม d ตำแหน่ง
export const fmtDec = (n, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

// % change ระหว่าง cur กับ prev
export const pctChange = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : 0);

// คืน n เดือนล่าสุดของปีที่กำหนด (สำหรับ default month chips)
export function getLatestMonthsForYear(year, n = 3) {
  // ปีปัจจุบัน → อิงเดือนปัจจุบันจริง, ปีอื่น → 3 เดือนสุดท้ายของปี
  const monthIndex =
    year === CURRENT_YEAR ? new Date().getMonth() : MONTHS.length - 1;
  const result = [];
  for (let i = 0; i < n; i++) {
    const idx = monthIndex - i;
    if (idx >= 0) result.unshift(MONTHS[idx]);
  }
  return result;
}
