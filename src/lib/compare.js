// ─────────────────────────────────────────────────────────────
// compare.js — ระบบ "โหมดเทียบ" 5 แบบ + สร้างข้อมูล trend
//
// โหมด:
//   daily  : เลือก 1 เดือน → ไล่รายวันในเดือนนั้น
//   m2/m3/m6 : เลือกหลายเดือน → เทียบเป็นราย "เดือน"
//   year   : เลือกหลายปี → เทียบเป็นราย "ปี"
//
// ทุกจุดมี quoted (ยอดเสนอ) + revenue (ยอดปิดได้) เพื่อเทียบในกราฟเดียว (ข้อ 7)
// ─────────────────────────────────────────────────────────────

import { MONTHS, DAYS_IN_MONTH } from "../config/constants.js";
import { sum } from "./format.js";

// นิยามโหมด — limit = จำนวนช่วงสูงสุดที่เลือกได้ (null = ไม่จำกัด)
export const COMPARE_MODES = [
  { id: "daily", label: "รายเดือน (ไล่รายวัน)", pick: "month", limit: 1 },
  { id: "m2", label: "เทียบ 2 เดือน", pick: "month", limit: 2 },
  { id: "m3", label: "เทียบ 3 เดือน", pick: "month", limit: 3 },
  { id: "m6", label: "เทียบ 6 เดือน", pick: "month", limit: 6 },
  { id: "year", label: "เทียบรายปี", pick: "year", limit: null },
];

export const getMode = (id) => COMPARE_MODES.find((m) => m.id === id) || COMPARE_MODES[0];

// คำนวณ metric ของกลุ่มแถว
const calcPoint = (rows, label, extra = {}) => {
  const quoted = sum(rows, "quotedRevenue");
  const revenue = sum(rows, "revenue");
  const orders = sum(rows, "orders");
  const qa = sum(rows, "qaCount");
  return {
    label,
    quoted,
    revenue,
    orders,
    qaCount: qa,
    gap: quoted - revenue, // ส่วนที่เสนอแต่ยังไม่ปิด
    closeRate: quoted > 0 ? (revenue / quoted) * 100 : 0,
    avgOrderValue: orders > 0 ? Math.round(revenue / orders) : 0,
    ...extra,
  };
};

// สร้างข้อมูล trend ตามโหมด + ช่วงที่เลือก
//   rows        = ข้อมูล (filter SKU/channel/customer แล้ว แต่ยังไม่ filter เดือน/ปี)
//   mode        = id โหมด
//   selMonths   = array ชื่อเดือนที่เลือก (โหมด month)
//   selYears    = array ปีที่เลือก (โหมด year)
//   activeYear  = ปีที่ใช้กรอง (โหมด month จะ filter เฉพาะปีนี้ ถ้ามี)
export function buildTrend(rows, mode, selMonths, selYears, activeYear) {
  const m = getMode(mode);

  if (m.id === "daily" && selMonths.length === 1) {
    const month = selMonths[0];
    const days = DAYS_IN_MONTH[month] || 31;
    const base = rows.filter(
      (r) => r.month === month && (!activeYear || r.year === activeYear)
    );
    const data = Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      return calcPoint(base.filter((r) => r.day === day), String(day), { key: day });
    });
    return { granularity: "day", data, title: `รายวัน · ${month} ${activeYear || ""}` };
  }

  if (m.pick === "year") {
    const years = selYears.length ? selYears : [...new Set(rows.map((r) => r.year))].sort();
    const data = years.map((y) =>
      calcPoint(rows.filter((r) => r.year === y), String(y), { key: y })
    );
    return { granularity: "year", data, title: "เทียบรายปี" };
  }

  // โหมดเดือน (m2/m3/m6) — แสดงเฉพาะเดือนที่เลือก เรียงตามปฏิทิน
  const months = MONTHS.filter((mm) => selMonths.includes(mm));
  const base = activeYear ? rows.filter((r) => r.year === activeYear) : rows;
  const data = months.map((mm) =>
    calcPoint(base.filter((r) => r.month === mm), mm, { key: mm, month: mm })
  );
  return { granularity: "month", data, title: m.label };
}

// สรุป KPI รวมของช่วงที่เลือก (ใช้กับการ์ด KPI)
export function filterByMode(rows, mode, selMonths, selYears, activeYear) {
  const m = getMode(mode);
  if (m.pick === "year") {
    if (!selYears.length) return rows;
    return rows.filter((r) => selYears.includes(r.year));
  }
  // month modes
  let out = rows;
  if (activeYear) out = out.filter((r) => r.year === activeYear);
  if (selMonths.length) out = out.filter((r) => selMonths.includes(r.month));
  return out;
}
