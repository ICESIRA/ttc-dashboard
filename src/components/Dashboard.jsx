// ─────────────────────────────────────────────────────────────
// Dashboard.jsx — orchestrate: ถือ state (filter + โหมดเทียบ) + layout
// โหมดเทียบ 5 แบบจัดการที่นี่ · logic อยู่ใน lib/compare.js + analytics.js
// ─────────────────────────────────────────────────────────────

import { useState, useMemo, useEffect } from "react";
import { ACCENT, MONTHS, getYearsFromRows } from "../config/constants.js";
import {
  computeKPIs, computeSkuData, computeChannelData,
  computeTopCustomers, computeCustomerMix, computeTopChannels,
} from "../lib/analytics.js";
import { buildTrend, filterByMode, getMode, computeDelta } from "../lib/compare.js";
import { fmtB, fmtNum, fmtDec } from "../lib/format.js";

import Header from "./Header.jsx";
import CompareControl from "./CompareControl.jsx";
import KPICard from "./kpi/KPICard.jsx";
import OfferVsSalesPanel from "./charts/OfferVsSalesPanel.jsx";
import SkuBarChart from "./charts/SkuBarChart.jsx";
import CustomerMixDonut from "./charts/CustomerMixDonut.jsx";
import TopCustomerTable from "./tables/TopCustomerTable.jsx";
import ChannelCards from "./tables/ChannelCards.jsx";
import SkuTable from "./tables/SkuTable.jsx";
import SkuChannelHeatmap from "./tables/SkuChannelHeatmap.jsx";

export default function Dashboard({ rows, theme, onToggleTheme, error, lastUpdated, onRefresh }) {
  // ─── filter state (SKU / channel / customer) ───
  const [activeSku, setActiveSku] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const [visibleChannels, setVisibleChannels] = useState(() => computeTopChannels(rows));

  // ─── compare-mode state ───
  const [mode, setMode] = useState("year");
  const [selMonths, setSelMonths] = useState([]);
  const [selYears, setSelYears] = useState([]);
  const [startMonth, setStartMonth] = useState(null);
  const [activeYear, setActiveYear] = useState(null);
  const [didInit, setDidInit] = useState(false);

  const availableYears = useMemo(() => getYearsFromRows(rows), [rows]);

  // ตั้งค่าเริ่มต้นครั้งแรกที่ข้อมูลมา — ปีล่าสุด + 3 เดือนล่าสุดที่มีข้อมูล
  useEffect(() => {
    if (didInit || rows.length === 0) return;
    const ys = getYearsFromRows(rows);
    const latestYear = ys[ys.length - 1]; // ปีล่าสุดที่มีข้อมูล (= 2026)
    // ค่าเริ่มต้น: โหมดเทียบรายปี เลือกปีล่าสุดไว้
    setSelYears([latestYear]);
    setActiveYear(latestYear);
    const monthsInYear = MONTHS.filter((mm) => rows.some((r) => r.year === latestYear && r.month === mm));
    setStartMonth(monthsInYear[monthsInYear.length - 1] || null); // เผื่อสลับโหมด lookback
    setDidInit(true);
  }, [rows, didInit]);

  const toggle = (val, setter, cur) => setter(cur === val ? null : val);
  const m = getMode(mode);

  const changeMode = (newMode) => {
    setMode(newMode);
    // ไม่ล้าง selYears/startMonth เพื่อคงบริบทเดิมเท่าที่ทำได้
    if (getMode(newMode).pick === "month") setSelMonths([]);
  };
  const toggleMonth = (mm) => {
    setSelMonths((prev) => {
      if (prev.includes(mm)) return prev.filter((x) => x !== mm);
      if (m.limit && prev.length >= m.limit) return prev;
      return [...prev, mm];
    });
  };
  const toggleYear = (y) => {
    setSelYears((prev) => (prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y]));
  };
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

  // rows หลัง filter เวลา (ตามโหมด) — ใช้กับ KPI + ตาราง
  const filtered = useMemo(
    () => filterByMode(filteredBase, mode, selMonths, selYears, activeYear, startMonth),
    [filteredBase, mode, selMonths, selYears, activeYear, startMonth]
  );

  const kpi = useMemo(() => computeKPIs(filtered), [filtered]);
  const trend = useMemo(
    () => buildTrend(filteredBase, mode, selMonths, selYears, activeYear, startMonth),
    [filteredBase, mode, selMonths, selYears, activeYear, startMonth]
  );
  const skuData = useMemo(() => computeSkuData(filtered), [filtered]);
  const channelData = useMemo(() => computeChannelData(filtered), [filtered]);
  const topCustomers = useMemo(() => computeTopCustomers(filtered), [filtered]);
  const customerMix = useMemo(() => computeCustomerMix(filtered), [filtered]);
  const delta = useMemo(
    () => computeDelta(filteredBase, mode, selMonths, selYears, activeYear, startMonth),
    [filteredBase, mode, selMonths, selYears, activeYear, startMonth]
  );
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

      <CompareControl
        mode={mode} selMonths={selMonths} selYears={selYears} startMonth={startMonth} activeYear={activeYear}
        availableYears={availableYears}
        onChangeMode={changeMode} onToggleMonth={toggleMonth} onToggleYear={toggleYear}
        onSetStartMonth={setStartMonth} onChangeActiveYear={setActiveYear}
      />

      {/* KPI row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
        <KPICard label="ยอดขายเสนอ" value={fmtB(kpi.quoted)} sub="Pipeline / Quote ทั้งหมด" color="var(--text-muted)" delta={d("quoted")} />
        <KPICard label="ยอดขาย (ปิดได้)" value={fmtB(kpi.revenue)} sub={`อัตราปิด ${fmtDec(closeOfQuote, 1)}% ของยอดเสนอ`} color={ACCENT} delta={d("revenue")} />
        <KPICard label="AOV" value={fmtB(kpi.aov)} sub="ค่าเฉลี่ยต่อออเดอร์" color="#10b981" />
        <KPICard label="เฉลี่ย 1 คนซื้อ" value={`${fmtDec(kpi.avgPurchase, 2)} ครั้ง`} sub={`${fmtNum(kpi.customers)} ลูกค้า · ${fmtNum(kpi.orders)} ออเดอร์`} color="#a78bfa" />
      </div>

      {/* KPI row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <KPICard label="Count QA" value={fmtNum(kpi.qaCount)} sub="Lead / Inquiry ทั้งหมด" color="var(--text-dim)" delta={d("qaCount")} />
        <KPICard label="Total Orders" value={fmtNum(kpi.orders)} sub="ออเดอร์ที่ปิดได้" color="#3b82f6" delta={d("orders")} />
        <KPICard label="% Close Rate (จาก QA)" value={`${fmtDec(kpi.closeRate, 1)}%`} sub={`${fmtNum(kpi.orders)} ÷ ${fmtNum(kpi.qaCount)} QA`} color={kpi.closeRate > 25 ? "#10b981" : kpi.closeRate > 15 ? "#f59e0b" : "#f87171"} />
        <KPICard label="ส่วนต่าง (เสนอ−ปิด)" value={fmtB(kpi.quoted - kpi.revenue)} sub="ยอดที่เสนอแต่ยังไม่ปิด" color="#f59e0b" />
      </div>

      {/* ยอดเสนอ vs ยอดขาย (ข้อ 7) */}
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
    </div>
  );
}
