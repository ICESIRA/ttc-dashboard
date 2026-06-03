// ─────────────────────────────────────────────────────────────
// analytics.js — คำนวณ metric/aggregation ทั้งหมด (pure functions)
// แยกออกจาก UI เพื่อให้ test ได้ และ component บางลง
// รับ rows (ที่ filter แล้ว) → คืนชุดข้อมูลพร้อม render
// ─────────────────────────────────────────────────────────────

import {
  SKUS, CHANNELS, MONTHS, DAYS_IN_MONTH,
} from "../config/constants.js";
import { sum } from "./format.js";

// ─── KPI หลัก ───────────────────────────────────────────────
export function computeKPIs(rows) {
  const quoted = sum(rows, "quotedRevenue");
  const revenue = sum(rows, "revenue");
  const orders = sum(rows, "orders");
  const qaCount = sum(rows, "qaCount");
  const customers = sum(rows, "customers");
  const cogs = sum(rows, "cogs");
  const grossProfit = revenue - cogs;

  return {
    quoted, revenue, orders, qaCount, customers, cogs, grossProfit,
    aov: orders > 0 ? revenue / orders : 0,
    avgPurchase: customers > 0 ? orders / customers : 0,
    closeRate: qaCount > 0 ? (orders / qaCount) * 100 : 0,
    margin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
  };
}

// ─── เปรียบเทียบ 2 เดือน base ───────────────────────────────
// allRows = ข้อมูลทั้งหมด (ไม่ filter เดือน) + filter อื่น ๆ ที่ active
export function computeCompare(allRows, activeMonths, filters) {
  if (activeMonths.length < 2) return null;
  const [baseA, baseB] = activeMonths;

  const filterRows = (m) =>
    allRows.filter(
      (r) =>
        r.month === m &&
        (!filters.year || r.year === filters.year) &&
        (!filters.sku || r.sku === filters.sku) &&
        (!filters.channel || r.channel === filters.channel) &&
        (!filters.customer || r.customerType === filters.customer)
    );

  const calc = (rs) => computeKPIs(rs);
  return { baseA, baseB, a: calc(filterRows(baseA)), b: calc(filterRows(baseB)) };
}

// ─── ตาราง/กราฟ SKU (เรียงตามกำไรขั้นต้น) ──────────────────
export function computeSkuData(rows) {
  return SKUS.map((sku) => {
    const rs = rows.filter((r) => r.sku === sku);
    const rev = sum(rs, "revenue");
    const ord = sum(rs, "orders");
    const cogs = sum(rs, "cogs");
    const grossP = rev - cogs;
    const marginPct = rev > 0 ? ((grossP / rev) * 100).toFixed(1) : 0;
    return { sku, rev, ord, cogs, grossP, marginPct };
  }).sort((a, b) => b.grossP - a.grossP);
}

// ─── เทรน รายเดือน vs รายวัน ────────────────────────────────
export function computeTrend(rows, activeMonths) {
  const isDailyMode = activeMonths.length === 1;

  if (isDailyMode) {
    const onlyMonth = activeMonths[0];
    const days = DAYS_IN_MONTH[onlyMonth] || 31;
    const data = Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      const rs = rows.filter((r) => r.day === day);
      const rev = sum(rs, "revenue");
      const ord = sum(rs, "orders");
      const ad = sum(rs, "adSpend");
      return {
        label: String(day),
        revenue: rev,
        grossProfit: rev - sum(rs, "cogs"),
        avgOrderValue: ord > 0 ? Math.round(rev / ord) : 0,
        roas: ad > 0 ? rev / ad : 0,
        adSpend: ad,
      };
    });
    return { isDailyMode, data };
  }

  const monthsToShow =
    activeMonths.length > 0 ? MONTHS.filter((m) => activeMonths.includes(m)) : MONTHS;
  const data = monthsToShow.map((m) => {
    const rs = rows.filter((r) => r.month === m);
    const rev = sum(rs, "revenue");
    const ord = sum(rs, "orders");
    const ad = sum(rs, "adSpend");
    return {
      label: m, month: m,
      revenue: rev,
      grossProfit: rev - sum(rs, "cogs"),
      avgOrderValue: ord > 0 ? Math.round(rev / ord) : 0,
      roas: ad > 0 ? rev / ad : 0,
      adSpend: ad,
    };
  });
  return { isDailyMode, data };
}

// ─── ช่องทางขาย (เรียงตามยอดขาย) ────────────────────────────
export function computeChannelData(rows) {
  return CHANNELS.map((ch) => {
    const rs = rows.filter((r) => r.channel === ch);
    return { channel: ch, revenue: sum(rs, "revenue"), orders: sum(rs, "orders") };
  }).sort((a, b) => b.revenue - a.revenue);
}

// ─── ลูกค้า Top 10 ──────────────────────────────────────────
export function computeTopCustomers(rows, limit = 10) {
  const map = new Map();
  rows.forEach((r) => {
    const cur = map.get(r.customerName) || { revenue: 0, orders: 0 };
    cur.revenue += r.revenue;
    cur.orders += r.orders;
    map.set(r.customerName, cur);
  });
  return Array.from(map.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// ─── สัดส่วนลูกค้าใหม่ vs เก่า ───────────────────────────────
export function computeCustomerMix(rows) {
  const newRev = sum(rows.filter((r) => r.customerType === "ใหม่"), "revenue");
  const oldRev = sum(rows.filter((r) => r.customerType === "เก่า"), "revenue");
  return [
    { name: "ใหม่", value: newRev, color: "#3b82f6" },
    { name: "เก่า", value: oldRev, color: "#f59e0b" },
  ];
}

// ─── default visible channels (top 4 by revenue) ────────────
export function computeTopChannels(allRows, n = 4) {
  return CHANNELS.map((ch) => ({
    channel: ch,
    revenue: allRows.filter((r) => r.channel === ch).reduce((a, r) => a + r.revenue, 0),
  }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, n)
    .map((x) => x.channel);
}
