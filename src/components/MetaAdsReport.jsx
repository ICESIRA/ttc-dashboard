// ──────────────────────────────────────────────────────────────
// MetaAdsReport.jsx — รายงานผลโฆษณา Meta (TTC Ad Account)
//   หน้าตาตามดีไซน์ · ตัวเลข+รูป placeholder (รอต่อ Meta realtime ผ่าน Cloudflare)
//   ตารางแคมเปญคลิกขยาย 2 ชั้น: แคมเปญ → กลุ่มเป้าหมาย → คอนเทนต์ + รูป (กดขยาย)
// ──────────────────────────────────────────────────────────────

import { useState } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, PieChart, Pie, Cell, BarChart,
} from "recharts";
import { ACCENT } from "../config/constants.js";
import { fmt, fmtNum, fmtDec } from "../lib/format.js";
import { tooltipProps, cardStyle } from "./ui.js";
import { useMetaData } from "../data/useMetaData.js";

const DAILY_METRICS = [
  { id: "messages", label: "Messages", color: "#7c5cff" },
  { id: "leadform", label: "Leadform", color: "#2f6bff" },
  { id: "reach", label: "Reach", color: "#0bb5c9" },
];
// เมตริกที่เลือกได้สำหรับกราฟแท่ง/เส้น (รวมงบด้วย)
const CHART_METRICS = [
  { id: "messages", label: "Messages", color: "#7c5cff" },
  { id: "leadform", label: "Leadform", color: "#2f6bff" },
  { id: "reach", label: "Reach", color: "#0bb5c9" },
  { id: "spend", label: "Spend", color: "#d99514" },
];
const BREAKDOWN_DIMS = [
  { id: "gender", label: "By gender" },
  { id: "age", label: "By age" },
  { id: "province", label: "By province" },
];

function SegToggle({ options, value, onChange }) {
  return (
    <div style={{ display: "inline-flex", gap: 2, padding: 3, borderRadius: 10, background: "var(--bg-chip)" }}>
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)}
            style={{
              padding: "5px 13px", borderRadius: 8, fontSize: 13, cursor: "pointer", border: "none",
              background: active ? "var(--bg-card)" : "transparent",
              color: active ? "var(--text-heading)" : "var(--text-faint)",
              fontWeight: active ? 700 : 500, boxShadow: active ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
              fontFamily: "'IBM Plex Sans Thai', sans-serif", transition: "all 0.12s",
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function MetaKpiCard({ label, value, unit, delta }) {
  const up = delta >= 0;
  return (
    <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 15, color: "var(--text-faint)" }}>{label}</span>
        <span style={{
          width: 28, height: 28, borderRadius: 8, background: "var(--bg-chip)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, color: "var(--text-faint)",
        }}>⚙</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 34, fontWeight: 700, color: "var(--text-heading)", fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.1 }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-dim)" }}>{unit}</span>}
      </div>
      {delta !== undefined && delta !== null && (
        <div style={{ fontSize: 14, fontWeight: 600, color: up ? "#16a34a" : "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>
          <span>{up ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%</span>
          <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>vs prev month</span>
        </div>
      )}
    </div>
  );
}

function FunnelRow({ label, sublabel, value, pct, color }) {
  return (
    <div style={{ ...cardStyle, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 15, color: "var(--text-dim)", fontWeight: 500 }}>{label}</span>
          {sublabel && (
            <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, background: "#e7f6ec", padding: "2px 8px", borderRadius: 10 }}>
              {sublabel}
            </span>
          )}
        </div>
        <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text-heading)", fontFamily: "'IBM Plex Mono', monospace" }}>
          {value}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "var(--bg-chip)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: color, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

// badge สถานะ Active/Pause
function StatusBadge({ status }) {
  const active = status === "Active";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 11px", borderRadius: 12,
      background: active ? "#e7f6ec" : "var(--bg-chip)",
      color: active ? "#16a34a" : "var(--text-faint)", fontSize: 12, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#16a34a" : "#9ca3af" }} />
      {status}
    </span>
  );
}

export default function MetaAdsReport({ since, until }) {
  // ดึงข้อมูลจริงจาก Cloudflare Worker (ใช้ข้อมูล Meta จริงเท่านั้น)
  const { data, loading, error } = useMetaData(since, until);

  const [dailyMetric, setDailyMetric] = useState("messages");
  const [lineMetric, setLineMetric] = useState("spend");
  const [breakdownDim, setBreakdownDim] = useState("gender");
  const [ageMetric, setAgeMetric] = useState("messages");

  // คลิกขยาย: เก็บ id ที่กางอยู่
  const [openCampaigns, setOpenCampaigns] = useState({});
  const [openAdsets, setOpenAdsets] = useState({});
  const [lightbox, setLightbox] = useState(null); // { url, name }

  const toggleCampaign = (id) => setOpenCampaigns((s) => ({ ...s, [id]: !s[id] }));
  const toggleAdset = (id) => setOpenAdsets((s) => ({ ...s, [id]: !s[id] }));

  // ── หน้า loading ระหว่างดึง Meta ──
  if (loading) {
    return (
      <div style={{ ...cardStyle, marginTop: 30, padding: "60px 20px", textAlign: "center" }}>
        <div style={{
          width: 40, height: 40, margin: "0 auto 16px", borderRadius: "50%",
          border: "4px solid var(--border-default)", borderTopColor: "#2f6bff",
          animation: "metaspin 1s linear infinite",
        }} />
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-heading)" }}>Loading Meta Ads...</div>
        <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 4 }}>Connecting to Meta in real time</div>
        <style>{`@keyframes metaspin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── ดึงข้อมูลไม่ได้ (ไม่ fallback ไปข้อมูลตัวอย่าง) ──
  if (error || !data) {
    return (
      <div style={{ ...cardStyle, marginTop: 30, padding: "48px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-heading)" }}>Couldn't load Meta data</div>
        <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 6, maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>
          {error || "No data from Meta"}
        </div>
        <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 10 }}>
          Try refreshing the page or check the Meta connection
        </div>
      </div>
    );
  }

  const { meta, kpi, daily, funnel, budgetBreakdown, ageGender, campaigns } = data;

  // ── ซ่อน Leadform อัตโนมัติถ้าไม่มีข้อมูลเลย ──
  const hasLeadform =
    (daily || []).some((d) => (d.leadform || 0) > 0) ||
    ((ageGender && ageGender.leadform) || []).some((r) => (r.female || 0) + (r.male || 0) > 0);

  const dropLead = (arr) => (hasLeadform ? arr : arr.filter((m) => m.id !== "leadform"));
  const chartMetrics = dropLead(CHART_METRICS);   // ปุ่มกราฟรายวัน
  const dailyMetricsFiltered = dropLead(DAILY_METRICS); // ปุ่มกราฟ age×gender

  // ถ้าเมตริกที่เลือกอยู่คือ leadform แต่ถูกซ่อน → เด้งกลับเป็น messages
  const safeBarId = (!hasLeadform && dailyMetric === "leadform") ? "messages" : dailyMetric;
  const safeLineId = (!hasLeadform && lineMetric === "leadform") ? "spend" : lineMetric;
  const safeAgeId = (!hasLeadform && ageMetric === "leadform") ? "messages" : ageMetric;

  const activeBar = CHART_METRICS.find((m) => m.id === safeBarId) || CHART_METRICS[0];
  const activeLine = CHART_METRICS.find((m) => m.id === safeLineId) || CHART_METRICS[3];
  const pieData = budgetBreakdown[breakdownDim];
  const ageData = ageGender[safeAgeId];

  return (
    <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 18 }}>
      {/* หัวเซ็กชัน */}
      <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, color: "#2f6bff", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>
            META ADS · Performance Report
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-heading)", marginTop: 3 }}>{meta.account}</div>
          <div style={{ fontSize: 14, color: "var(--text-faint)", marginTop: 2 }}>
            {meta.dateStart} → {meta.dateStop} · Currency {meta.currency}
          </div>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 20,
          background: meta.source === "live" ? "#e7f6ec" : "#fbf2e0",
          color: meta.source === "live" ? "#16a34a" : "#b8860b", fontSize: 13, fontWeight: 600,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.source === "live" ? "#16a34a" : "#d99514" }} />
          {meta.source === "live" ? "Live data" : `snapshot · fetched ${meta.pulledAt}`}
        </div>
      </div>

      {/* 1. KPI 4 การ์ด */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
        <MetaKpiCard label="Spend" value={fmtNum(kpi.spend)} unit="Baht" delta={kpi.deltaSpend} />
        <MetaKpiCard label="Cost per message" value={fmtDec(kpi.costPerResult, 2)} unit="Baht" delta={kpi.deltaCostPerResult} />
        <MetaKpiCard label="Messages" value={fmtNum(kpi.results)} delta={kpi.deltaResults} />
        <MetaKpiCard label="Reach" value={fmtNum(kpi.reach)} delta={kpi.deltaReach} />
      </div>

      {/* 2. กราฟรายวัน + Funnel */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }}>
        <div style={cardStyle}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 17, color: "var(--text-heading)", fontWeight: 700 }}>Daily results</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-faint)", fontWeight: 600 }}>Bar:</span>
                <SegToggle options={chartMetrics} value={safeBarId} onChange={setDailyMetric} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-faint)", fontWeight: 600 }}>Line:</span>
                <SegToggle options={chartMetrics} value={safeLineId} onChange={setLineMetric} />
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={290}>
            <ComposedChart data={daily} margin={{ top: 16, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "var(--text-dim)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: "var(--text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={52} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={44} />
              <Tooltip {...tooltipProps}
                formatter={(v, n) => {
                  const m = CHART_METRICS.find((x) => x.id === n);
                  const isMoney = n === "spend";
                  return [isMoney ? `${fmtNum(v)} Baht` : fmtNum(v), m ? m.label : n];
                }} />
              <Legend wrapperStyle={{ fontSize: 13 }}
                formatter={(v) => {
                  const m = CHART_METRICS.find((x) => x.id === v);
                  return m ? m.label : v;
                }} />
              <Bar yAxisId="left" dataKey={safeBarId} fill={activeBar.color + "77"} radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Line yAxisId="right" type="monotone" dataKey={safeLineId} stroke={activeLine.color} strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 17, color: "var(--text-heading)", fontWeight: 700 }}>Customer journey (Funnel)</div>
          <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2, marginBottom: 14 }}>
            From impression → contact → close
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <FunnelRow label="Reach" value={fmtNum(funnel.reach)} pct={100} color="#2f6bff" />
            <FunnelRow label="Clicks / engagement" sublabel={`CTR ${fmtDec(funnel.ctr, 1)}%`} value={fmtNum(funnel.clicks)} pct={Math.min(100, (funnel.clicks / funnel.reach) * 100 * 8)} color="#0bb5c9" />
            <FunnelRow label="Messages / Leadform" value={`${fmtNum(funnel.results)} messages`} pct={Math.min(100, (funnel.results / funnel.clicks) * 100 * 1.5)} color="#7c5cff" />
            <FunnelRow label="Cost / message" value={`${fmtDec(funnel.costPerResult, 2)} Baht`} pct={42} color="#d99514" />
          </div>
        </div>
      </div>

      {/* 3. โดนัทงบ + อายุ×เพศ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 18 }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 17, color: "var(--text-heading)", fontWeight: 700 }}>Budget split</div>
              <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>Budget by selected dimension</div>
            </div>
            <SegToggle options={BREAKDOWN_DIMS} value={breakdownDim} onChange={setBreakdownDim} />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={92} paddingAngle={2}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="var(--bg-card)" strokeWidth={2} />)}
              </Pie>
              <Tooltip {...tooltipProps} formatter={(v) => [`${fmtNum(v)} Baht`, "Budget"]} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 17, color: "var(--text-heading)", fontWeight: 700 }}>Results by age & gender</div>
              <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>Which group performs best</div>
            </div>
            <SegToggle options={dailyMetricsFiltered} value={safeAgeId} onChange={setAgeMetric} />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ageData} margin={{ top: 16, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="age" tick={{ fill: "var(--text-dim)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={48} />
              <Tooltip {...tooltipProps} formatter={(v, n) => [fmtNum(v), n === "female" ? "Female" : "Male"]} />
              <Legend wrapperStyle={{ fontSize: 13 }} formatter={(v) => (v === "female" ? "Female" : "Male")} />
              <Bar dataKey="female" stackId="a" fill="#e06fae" maxBarSize={48} />
              <Bar dataKey="male" stackId="a" fill="#2f6bff" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. ตารางแคมเปญ — คลิกขยาย 2 ชั้น */}
      <div style={cardStyle}>
        <div style={{ fontSize: 17, color: "var(--text-heading)", fontWeight: 700, marginBottom: 2 }}>Results by campaign</div>
        <div style={{ fontSize: 13, color: "var(--text-faint)", marginBottom: 14 }}>
          Click a campaign → see audiences → see content (click image to expand)
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ color: "var(--text-faint)", fontSize: 13 }}>
                <th style={th("left")}>Campaign</th>
                <th style={th("right")}>Spend</th>
                <th style={th("right")}>Messages</th>
                <th style={th("right")}>Cost/msg</th>
                <th style={th("right")}>Lead</th>
                <th style={th("right")}>CPL</th>
                <th style={th("right")}>Reach</th>
                <th style={th("center")}>Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const cOpen = !!openCampaigns[c.id];
                return (
                  <FragmentRows key={c.id}>
                    {/* แถวแคมเปญ */}
                    <tr onClick={() => toggleCampaign(c.id)}
                      style={{ borderTop: "1px solid var(--border-subtle)", cursor: "pointer", background: cOpen ? "var(--bg-chip)" : "transparent" }}>
                      <td style={{ ...td("left"), fontWeight: 700, color: "var(--text-heading)" }}>
                        <span style={{ display: "inline-block", width: 16, color: "var(--text-faint)", transform: cOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>▸</span>
                        {c.name}
                      </td>
                      <td style={mono("right")}>{fmtNum(c.spend)} Baht</td>
                      <td style={mono("right")}>{fmtNum(c.results)}</td>
                      <td style={mono("right")}>{fmtDec(c.costPerResult, 2)} Baht</td>
                      <td style={mono("right")}>{fmtNum(c.lead)}</td>
                      <td style={mono("right")}>{fmtDec(c.cpl, 2)} Baht</td>
                      <td style={mono("right")}>{fmtNum(c.reach)}</td>
                      <td style={td("center")}><StatusBadge status={c.status} /></td>
                    </tr>

                    {/* แถว ad set (กลุ่มเป้าหมาย) */}
                    {cOpen && (!c.adsets || c.adsets.length === 0) && (
                      <tr style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-page)" }}>
                        <td colSpan={8} style={{ ...td("left"), paddingLeft: 38, color: "var(--text-faint)", fontStyle: "italic" }}>
                          No audiences with data in this range
                        </td>
                      </tr>
                    )}
                    {cOpen && (c.adsets || []).map((as) => {
                      const asOpen = !!openAdsets[as.id];
                      return (
                        <FragmentRows key={as.id}>
                          <tr onClick={() => toggleAdset(as.id)}
                            style={{ borderTop: "1px solid var(--border-subtle)", cursor: "pointer", background: asOpen ? "var(--bg-chip)" : "var(--bg-page)" }}>
                            <td style={{ ...td("left"), paddingLeft: 38, color: "var(--text-body)", fontWeight: 600 }}>
                              <span style={{ display: "inline-block", width: 16, color: "var(--text-faint)", transform: asOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>▸</span>
                              👥 {as.name}
                            </td>
                            <td style={mono("right")}>{fmtNum(as.spend)} Baht</td>
                            <td style={mono("right")}>{fmtNum(as.results)}</td>
                            <td style={mono("right")}>{as.costPerResult > 0 ? `${fmtDec(as.costPerResult, 2)} Baht` : "—"}</td>
                            <td style={mono("right")}>{fmtNum(as.lead)}</td>
                            <td style={mono("right")}>{fmtDec(as.cpl, 2)} Baht</td>
                            <td style={mono("right")}>{fmtNum(as.reach)}</td>
                            <td style={td("center")}><StatusBadge status={as.status} /></td>
                          </tr>

                          {/* แถว ad (คอนเทนต์ + รูป) */}
                          {asOpen && (as.ads || []).map((ad) => (
                            <tr key={ad.id} style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-page)" }}>
                              <td style={{ ...td("left"), paddingLeft: 64 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  {ad.imageUrl ? (
                                    <img src={ad.imageUrl} alt={ad.name} onClick={() => setLightbox({ url: ad.fullImageUrl || ad.imageUrl, name: ad.name })}
                                      style={{ width: 46, height: 46, borderRadius: 8, objectFit: "cover", cursor: "zoom-in", border: "1px solid var(--border-subtle)", flexShrink: 0 }} />
                                  ) : (
                                    <div style={{ width: 46, height: 46, borderRadius: 8, border: "1px solid var(--border-subtle)", background: "var(--bg-chip)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "var(--text-faint)", flexShrink: 0 }}>🖼</div>
                                  )}
                                  <div>
                                    <div style={{ color: "var(--text-body)", fontWeight: 500 }}>{ad.name}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-faint)" }}>{ad.format} · CTR {fmtDec(ad.ctr, 1)}%</div>
                                  </div>
                                </div>
                              </td>
                              <td style={mono("right")}>{fmtNum(ad.spend)} Baht</td>
                              <td style={mono("right")}>{fmtNum(ad.results)}</td>
                              <td style={mono("right")}>{ad.costPerResult > 0 ? `${fmtDec(ad.costPerResult, 2)} Baht` : "—"}</td>
                              <td style={mono("right")}>{fmtNum(ad.lead)}</td>
                              <td style={mono("right")}>—</td>
                              <td style={mono("right")}>{fmtNum(ad.reach)}</td>
                              <td style={td("center")}>{ad.status ? <StatusBadge status={ad.status} /> : "—"}</td>
                            </tr>
                          ))}
                        </FragmentRows>
                      );
                    })}
                  </FragmentRows>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox ขยายรูป */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.78)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, cursor: "zoom-out",
          }}>
          <img src={lightbox.url} alt={lightbox.name}
            style={{ maxWidth: "96vw", maxHeight: "88vh", minWidth: "min(90vw, 520px)", objectFit: "contain", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 600, fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>{lightbox.name}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Click anywhere to close</div>
        </div>
      )}
    </div>
  );
}

// helper: group rows โดยไม่เพิ่ม DOM node (ใช้ใน tbody)
function FragmentRows({ children }) {
  return <>{children}</>;
}

const th = (align) => ({ padding: "8px 12px", textAlign: align, fontWeight: 500, whiteSpace: "nowrap" });
const td = (align) => ({ padding: "12px", textAlign: align, color: "var(--text-body)", whiteSpace: "nowrap" });
const mono = (align) => ({ ...td(align), fontFamily: "'IBM Plex Mono', monospace" });
