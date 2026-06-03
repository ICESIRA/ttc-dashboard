// ─────────────────────────────────────────────────────────────
// Dashboard.jsx — ตัว orchestrate: ถือ filter state + วาง layout
// logic การคำนวณอยู่ใน lib/analytics.js · UI อยู่ใน components/*
// ─────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import { ACCENT } from "../config/constants.js";
import {
  computeKPIs, computeCompare, computeSkuData, computeTrend,
  computeChannelData, computeTopCustomers, computeCustomerMix, computeTopChannels,
} from "../lib/analytics.js";
import { fmtB, fmtNum, fmtDec, pctChange } from "../lib/format.js";

import Header from "./Header.jsx";
import FilterBar from "./FilterBar.jsx";
import KPICard from "./kpi/KPICard.jsx";
import SkuBarChart from "./charts/SkuBarChart.jsx";
import CustomerMixDonut from "./charts/CustomerMixDonut.jsx";
import TrendPanel from "./charts/TrendPanel.jsx";
import TopCustomerTable from "./tables/TopCustomerTable.jsx";
import ChannelCards from "./tables/ChannelCards.jsx";
import SkuTable from "./tables/SkuTable.jsx";
import SkuChannelHeatmap from "./tables/SkuChannelHeatmap.jsx";

export default function Dashboard({ rows, theme, onToggleTheme, error, lastUpdated, onRefresh }) {
  // ─── filter state ───
  const [activeSku, setActiveSku] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [activeYear, setActiveYear] = useState(null);
  const [activeMonths, setActiveMonths] = useState([]);
  const [prevMonthsSnapshot, setPrevMonthsSnapshot] = useState(null);
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const [visibleChannels, setVisibleChannels] = useState(() => computeTopChannels(rows));

  // ─── filter helpers ───
  const toggle = (val, setter, cur) => setter(cur === val ? null : val);
  const isMonthActive = (m) => activeMonths.includes(m);

  const toggleMonth = (m) => {
    setPrevMonthsSnapshot(null);
    setActiveMonths((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };
  const changeYear = (y) => {
    setPrevMonthsSnapshot(null);
    if (activeYear === y) { setActiveYear(null); setActiveMonths([]); }
    else { setActiveYear(y); setActiveMonths([]); }
  };
  const drillToMonth = (m) => {
    if (activeMonths.length === 1 && activeMonths[0] === m && prevMonthsSnapshot) {
      setActiveMonths(prevMonthsSnapshot); setPrevMonthsSnapshot(null); return;
    }
    setPrevMonthsSnapshot(activeMonths); setActiveMonths([m]);
  };
  const toggleVisibleChannel = (ch) => {
    setVisibleChannels((prev) => {
      if (prev.includes(ch)) return prev.length <= 1 ? prev : prev.filter((x) => x !== ch);
      return prev.length >= 4 ? prev : [...prev, ch];
    });
  };
  const clearAllFilters = () => {
    setActiveSku(null); setActiveChannel(null); setActiveCustomer(null);
    setActiveYear(null); setActiveMonths([]);
  };

  // ─── filtered rows ───
  const filtered = useMemo(() => rows.filter((r) =>
    (!activeSku || r.sku === activeSku) &&
    (!activeChannel || r.channel === activeChannel) &&
    (!activeCustomer || r.customerType === activeCustomer) &&
    (activeMonths.length === 0 || activeMonths.includes(r.month)) &&
    (!activeYear || r.year === activeYear)
  ), [rows, activeSku, activeChannel, activeCustomer, activeMonths, activeYear]);

  // ─── derived data (จาก analytics.js) ───
  const kpi = useMemo(() => computeKPIs(filtered), [filtered]);
  const compare = useMemo(
    () => computeCompare(rows, activeMonths, { year: activeYear, sku: activeSku, channel: activeChannel, customer: activeCustomer }),
    [rows, activeMonths, activeYear, activeSku, activeChannel, activeCustomer]
  );
  const skuData = useMemo(() => computeSkuData(filtered), [filtered]);
  const trend = useMemo(() => computeTrend(filtered, activeMonths), [filtered, activeMonths]);
  const channelData = useMemo(() => computeChannelData(filtered), [filtered]);
  const topCustomers = useMemo(() => computeTopCustomers(filtered), [filtered]);
  const customerMix = useMemo(() => computeCustomerMix(filtered), [filtered]);

  const makeDelta = (key) => {
    if (!compare) return null;
    return { pct: pctChange(compare.b[key], compare.a[key]), label: `${compare.baseA} vs ${compare.baseB}` };
  };

  const handleTrendClick = (e) => {
    if (trend.isDailyMode) { drillToMonth(activeMonths[0]); return; }
    if (e && e.activeLabel) drillToMonth(e.activeLabel);
  };
  const handleHeatmapCell = (sku, ch, isActiveCell) => {
    if (isActiveCell) { setActiveSku(null); setActiveChannel(null); }
    else { setActiveSku(sku); setActiveChannel(ch); }
  };

  const monthsAreDefault = activeYear === null && activeMonths.length === 0;
  const hasFilter = activeSku || activeChannel || activeCustomer || !monthsAreDefault;

  return (
    <div style={{ background: "var(--bg-page)", minHeight: "100vh", padding: "20px 24px", fontFamily: "'DM Sans', sans-serif", color: "var(--text-primary)" }}>
      <Header
        filteredCount={filtered.length} totalCount={rows.length} hasFilter={hasFilter}
        theme={theme} error={error} lastUpdated={lastUpdated}
        onToggleTheme={onToggleTheme} onClearFilters={clearAllFilters} onRefresh={onRefresh}
      />

      <FilterBar
        activeMonths={activeMonths} activeYear={activeYear} showAllMonths={showAllMonths}
        onToggleMonth={toggleMonth} onChangeYear={changeYear} onToggleShowAll={() => setShowAllMonths((s) => !s)}
      />

      {/* KPI label */}
      <div style={{ marginBottom: 8, fontSize: 11, color: "var(--text-faint)" }}>
        KPI ของช่วงที่เลือก · {activeMonths.length > 0 ? activeMonths.join(", ") : "ทุกเดือน"} {activeYear || "(ทุกปี)"}
        {compare && <span style={{ marginLeft: 12, color: ACCENT, fontWeight: 600 }}>· เปรียบเทียบ: {compare.baseA} → {compare.baseB}</span>}
      </div>

      {/* KPI row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 10 }}>
        <KPICard label="ยอดขายเสนอ" value={fmtB(kpi.quoted)} sub="Pipeline / Quote ทั้งหมด" color="var(--text-muted)" delta={makeDelta("quoted")} />
        <KPICard label="ยอดขาย (ปิดได้)" value={fmtB(kpi.revenue)} sub={kpi.cogs > 0 ? `Margin ${fmtDec(kpi.margin, 1)}% · กำไรขั้นต้น ${fmtB(kpi.grossProfit)}` : null} color={ACCENT} delta={makeDelta("revenue")} />
        <KPICard label="AOV" value={fmtB(kpi.aov)} sub="ค่าเฉลี่ยต่อออเดอร์" color="#10b981" delta={makeDelta("aov")} />
        <KPICard label="เฉลี่ย 1 คนซื้อ" value={`${fmtDec(kpi.avgPurchase, 2)} ครั้ง`} sub={`${fmtNum(kpi.customers)} ลูกค้า · ${fmtNum(kpi.orders)} ออเดอร์`} color="#a78bfa" delta={makeDelta("avgPurchase")} />
      </div>

      {/* KPI row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
        <KPICard label="Count QA" value={fmtNum(kpi.qaCount)} sub="Lead / Inquiry ทั้งหมด" color="var(--text-dim)" delta={makeDelta("qaCount")} />
        <KPICard label="Total Orders" value={fmtNum(kpi.orders)} sub="ออเดอร์ที่ปิดได้" color="#3b82f6" delta={makeDelta("orders")} />
        <KPICard label="% Close Rate" value={`${fmtDec(kpi.closeRate, 2)}%`} sub={`${fmtNum(kpi.orders)} ÷ ${fmtNum(kpi.qaCount)} QA`} color={kpi.closeRate > 25 ? "#10b981" : kpi.closeRate > 15 ? "#f59e0b" : "#f87171"} delta={makeDelta("closeRate")} />
        <KPICard label="ต้นทุนสินค้า" value={fmtB(kpi.cogs)} sub={kpi.cogs > 0 && kpi.revenue > 0 ? `COGS · ${fmtDec((kpi.cogs / kpi.revenue) * 100, 1)}% ของยอดขาย` : null} color="#f87171" delta={makeDelta("cogs")} />
      </div>

      {/* main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
          <SkuBarChart skuData={skuData} activeSku={activeSku} onToggleSku={(s) => toggle(s, setActiveSku, activeSku)} />
          <CustomerMixDonut mixData={customerMix} activeCustomer={activeCustomer} onToggleCustomer={(c) => toggle(c, setActiveCustomer, activeCustomer)} />
          <TopCustomerTable topCustomers={topCustomers} allFiltered={filtered} />
        </div>
        <TrendPanel trend={trend} activeMonths={activeMonths} activeYear={activeYear} isMonthActive={isMonthActive} onTrendClick={handleTrendClick} />
      </div>

      {/* channel + sku table */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16, marginBottom: 16 }}>
        <ChannelCards
          channelData={channelData} visibleChannels={visibleChannels} activeChannel={activeChannel} showPicker={showChannelPicker}
          onToggleChannel={(ch) => toggle(ch, setActiveChannel, activeChannel)}
          onTogglePicker={() => setShowChannelPicker((s) => !s)} onToggleVisible={toggleVisibleChannel}
        />
        <SkuTable skuData={skuData} activeSku={activeSku} onToggleSku={(s) => toggle(s, setActiveSku, activeSku)} />
      </div>

      {/* heatmap */}
      <SkuChannelHeatmap
        rows={filtered} activeSku={activeSku} activeChannel={activeChannel}
        onToggleSku={(s) => toggle(s, setActiveSku, activeSku)} onSetCell={handleHeatmapCell}
      />
    </div>
  );
}
