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

// นิยามโหมด:
//   daily   : เลือก 1 เดือน → ไล่รายวัน
//   months  : เทียบเดือน (เลือกอิสระหลายเดือน)
//   look3/6 : เลือกเดือน "เริ่ม" 1 เดือน → ระบบไล่ย้อนหลัง 3/6 เดือน
//   year    : เทียบรายปี
export const COMPARE_MODES = [
  { id: "daily", label: "รายเดือน (ไล่รายวัน)", pick: "month", limit: 1 },
  { id: "months", label: "เทียบเดือน", pick: "month", limit: null },
  { id: "look3", label: "เทียบ 3 เดือน (ย้อนหลัง)", pick: "startMonth", lookback: 3 },
  { id: "look6", label: "เทียบ 6 เดือน (ย้อนหลัง)", pick: "startMonth", lookback: 6 },
  { id: "year", label: "เทียบรายปี", pick: "year", limit: null },
];

export const getMode = (id) => COMPARE_MODES.find((m) => m.id === id) || COMPARE_MODES[0];

// คืนรายชื่อเดือนย้อนหลัง n เดือน นับจาก startMonth (รวม startMonth)
// เช่น start=มิ.ย., n=3 → [เม.ย., พ.ค., มิ.ย.]
export function lookbackMonths(startMonth, n) {
  const idx = MONTHS.indexOf(startMonth);
  if (idx < 0) return [];
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const j = idx - i;
    if (j >= 0) out.push(MONTHS[j]);
  }
  return out;
}

// คืนรายชื่อเดือนที่ใช้จริงตามโหมด (รวม logic lookback)
export function resolveMonths(mode, selMonths, startMonth) {
  const m = getMode(mode);
  if (m.pick === "startMonth") return lookbackMonths(startMonth, m.lookback);
  return selMonths;
}

// คำนวณ metric ของกลุ่มแถว
const calcPoint = (rows, label, extra = {}) => {
  const quoted = sum(rows, "quotedRevenue");
  const revenue = sum(rows, "revenue");
  const orders = sum(rows, "orders");
  const qa = sum(rows, "qaCount");
  const adSpend = sum(rows, "adSpend");
  return {
    label,
    quoted,
    revenue,
    orders,
    qaCount: qa,
    adSpend,
    roas: adSpend > 0 ? revenue / adSpend : 0,
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
export function buildTrend(rows, mode, selMonths, selYears, activeYear, startMonth) {
  const m = getMode(mode);
  const months = resolveMonths(mode, selMonths, startMonth); // รวม lookback แล้ว

  if (m.id === "daily" && months.length === 1) {
    const month = months[0];
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

  // โหมดเดือน — แสดงเฉพาะเดือนที่ resolve ได้ เรียงตามปฏิทิน
  const ordered = MONTHS.filter((mm) => months.includes(mm));
  const base = activeYear ? rows.filter((r) => r.year === activeYear) : rows;
  const data = ordered.map((mm) =>
    calcPoint(base.filter((r) => r.month === mm), mm, { key: mm, month: mm })
  );
  return { granularity: "month", data, title: m.label };
}

// สรุป KPI รวมของช่วงที่เลือก (ใช้กับการ์ด KPI)
export function filterByMode(rows, mode, selMonths, selYears, activeYear, startMonth) {
  const m = getMode(mode);
  if (m.pick === "year") {
    if (!selYears.length) return rows;
    return rows.filter((r) => selYears.includes(r.year));
  }
  const months = resolveMonths(mode, selMonths, startMonth);
  let out = rows;
  if (activeYear) out = out.filter((r) => r.year === activeYear);
  if (months.length) out = out.filter((r) => months.includes(r.month));
  return out;
}

// ─────────────────────────────────────────────────────────────
// computeDelta — หา % เทียบกับ "ช่วงก่อนหน้า" สำหรับการ์ด KPI (ข้อ 4)
// year   : เทียบปีที่เลือกล่าสุด vs ปีก่อนหน้านั้น
// month  : เทียบเดือนล่าสุดในชุด vs เดือนก่อนหน้า (เดือนเดียว)
// daily  : ไม่เทียบ (คืน null)
// คืน object { quoted, revenue, orders, qaCount } โดยแต่ละค่าเป็น %change | null
// ─────────────────────────────────────────────────────────────
export function computeDelta(rows, mode, selMonths, selYears, activeYear, startMonth) {
  const m = getMode(mode);
  const pct = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);
  const agg = (rs) => ({
    quoted: sum(rs, "quotedRevenue"),
    revenue: sum(rs, "revenue"),
    orders: sum(rs, "orders"),
    qaCount: sum(rs, "qaCount"),
    adSpend: sum(rs, "adSpend"),
  });
  const makeDelta = (curRs, prevRs, label) => {
    const c = agg(curRs), p = agg(prevRs);
    return {
      label,
      quoted: pct(c.quoted, p.quoted),
      revenue: pct(c.revenue, p.revenue),
      orders: pct(c.orders, p.orders),
      qaCount: pct(c.qaCount, p.qaCount),
      adSpend: pct(c.adSpend, p.adSpend),
    };
  };

  if (m.pick === "year") {
    const years = (selYears.length ? selYears : [...new Set(rows.map((r) => r.year))]).sort();
    if (years.length < 1) return null;
    const cur = years[years.length - 1];
    const prev = cur - 1;
    return makeDelta(
      rows.filter((r) => r.year === cur),
      rows.filter((r) => r.year === prev),
      `${cur} เทียบ ${prev}`
    );
  }

  if (m.id === "daily") return null;

  // month modes — เดือนล่าสุดในชุด vs เดือนก่อนหน้า
  const months = resolveMonths(mode, selMonths, startMonth);
  const ordered = MONTHS.filter((mm) => months.includes(mm));
  if (ordered.length < 1) return null;
  const curMonth = ordered[ordered.length - 1];
  const curIdx = MONTHS.indexOf(curMonth);
  const prevMonth = curIdx > 0 ? MONTHS[curIdx - 1] : null;
  const base = activeYear ? rows.filter((r) => r.year === activeYear) : rows;
  return makeDelta(
    base.filter((r) => r.month === curMonth),
    prevMonth ? base.filter((r) => r.month === prevMonth) : [],
    prevMonth ? `${curMonth} เทียบ ${prevMonth}` : curMonth
  );
}

// ─────────────────────────────────────────────────────────────
// adSpendUtils — รวม ad spend (dataset แยก) ตามช่วงเวลา
// adSpendDaily: [{ year, month(ไทย), day, spend }]
// ─────────────────────────────────────────────────────────────

// รวม ad spend ตาม filter เวลาเดียวกับ filterByMode
export function adSpendForPeriod(adSpendDaily, mode, selMonths, selYears, activeYear, startMonth) {
  if (!adSpendDaily || !adSpendDaily.length) return 0;
  const m = getMode(mode);
  if (m.pick === "year") {
    if (!selYears.length) return adSpendDaily.reduce((a, d) => a + d.spend, 0);
    return adSpendDaily.filter((d) => selYears.includes(d.year)).reduce((a, d) => a + d.spend, 0);
  }
  const months = resolveMonths(mode, selMonths, startMonth);
  return adSpendDaily.filter((d) =>
    (!activeYear || d.year === activeYear) &&
    (months.length === 0 || months.includes(d.month))
  ).reduce((a, d) => a + d.spend, 0);
}

// สร้าง map ad spend ต่อ "จุด" ใน trend (วัน/เดือน/ปี) เพื่อใส่ลงกราฟ
export function adSpendByPoint(adSpendDaily, granularity, activeYear) {
  const map = {};
  (adSpendDaily || []).forEach((d) => {
    let key;
    if (granularity === "day") {
      if (activeYear && d.year !== activeYear) return;
      key = String(d.day);
    } else if (granularity === "year") {
      key = String(d.year);
    } else {
      if (activeYear && d.year !== activeYear) return;
      key = d.month;
    }
    map[key] = (map[key] || 0) + d.spend;
  });
  return map;
}
