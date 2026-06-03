// ─────────────────────────────────────────────────────────────
// TrendPanel.jsx — เทรน 4 ชั้น: ยอดขาย / AOV / ROAS / Ad Spend
// monthly mode: คลิกจุด → drill ลงรายวัน · daily mode: คลิก → กลับ
// ─────────────────────────────────────────────────────────────

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LabelList, CartesianGrid,
} from "recharts";
import { ACCENT } from "../../config/constants.js";
import { fmt, fmtB } from "../../lib/format.js";
import { tooltipProps, cardStyle } from "../ui.js";

// dot ที่โตขึ้นเมื่อ active
const makeDot = (color, baseR, activeR, isActive) => ({ cx, cy, payload, index }) => (
  <circle key={index} cx={cx} cy={cy}
    r={isActive(payload) ? activeR : baseR} fill={color}
    stroke={isActive(payload) ? "#fff" : "none"} strokeWidth={2} />
);

function PanelHeader({ color, label, dashed }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
      <div style={{ width: 10, height: 2, background: color, borderTop: dashed ? `2px dashed ${color}` : "none" }} />
      <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

const Divider = () => <div style={{ height: 1, background: "var(--bg-chip)", margin: "4px 0 8px 0" }} />;

export default function TrendPanel({ trend, activeMonths, activeYear, isMonthActive, onTrendClick }) {
  const { isDailyMode, data } = trend;
  const isActive = (payload) => (isDailyMode ? false : isMonthActive(payload.month));
  const labelFmt = (l) => (isDailyMode ? `วันที่ ${l}` : l);

  const lineDefaults = {
    margin: { top: 28, right: 16, left: 8, bottom: 0 },
    onClick: onTrendClick,
    style: { cursor: "pointer" },
  };

  return (
    <div style={{ ...cardStyle, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 4 }}>
        {isDailyMode ? `เทรนรายวัน · ${activeMonths[0]} ${activeYear || ""}` : "เทรนรายเดือน"}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 10 }}>
        {isDailyMode ? "ยอดขายรวม + AOV · คลิกในกราฟเพื่อกลับสู่รายเดือน"
          : "ยอดขายรวม + AOV + ROAS · คลิกจุดเพื่อ drill ดูรายวัน · คลิกซ้ำเพื่อกลับ"}
      </div>

      {/* ยอดขายรวม */}
      <PanelHeader color={ACCENT} label="ยอดขายรวม" />
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} {...lineDefaults}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="label" tick={false} axisLine={false} tickLine={false} height={0} padding={{ left: 32, right: 16 }} />
          <YAxis tick={{ fill: "var(--border-default)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} width={42} />
          <Tooltip {...tooltipProps} formatter={(v) => [fmtB(v), "ยอดขายรวม"]} labelFormatter={labelFmt} />
          <Line type="monotone" dataKey="revenue" stroke={ACCENT} strokeWidth={2.5} dot={makeDot(ACCENT, 4, 6, isActive)}>
            {!isDailyMode && <LabelList dataKey="revenue" position="top" formatter={(v) => fmtB(v)}
              style={{ fill: "var(--text-body)", fontSize: 16, fontFamily: "'Space Mono', monospace", fontWeight: 700 }} />}
          </Line>
        </LineChart>
      </ResponsiveContainer>

      <Divider />

      {/* AOV */}
      <PanelHeader color="#10b981" label="ยอดขายเฉลี่ย/ออเดอร์ (AOV)" dashed />
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} {...lineDefaults}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="label" tick={false} axisLine={false} tickLine={false} height={0} padding={{ left: 32, right: 16 }} />
          <YAxis tick={{ fill: "var(--border-default)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} width={42} />
          <Tooltip {...tooltipProps} formatter={(v) => [fmtB(v), "AOV"]} labelFormatter={labelFmt} />
          <Line type="monotone" dataKey="avgOrderValue" stroke="#10b981" strokeWidth={2} strokeDasharray="4 3" dot={makeDot("#10b981", 3, 5, isActive)}>
            {!isDailyMode && <LabelList dataKey="avgOrderValue" position="top" formatter={(v) => fmtB(v)}
              style={{ fill: "#10b981", fontSize: 16, fontFamily: "'Space Mono', monospace", fontWeight: 700 }} />}
          </Line>
        </LineChart>
      </ResponsiveContainer>

      <Divider />

      {/* ROAS — ซ่อนตอน daily (ad spend อยู่ระดับเดือน) */}
      {!isDailyMode && (
        <>
          <PanelHeader color="#ec4899" label="ROAS (Return on Ad Spend)" />
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data} {...lineDefaults}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="label" tick={false} axisLine={false} tickLine={false} height={0} padding={{ left: 32, right: 16 }} />
              <YAxis tick={{ fill: "var(--border-default)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(1)}x`} width={42} />
              <Tooltip {...tooltipProps} formatter={(v) => [`${v.toFixed(2)}x`, "ROAS"]} labelFormatter={labelFmt} />
              <Line type="monotone" dataKey="roas" stroke="#ec4899" strokeWidth={2} dot={makeDot("#ec4899", 3, 5, isActive)}>
                <LabelList dataKey="roas" position="top" formatter={(v) => `${v.toFixed(2)}x`}
                  style={{ fill: "#ec4899", fontSize: 16, fontFamily: "'Space Mono', monospace", fontWeight: 700 }} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
          <Divider />
        </>
      )}

      {/* Ad Spend (bar) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 160 }}>
        <PanelHeader color="#fb923c" label="ค่าใช้จ่ายโฆษณา (Ad Spend)" />
        <div style={{ flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} {...lineDefaults}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--text-dim)", fontSize: 13 }} axisLine={false} tickLine={false}
                interval={isDailyMode ? "preserveStartEnd" : 0} />
              <YAxis tick={{ fill: "var(--border-default)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} width={42} />
              <Tooltip {...tooltipProps} formatter={(v) => [fmtB(v), "Ad Spend"]} labelFormatter={labelFmt} />
              <Bar dataKey="adSpend" radius={[4, 4, 0, 0]}>
                {data.map((d, i) => (
                  <Cell key={i}
                    fill={isDailyMode || isMonthActive(d.month) ? "#fb923c" : "var(--bg-chip)"}
                    stroke={!isDailyMode && isMonthActive(d.month) ? "#fff" : "none"} strokeWidth={2} />
                ))}
                {!isDailyMode && <LabelList dataKey="adSpend" position="top" formatter={(v) => fmtB(v)}
                  style={{ fill: "var(--text-body)", fontSize: 14, fontFamily: "'Space Mono', monospace", fontWeight: 400 }} />}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
