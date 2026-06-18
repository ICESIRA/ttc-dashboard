// ──────────────────────────────────────────────────────────────
// daterange.js — ระบบกรองตาม "ช่วงวันที่" (date range) + trend + เทียบช่วงก่อนหน้า
//
// row มี { year, month(ไทยย่อ), day } · เราแปลงเป็นเลข YYYYMMDD เพื่อเทียบเร็ว
// ──────────────────────────────────────────────────────────────

import { MONTHS, monthIndex } from "../config/constants.js";
import { sum } from "./format.js";

// ── helper วันที่ ──

// แปลง row → เลข YYYYMMDD (day ที่หาย/เป็น 0 → ถือเป็นวันที่ 1 ของเดือน)
export const rowDateInt = (r) => {
  const mi = monthIndex(r.month); // 0-11 (−1 ถ้าไม่เจอ)
  if (mi < 0) return 0;
  const d = r.day && r.day >= 1 ? r.day : 1;
  return r.year * 10000 + (mi + 1) * 100 + d;
};

// แปลง entry ad spend (year, month ไทย, day) → YYYYMMDD
const adDateInt = (a) => {
  const mi = monthIndex(a.month);
  if (mi < 0) return 0;
  const d = a.day && a.day >= 1 ? a.day : 1;
  return a.year * 10000 + (mi + 1) * 100 + d;
};

// JS Date → YYYYMMDD
export const dateToInt = (dt) =>
  dt.getFullYear() * 10000 + (dt.getMonth() + 1) * 100 + dt.getDate();

// YYYYMMDD → JS Date
export const intToDate = (n) =>
  new Date(Math.floor(n / 10000), Math.floor((n % 10000) / 100) - 1, n % 100);

// JS Date → "YYYY-MM-DD"
export const dateToISO = (dt) => {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// บวก/ลบวัน (คืน Date ใหม่)
export const addDays = (dt, n) => {
  const x = new Date(dt);
  x.setDate(x.getDate() + n);
  return x;
};

// จำนวนวันในช่วง (รวมปลายทั้งสอง)
export const spanDays = (start, end) =>
  Math.round((stripTime(end) - stripTime(start)) / 86400000) + 1;

const stripTime = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());

// วันล่าสุดที่มีข้อมูลจริง — fallback = วันนี้จริง
export function latestDataDate(rows) {
  let max = 0;
  for (const r of rows) {
    const n = rowDateInt(r);
    if (n > max) max = n;
  }
  return max ? intToDate(max) : stripTime(new Date());
}

// วันแรกสุดที่มีข้อมูล
export function earliestDataDate(rows) {
  let min = Infinity;
  for (const r of rows) {
    const n = rowDateInt(r);
    if (n && n < min) min = n;
  }
  return Number.isFinite(min) ? intToDate(min) : stripTime(new Date());
}

// ── presets ──
// คืน { start, end } เป็น Date
//   ช่วงที่อิง "วันนี้จริง" (thisMonth/thisWeek/thisYear + lastN) → ใช้ new Date()
//   ช่วงที่อิง "ข้อมูล" (all) → ใช้วันล่าสุดในข้อมูล
export function presetRange(id, rows) {
  const today = stripTime(new Date()); // วันนี้จริงตามปฏิทิน
  const end = today;
  switch (id) {
    case "thisMonth":
      // เดือนปัจจุบันจริง: วันที่ 1 ของเดือนนี้ → วันนี้
      return { start: new Date(today.getFullYear(), today.getMonth(), 1), end };
    case "last7":
      return { start: addDays(today, -6), end };
    case "last14":
      return { start: addDays(today, -13), end };
    case "last30":
      return { start: addDays(today, -29), end };
    case "thisWeek": {
      // สัปดาห์นี้ (เริ่มวันจันทร์) ถึงวันนี้
      const dow = (today.getDay() + 6) % 7; // จ.=0 ... อา.=6
      return { start: addDays(today, -dow), end };
    }
    case "lastWeek": {
      const dow = (today.getDay() + 6) % 7;
      const thisMon = addDays(today, -dow);
      return { start: addDays(thisMon, -7), end: addDays(thisMon, -1) };
    }
    case "last2w":
      return { start: addDays(today, -13), end };
    case "last4w":
      return { start: addDays(today, -27), end };
    case "thisYear":
      return { start: new Date(today.getFullYear(), 0, 1), end };
    case "all":
      // ทั้งหมด: ครอบตั้งแต่วันแรกที่มีข้อมูล → วันล่าสุดที่มีข้อมูล
      return { start: earliestDataDate(rows), end: latestDataDate(rows) };
    default:
      return { start: new Date(today.getFullYear(), today.getMonth(), 1), end };
  }
}

// ช่วงของ "ทั้งเดือน" (cap ปลายไม่ให้เกินวันนี้จริง ถ้าเป็นเดือนปัจจุบัน)
export function monthRange(year, monthThai, rows) {
  const mi = monthIndex(monthThai);
  const start = new Date(year, mi, 1);
  const lastDay = new Date(year, mi + 1, 0); // วันสุดท้ายของเดือน
  const today = stripTime(new Date());
  const end = dateToInt(lastDay) > dateToInt(today) ? today : lastDay;
  return { start, end: dateToInt(end) >= dateToInt(start) ? end : lastDay };
}

// รายการ (ปี, เดือน) ที่มีข้อมูลจริง เรียงใหม่→เก่า (สำหรับแท็บ "เดือน")
export function availableMonths(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    if (!r.month || !r.year) continue;
    const key = `${r.year}-${r.month}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ year: r.year, month: r.month, mi: monthIndex(r.month) });
  }
  return out.sort((a, b) => b.year - a.year || b.mi - a.mi);
}

// ── กรองตามช่วง ──
export function filterByRange(rows, start, end) {
  const s = dateToInt(start);
  const e = dateToInt(end);
  return rows.filter((r) => {
    const n = rowDateInt(r);
    return n >= s && n <= e;
  });
}

// ── จุดข้อมูล trend ──
const calcPoint = (rows, label, extra = {}) => {
  const quoted = sum(rows, "quotedRevenue");
  const revenue = sum(rows, "revenue");
  const orders = sum(rows, "orders");
  return {
    label,
    quoted,
    revenue,
    orders,
    qaCount: sum(rows, "qaCount"),
    gap: quoted - revenue,
    closeRate: quoted > 0 ? (revenue / quoted) * 100 : 0,
    avgOrderValue: orders > 0 ? Math.round(revenue / orders) : 0,
    ...extra,
  };
};

const MONTH_SHORT = (mi) => MONTHS[mi] || "";

// สร้าง trend ตามช่วง — เลือก granularity อัตโนมัติ
//   ≤ 92 วัน → รายวัน · มากกว่านั้น → รายเดือน
export function buildTrendRange(rows, start, end) {
  const days = spanDays(start, end);
  const inRange = filterByRange(rows, start, end);
  const fmtRange = `${dateToISO(start)} → ${dateToISO(end)}`;

  if (days <= 92) {
    // รายวัน — ไล่ทุกวันในช่วง
    const byInt = new Map();
    for (const r of inRange) {
      const n = rowDateInt(r);
      if (!byInt.has(n)) byInt.set(n, []);
      byInt.get(n).push(r);
    }
    const data = [];
    let cur = stripTime(start);
    const stop = stripTime(end);
    while (cur <= stop) {
      const n = dateToInt(cur);
      const label = `${cur.getDate()}/${cur.getMonth() + 1}`;
      data.push(calcPoint(byInt.get(n) || [], label, { key: n }));
      cur = addDays(cur, 1);
    }
    return { granularity: "day", data, title: fmtRange };
  }

  // รายเดือน — ไล่ทุกเดือนในช่วง
  const data = [];
  let y = start.getFullYear();
  let mi = start.getMonth();
  const endKey = end.getFullYear() * 12 + end.getMonth();
  const multiYear = start.getFullYear() !== end.getFullYear();
  while (y * 12 + mi <= endKey) {
    const monthThai = MONTH_SHORT(mi);
    const yy = String(y).slice(-2);
    const rs = inRange.filter((r) => r.year === y && r.month === monthThai);
    const label = multiYear ? `${monthThai} ${yy}` : monthThai;
    data.push(calcPoint(rs, label, { key: `${y}-${mi}` }));
    mi += 1;
    if (mi > 11) { mi = 0; y += 1; }
  }
  return { granularity: "month", data, title: fmtRange };
}

// ── เทียบช่วงก่อนหน้า (เท่าความยาวกัน ติดกับ start) ──
//   ใช้กับ delta ของการ์ด KPI
export function computeDeltaRange(rows, start, end) {
  const days = spanDays(start, end);
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(days - 1));

  const agg = (rs) => ({
    quoted: sum(rs, "quotedRevenue"),
    revenue: sum(rs, "revenue"),
    orders: sum(rs, "orders"),
    qaCount: sum(rs, "qaCount"),
  });
  const pct = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);

  const cur = agg(filterByRange(rows, start, end));
  const prev = agg(filterByRange(rows, prevStart, prevEnd));

  return {
    label: `เทียบ ${days} วันก่อนหน้า`,
    quoted: pct(cur.quoted, prev.quoted),
    revenue: pct(cur.revenue, prev.revenue),
    orders: pct(cur.orders, prev.orders),
    qaCount: pct(cur.qaCount, prev.qaCount),
  };
}

// ── รวม ad spend ในช่วง ──
export function adSpendForRange(adSpendDaily, start, end) {
  if (!adSpendDaily || !adSpendDaily.length) return 0;
  const s = dateToInt(start);
  const e = dateToInt(end);
  return adSpendDaily
    .filter((a) => {
      const n = adDateInt(a);
      return n >= s && n <= e;
    })
    .reduce((acc, a) => acc + (a.spend || 0), 0);
}
