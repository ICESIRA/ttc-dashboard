// ─────────────────────────────────────────────────────────────
// MetaAdsReport.jsx — รายงานผลโฆษณา Meta (TTC Ad Account)
// snapshot ข้อมูลจริง · KPI + เทรนด์รายวัน + สัดส่วนงบ + ต้นทุน/ข้อความ + ตารางแคมเปญ
// ─────────────────────────────────────────────────────────────

import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, PieChart, Pie, Cell, BarChart, LabelList,
} from "recharts";
import { ACCENT } from "../config/constants.js";
import { fmt, fmtNum, fmtDec, fmtParts } from "../lib/format.js";
import { tooltipProps, cardStyle } from "./ui.js";
import { META_SNAPSHOT } from "../data/metaAdsSnapshot.js";

import KPICard from "./kpi/KPICard.jsx";

const PIE_COLORS = ["#2f6bff", "#7c5cff", "#0bb5c9", "#d99514", "#e06fae", "#16a34a"];

// ตัดชื่อแคมเปญให้สั้นลงสำหรับแกน/ตาราง (ตัด prefix รหัสวันที่ออก)
const shortName = (n) =>
  n.replace(/^\d{6}_?/, "").replace(/_/g, " ").replace(/TTC|TCC/i, "").replace(/MSG/i, "").trim() || n;

export default function MetaAdsReport({ data = META_SNAPSHOT }) {
  const { meta, campaigns, daily } = data;

  // ── รวมยอด ──
  const t = campaigns.reduce(
    (a, c) => ({
      spend: a.spend + c.spend, reach: a.reach + c.reach, impressions: a.impressions + c.impressions,
      clicks: a.clicks + c.clicks, results: a.results + c.results,
    }),
    { spend: 0, reach: 0, impressions: 0, clicks: 0, results: 0 }
  );
  const costPerMsg = t.results > 0 ? t.spend / t.results : 0;
  const ctr = t.impressions > 0 ? (t.clicks / t.impressions) * 100 : 0;
  const cpc = t.clicks > 0 ? t.spend / t.clicks : 0;
  const cpm = t.impressions > 0 ? (t.spend / t.impressions) * 1000 : 0;

  const pieData = campaigns.map((c) => ({ name: shortName(c.name), value: Math.round(c.spend) }));
  const costData = [...campaigns]
    .map((c) => ({ name: shortName(c.name), cost: Math.round(c.costPerResult) }))
    .sort((a, b) => a.cost - b.cost);
  const dailyData = daily.map((d) => ({ ...d, label: String(d.day) }));

  return (
    <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ── หัวเซ็กชัน ── */}
      <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 13, color: "#2f6bff", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>
            META ADS · รายงานผลโฆษณา
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-heading)", marginTop: 2 }}>{meta.account}</div>
          <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>
            {meta.dateStart} → {meta.dateStop} · สกุลเงิน {meta.currency}
          </div>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20,
          background: meta.source === "live" ? "#e7f6ec" : "#fbf2e0",
          color: meta.source === "live" ? "#16a34a" : "#b8860b", fontSize: 13, fontWeight: 600,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.source === "live" ? "#16a34a" : "#d99514", display: "inline-block" }} />
          {meta.source === "live" ? "ข้อมูลสด" : `snapshot · ดึง ${meta.pulledAt}`}
        </div>
      </div>

      {/* ── KPI แถว 1 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KPICard label="งบที่ใช้ (Spend)" value={fmtParts(t.spend, "บาท")} sub={`${campaigns.length} แคมเปญที่กำลังรัน`} color="#d99514" />
        <KPICard label="เริ่มแชท (ข้อความ)" value={{ num: fmtNum(t.results), unit: "ข้อความ" }} sub="Messaging conversations" color="#7c5cff" />
        <KPICard label="ต้นทุน/ข้อความ" value={{ num: fmtDec(costPerMsg, 2), unit: "บาท" }} sub="ยิ่งต่ำยิ่งคุ้ม" color={ACCENT} />
        <KPICard label="การเข้าถึง (Reach)" value={{ num: fmtNum(t.reach), unit: "" }} sub="รวมทุกแคมเปญ" color="#0bb5c9" />
      </div>

      {/* ── KPI แถว 2 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KPICard label="Impressions" value={{ num: fmtNum(t.impressions), unit: "" }} sub="จำนวนการแสดงผล" color="var(--text-dim)" />
        <KPICard label="Clicks" value={{ num: fmtNum(t.clicks), unit: "" }} sub="คลิกทั้งหมด" color="#3b82f6" />
        <KPICard label="CTR เฉลี่ย" value={`${fmtDec(ctr, 2)}%`} sub={`CPC ${fmtDec(cpc, 2)} บาท`} color={ctr > 1.5 ? "#10b981" : "#f59e0b"} />
        <KPICard label="CPM เฉลี่ย" value={{ num: fmtDec(cpm, 0), unit: "บาท" }} sub="ต่อ 1,000 การแสดงผล" color="#fb923c" />
      </div>

      {/* ── เทรนด์รายวัน ── */}
      <div style={cardStyle}>
        <div style={{ fontSize: 16, color: "var(--text-dim)", fontWeight: 600 }}>เทรนด์รายวัน · งบ vs คลิก</div>
        <div style={{ fontSize: 13, color: "var(--text-faint)", marginBottom: 10 }}>เส้น = งบที่ใช้ (บาท) · แท่ง = จำนวนคลิก</div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={dailyData} margin={{ top: 16, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "var(--text-dim)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: "var(--text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={52} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip {...tooltipProps}
              formatter={(v, n) => (n === "spend" ? [`${fmtNum(v)} บาท`, "งบที่ใช้"] : [fmtNum(v), "คลิก"])} />
            <Legend formatter={(v) => (v === "spend" ? "งบที่ใช้ (บาท)" : "คลิก")} wrapperStyle={{ fontSize: 13 }} />
            <Bar yAxisId="right" dataKey="clicks" fill={ACCENT + "66"} radius={[3, 3, 0, 0]} maxBarSize={26} />
            <Line yAxisId="left" type="monotone" dataKey="spend" stroke="#d99514" strokeWidth={2.5} dot={{ r: 2, fill: "#d99514" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── สัดส่วนงบ + ต้นทุน/ข้อความ ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 16, color: "var(--text-dim)", fontWeight: 600 }}>สัดส่วนงบตามแคมเปญ</div>
          <div style={{ fontSize: 13, color: "var(--text-faint)", marginBottom: 6 }}>งบไปลงที่แคมเปญไหนมากสุด</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={88} paddingAngle={2}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="var(--bg-card)" strokeWidth={2} />)}
              </Pie>
              <Tooltip {...tooltipProps} formatter={(v) => [`${fmtNum(v)} บาท`, "งบ"]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 16, color: "var(--text-dim)", fontWeight: 600 }}>ต้นทุนต่อข้อความ (รายแคมเปญ)</div>
          <div style={{ fontSize: 13, color: "var(--text-faint)", marginBottom: 6 }}>เตี้ย = คุ้มสุด · สูง = แพงสุด</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={costData} layout="vertical" margin={{ top: 8, right: 40, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "var(--text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
              <YAxis type="category" dataKey="name" tick={{ fill: "var(--text-dim)", fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip {...tooltipProps} formatter={(v) => [`${fmtDec(v, 0)} บาท`, "ต้นทุน/ข้อความ"]} />
              <Bar dataKey="cost" fill={ACCENT} radius={[0, 4, 4, 0]} maxBarSize={26}>
                <LabelList dataKey="cost" position="right" formatter={(v) => fmtDec(v, 0)}
                  style={{ fill: "var(--text-body)", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── ตารางรายแคมเปญ ── */}
      <div style={cardStyle}>
        <div style={{ fontSize: 16, color: "var(--text-dim)", fontWeight: 600, marginBottom: 2 }}>ผลลัพธ์รายแคมเปญ</div>
        <div style={{ fontSize: 13, color: "var(--text-faint)", marginBottom: 12 }}>เฉพาะแคมเปญที่กำลังรัน (ACTIVE)</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ color: "var(--text-faint)", fontSize: 13 }}>
                <th style={th("left")}>แคมเปญ</th>
                <th style={th("right")}>งบ</th>
                <th style={th("right")}>ข้อความ</th>
                <th style={th("right")}>ต้นทุน/ข้อความ</th>
                <th style={th("right")}>Reach</th>
                <th style={th("right")}>Clicks</th>
                <th style={th("right")}>CTR</th>
                <th style={th("center")}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <td style={td("left")}>{c.name}</td>
                  <td style={{ ...td("right"), fontFamily: "'IBM Plex Mono', monospace" }}>{fmtNum(c.spend)}</td>
                  <td style={{ ...td("right"), fontFamily: "'IBM Plex Mono', monospace", color: "#7c5cff", fontWeight: 600 }}>{fmtNum(c.results)}</td>
                  <td style={{ ...td("right"), fontFamily: "'IBM Plex Mono', monospace" }}>{fmtDec(c.costPerResult, 0)}</td>
                  <td style={{ ...td("right"), fontFamily: "'IBM Plex Mono', monospace" }}>{fmtNum(c.reach)}</td>
                  <td style={{ ...td("right"), fontFamily: "'IBM Plex Mono', monospace" }}>{fmtNum(c.clicks)}</td>
                  <td style={{ ...td("right"), fontFamily: "'IBM Plex Mono', monospace" }}>{fmtDec(c.ctr, 2)}%</td>
                  <td style={td("center")}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 12, background: "#e7f6ec", color: "#16a34a", fontSize: 12, fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const th = (align) => ({ padding: "6px 10px", textAlign: align, fontWeight: 500, whiteSpace: "nowrap" });
const td = (align) => ({ padding: "10px", textAlign: align, color: "var(--text-body)" });
