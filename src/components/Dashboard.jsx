// ──────────────────────────────────────────────────────────────
// Dashboard.jsx — orchestrate: ถือ state (filter + ช่วงวันที่) + layout
// ช่วงวันที่คุมทั้ง dashboard (KPI / กราฟ / ตาราง) ผ่าน lib/daterange.js
//
// หมายเหตุ: ขนาดปกติ — การขยายทั้งหน้าทำที่ App.jsx (zoom) จุดเดียว
// ──────────────────────────────────────────────────────────────

import { useState, useMemo, useEffect } from "react";
import { ACCENT } from "../config/constants.js";
import {
  computeKPIs, computeSkuData, computeChannelData,
  computeTopCustomers, computeCustomerMix, computeTopChannels,
} from "../lib/analytics.js";
import {
  presetRange, filterByRange, buildTrendRange, computeDeltaRange, adSpendForRange,
} from "../lib/daterange.js";
import { fmtB, fmtNum, fmtDec, fmtParts, sum } from "../lib/format.js";

import Header from "./Header.jsx";
import DateRangePicker from "./DateRangePicker.jsx";
import KPICard from "./kpi/KPICard.jsx";
import OfferVsSalesPanel from "./charts/OfferVsSalesPanel.jsx";
import SkuBarChart from "./charts/SkuBarChart.jsx";
import CustomerMixDonut from "./charts/CustomerMixDonut.jsx";
import TopCustomerTable from "./tables/TopCustomerTable.jsx";
import ChannelCards from "./tables/ChannelCards.jsx";
import SkuTable from "./tables/SkuTable.jsx";
import SkuChannelHeatmap from "./tables/SkuChannelHeatmap.jsx";
import MetaAdsReport from "./MetaAdsReport.jsx";
import { useMetaData } from "../data/useMetaData.js";

export default function Dashboard({ rows, adSpendDaily, theme, onToggleTheme, error, lastUpdated, onRefresh }) {
  // ดึงค่าแอด Meta จริง (ไว้โชว์ในการ์ด Ad Spend เสริมจาก sheet)
  const { data: metaData } = useMetaData();
  const metaSpend = metaData && metaData.kpi ? metaData.kpi.spend : 0;
  // ─── filter state (SKU / channel / customer) ───
  const [activeSku, setActiveSku] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const [visibleChannels, setVisibleChannels] = useState(() => computeTopChannels(rows));

  // ─── date-range state ───
  const [range, setRange] = useState(null); // { start, end } (Date)
  const [compareRange, setCompareRange] = useState(null); // { start, end } ช่วงเทียบกำหนดเอง (null = อัตโนมัติ)
  const [didInit, setDidInit] = useState(false);

  // ตั้งค่าเริ่มต้นครั้งแรกที่ข้อมูลมา — "เดือนนี้" (อิงวันนี้จริง)
  useEffect(() => {
    if (didInit || rows.length === 0) return;
    setRange(presetRange("thisMonth", rows));
    setDidInit(true);
  }, [rows, didInit]);

  const toggle = (val, setter, cur) => setter(cur === val ? null : val);

  const toggleVisibleChannel = (ch) => {
    setVisibleChannels((prev) => {
      if (prev.includes(ch)) return prev.length <= 1 ? prev : prev.filter((x) => x !== ch);
      return prev.length >= 4 ? prev : [...prev, ch];
    });
  };
  const clearAllFilters = () => {
    setActiveSku(null); setActiveChannel(null); setActiveCustomer(null);
  };

  // rows หลัง filter SKU/channel/customer (ยังไม่ filter เวลา)
  const filteredBase = useMemo(() => rows.filter((r) =>
    (!activeSku || r.sku === activeSku) &&
    (!activeChannel || r.channel === activeChannel) &&
    (!activeCustomer || r.customerType === activeCustomer)
  ), [rows, activeSku, activeChannel, activeCustomer]);

  // rows หลัง filter ช่วงวันที่ — ใช้กับ KPI + ตาราง
  const filtered = useMemo(
    () => (range ? filterByRange(filteredBase, range.start, range.end) : filteredBase),
    [filteredBase, range]
  );

  const periodAdSpend = useMemo(
    () => (range ? adSpendForRange(adSpendDaily, range.start, range.end) : 0),
    [adSpendDaily, range]
  );
  const kpi = useMemo(() => {
    const k = computeKPIs(filtered);
    // ใช้ค่าแอดจาก sheet ก่อน ถ้าไม่มี (=0) ใช้ค่าแอดจริงจาก Meta
    const adSpend = periodAdSpend > 0 ? periodAdSpend : metaSpend;
    k.adSpend = adSpend;
    k.adSpendSource = periodAdSpend > 0 ? "sheet" : (metaSpend > 0 ? "meta" : "none");
    k.roas = adSpend > 0 ? k.revenue / adSpend : 0;
    return k;
  }, [filtered, periodAdSpend, metaSpend]);
  const trend = useMemo(
    () => (range ? buildTrendRange(filteredBase, range.start, range.end) : { data: [], title: "", granularity: "day" }),
    [filteredBase, range]
  );
  const skuData = useMemo(() => computeSkuData(filtered), [filtered]);
  const channelData = useMemo(() => computeChannelData(filtered), [filtered]);
  const topCustomers = useMemo(() => computeTopCustomers(filtered), [filtered]);
  const customerMix = useMemo(() => computeCustomerMix(filtered), [filtered]);
  const delta = useMemo(() => {
    if (!range) return null;
    // ถ้ากำหนดช่วงเทียบเอง → คำนวณ % เทียบช่วงนั้น, ไม่งั้นใช้ช่วงก่อนหน้าอัตโนมัติ
    if (compareRange) {
      const agg = (rs) => ({
        quoted: sum(rs, "quotedRevenue"), revenue: sum(rs, "revenue"),
        orders: sum(rs, "orders"), qaCount: sum(rs, "qaCount"),
      });
      const pct = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);
      const cur = agg(filterByRange(filteredBase, range.start, range.end));
      const prev = agg(filterByRange(filteredBase, compareRange.start, compareRange.end));
      return {
        label: `เทียบช่วงที่เลือก`,
        quoted: pct(cur.quoted, prev.quoted), revenue: pct(cur.revenue, prev.revenue),
        orders: pct(cur.orders, prev.orders), qaCount: pct(cur.qaCount, prev.qaCount),
      };
    }
    return computeDeltaRange(filteredBase, range.start, range.end);
  }, [filteredBase, range, compareRange]);
  const d = (key) => (delta ? { pct: delta[key], label: delta.label } : null);

  const handleHeatmapCell = (sku, ch, isActiveCell) => {
    if (isActiveCell) { setActiveSku(null); setActiveChannel(null); }
    else { setActiveSku(sku); setActiveChannel(ch); }
  };

  const hasFilter = activeSku || activeChannel || activeCustomer;
  const closeOfQuote = kpi.quoted > 0 ? (kpi.revenue / kpi.quoted) * 100 : 0;

  return (
    <div style={{ background: "var(--bg-page)", minHeight: "100vh", padding: "24px 28px", fontFamily: "'IBM Plex Sans Thai', sans-serif", color: "var(--text-primary)" }}>
      <Header
        filteredCount={filtered.length} totalCount={rows.length} hasFilter={hasFilter}
        theme={theme} error={error} lastUpdated={lastUpdated}
        onToggleTheme={onToggleTheme} onClearFilters={clearAllFilters} onRefresh={onRefresh}
      />

      {range && (
        <DateRangePicker
          start={range.start} end={range.end}
          compareStart={compareRange && compareRange.start}
          compareEnd={compareRange && compareRange.end}
          rows={rows}
          onChange={(start, end, cmpStart, cmpEnd) => {
            setRange({ start, end });
            setCompareRange(cmpStart && cmpEnd ? { start: cmpStart, end: cmpEnd } : null);
          }}
        />
      )}

      {/* KPI row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
        <KPICard label="ยอดขายเสนอ" value={fmtParts(kpi.quoted, "บาท")} sub="Pipeline / Quote ทั้งหมด" color="var(--text-muted)" delta={d("quoted")} />
        <KPICard label="ยอดขาย (ปิดได้)" value={fmtParts(kpi.revenue, "บาท")} sub={`อัตราปิด ${fmtDec(closeOfQuote, 1)}% ของยอดเสนอ`} color={ACCENT} delta={d("revenue")} />
        <KPICard label="AOV" value={fmtParts(kpi.aov, "บาท")} sub="ค่าเฉลี่ยต่อออเดอร์" color="#10b981" />
        <KPICard label="เฉลี่ย 1 คนซื้อ" value={{ num: fmtDec(kpi.avgPurchase, 2), unit: "ครั้ง/คน" }} sub={`${fmtNum(kpi.customers)} ลูกค้า · ${fmtNum(kpi.orders)} ออเดอร์`} color="#a78bfa" />
      </div>

      {/* KPI row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <KPICard label="Count QA" value={fmtParts(kpi.qaCount, "")} sub="Lead / Inquiry ทั้งหมด" color="var(--text-dim)" delta={d("qaCount")} />
        <KPICard label="Total Orders" value={fmtParts(kpi.orders, "")} sub="ออเดอร์ที่ปิดได้" color="#3b82f6" delta={d("orders")} />
        <KPICard label="% Close Rate (จาก QA)" value={`${fmtDec(kpi.closeRate, 1)}%`} sub={`${fmtNum(kpi.orders)} ÷ ${fmtNum(kpi.qaCount)} QA`} color={kpi.closeRate > 25 ? "#10b981" : kpi.closeRate > 15 ? "#f59e0b" : "#f87171"} />
        <KPICard label="ค่าโฆษณา (Ad Spend)" value={fmtParts(kpi.adSpend, "บาท")} sub={kpi.adSpend > 0 ? (kpi.adSpendSource === "meta" ? `ค่าแอดจริงจาก Meta · ROAS ${fmtDec(kpi.roas, 2)}x` : `ROAS ${fmtDec(kpi.roas, 2)}x · ยอดขาย ÷ ค่าแอด`) : "ยังไม่มีข้อมูลค่าแอดในช่วงนี้"} color="#fb923c" />
      </div>

      {/* ยอดเสนอ vs ยอดขาย */}
      <div style={{ marginBottom: 20 }}>
        <OfferVsSalesPanel trend={trend} />
      </div>

      {/* SKU bar + customer mix + top customers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <SkuBarChart skuData={skuData} activeSku={activeSku} onToggleSku={(s) => toggle(s, setActiveSku, activeSku)} />
          <CustomerMixDonut mixData={customerMix} activeCustomer={activeCustomer} onToggleCustomer={(c) => toggle(c, setActiveCustomer, activeCustomer)} />
        </div>
        <TopCustomerTable topCustomers={topCustomers} allFiltered={filtered} />
      </div>

      {/* channel + sku table */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 18, marginBottom: 18 }}>
        <ChannelCards
          channelData={channelData} visibleChannels={visibleChannels} activeChannel={activeChannel} showPicker={showChannelPicker}
          onToggleChannel={(ch) => toggle(ch, setActiveChannel, activeChannel)}
          onTogglePicker={() => setShowChannelPicker((s) => !s)} onToggleVisible={toggleVisibleChannel}
        />
        <SkuTable skuData={skuData} activeSku={activeSku} onToggleSku={(s) => toggle(s, setActiveSku, activeSku)} />
      </div>

      <SkuChannelHeatmap
        rows={filtered} activeSku={activeSku} activeChannel={activeChannel}
        onToggleSku={(s) => toggle(s, setActiveSku, activeSku)} onSetCell={handleHeatmapCell}
      />

      {/* รายงานผลโฆษณา Meta (TTC Ad Account) */}
      <MetaAdsReport />
    </div>
  );
}
