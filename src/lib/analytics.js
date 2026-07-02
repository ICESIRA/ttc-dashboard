// ──────────────────────────────────────────────────────────────
// analytics.js — คำนวณ metric/aggregation ทั้งหมด (pure functions)
// แยกออกจาก UI เพื่อให้ test ได้ และ component บางลง
// รับ rows (ที่ filter แล้ว) → คืนชุดข้อมูลพร้อม render
//
// หมายเหตุ: ลบ computeCompare / computeTrend ออกแล้ว (dead code)
//   Dashboard ใช้ระบบ date-range ใน lib/daterange.js แทน
// ──────────────────────────────────────────────────────────────

import { SKUS, CHANNELS } from "../config/constants.js";
import { sum } from "./format.js";

// ─── KPI หลัก ───
export function computeKPIs(rows) {
  const quoted = sum(rows, "quotedRevenue");
  const revenue = sum(rows, "revenue");
  const orders = sum(rows, "orders");
  const qaCount = sum(rows, "qaCount");
  const customers = sum(rows, "customers");
  const cogs = sum(rows, "cogs");
  const adSpend = sum(rows, "adSpend");
  const grossProfit = revenue - cogs;

  return {
    quoted, revenue, orders, qaCount, customers, cogs, grossProfit, adSpend,
    aov: orders > 0 ? revenue / orders : 0,
    avgPurchase: customers > 0 ? orders / customers : 0,
    closeRate: qaCount > 0 ? (orders / qaCount) * 100 : 0,
    margin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
    roas: adSpend > 0 ? revenue / adSpend : 0,
  };
}

// ─── ตาราง/กราฟ SKU (เรียงตามกำไรขั้นต้น) ───
export function computeSkuData(rows) {
  return SKUS.map((sku) => {
    const rs = rows.filter((r) => r.sku === sku);
    const rev = sum(rs, "revenue");
    const quoted = sum(rs, "quotedRevenue");
    const ord = sum(rs, "orders");
    const cogs = sum(rs, "cogs");
    const grossP = rev - cogs;
    const marginPct = rev > 0 ? ((grossP / rev) * 100).toFixed(1) : 0;
    const closeRate = quoted > 0 ? (rev / quoted) * 100 : 0;
    return { sku, rev, quoted, ord, cogs, grossP, marginPct, closeRate };
  }).sort((a, b) => b.rev - a.rev);
}

// ─── ช่องทางขาย (เรียงตามยอดขาย) ───
export function computeChannelData(rows) {
  return CHANNELS.map((ch) => {
    const rs = rows.filter((r) => r.channel === ch);
    return { channel: ch, revenue: sum(rs, "revenue"), orders: sum(rs, "orders") };
  }).sort((a, b) => b.revenue - a.revenue);
}

// ─── ลูกค้า Top 10 ───
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

// ─── New vs Returning customer mix ───
export function computeCustomerMix(rows) {
  const newRev = sum(rows.filter((r) => r.customerType === "New"), "revenue");
  const oldRev = sum(rows.filter((r) => r.customerType === "Returning"), "revenue");
  return [
    { name: "New", value: newRev, color: "#3b82f6" },
    { name: "Returning", value: oldRev, color: "#f59e0b" },
  ];
}

// ─── default visible channels (top 4 by revenue) ───
export function computeTopChannels(allRows, n = 4) {
  return CHANNELS.map((ch) => ({
    channel: ch,
    revenue: allRows.filter((r) => r.channel === ch).reduce((a, r) => a + r.revenue, 0),
  }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, n)
    .map((x) => x.channel);
}
