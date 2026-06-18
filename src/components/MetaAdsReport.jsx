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
import { META_SNAPSHOT } from "../data/metaAdsSnapshot.js";

const DAILY_METRICS = [
  { id: "messages", label: "ข้อความ", color: "#7c5cff" },
  { id: "leadform", label: "Leadform", color: "#2f6bff" },
  { id: "reach", label: "Reach", color: "#0bb5c9" },
];
const BREAKDOWN_DIMS = [
  { id: "gender", label: "แบ่งตามเพศ" },
  { id: "age", label: "แบ่งตามอายุ" },
  { id: "province", label: "แบ่งตามจังหวัด" },
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
          <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>vs เดือนก่อน</span>
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

export default function MetaAdsReport({ data = META_SNAPSHOT }) {
  const { meta, kpi, daily, funnel, budgetBreakdown, ageGender, campaigns } = data;

  const [dailyMetric, setDailyMetric] = useState("messages");
  const [breakdownDim, setBreakdownDim] = useState("gender");
  const [ageMetric, setAgeMetric] = useState("messages");

  // คลิกขยาย: เก็บ id ที่กางอยู่
  const [openCampaigns, setOpenCampaigns] = useState({});
  const [openAdsets, setOpenAdsets] = useState({});
  const [lightbox, setLightbox] = useState(null); // { url, name }

  const toggleCampaign = (id) => setOpenCampaigns((s) => ({ ...s, [id]: !s[id] }));
  const toggleAdset = (id) => setOpenAdsets((s) => ({ ...s, [id]: !s[id] }));

  const activeDaily = DAILY_METRICS.find((m) => m.id === dailyMetric);
  const pieData = budgetBreakdown[breakdownDim];
  const ageData = ageGender[ageMetric];

  return (
    <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 18 }}>
      {/* หัวเซ็กชัน */}
      <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, color: "#2f6bff", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>
            META ADS · รายงานผลโฆษณา
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-heading)", marginTop: 3 }}>{meta.account}</div>
          <div style={{ fontSize: 14, color: "var(--text-faint)", marginTop: 2 }}>
            {meta.dateStart} → {meta.dateStop} · สกุลเงิน {meta.currency}
          </div>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 20,
          background: meta.source === "live" ? "#e7f6ec" : "#fbf2e0",
          color: meta.source === "live" ? "#16a34a" : "#b8860b", fontSize: 13, fontWeight: 600,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.source === "live" ? "#16a34a" : "#d99514" }} />
          {meta.source === "live" ? "ข้อมูลสด" : `snapshot · ดึง ${meta.pulledAt}`}
        </div>
      </div>

      {/* 1. KPI 4 การ์ด */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
        <MetaKpiCard label="งบที่ใช้ (Spend)" value={fmtNum(kpi.spend)} unit="บาท" delta={kpi.deltaSpend} />
        <MetaKpiCard label="ต้นทุนต่อข้อความ" value={fmtDec(kpi.costPerResult, 2)} unit="บาท" delta={kpi.deltaCostPerResult} />
        <MetaKpiCard label="จำนวนข้อความ" value={fmtNum(kpi.results)} delta={kpi.deltaResults} />
        <MetaKpiCard label="การเข้าถึง (Reach)" value={fmtNum(kpi.reach)} delta={kpi.deltaReach} />
      </div>

      {/* 2. กราฟรายวัน + Funnel */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 17, color: "var(--text-heading)", fontWeight: 700 }}>งบที่ใช้ & ผลลัพธ์ รายวัน</div>
              <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>
                เส้น = งบที่ใช้จริง · แท่ง = {activeDaily.label}ที่เลือก
              </div>
            </div>
            <SegToggle options={DAILY_METRICS} value={dailyMetric} onChange={setDailyMetric} />
          </div>
          <ResponsiveContainer width="100%" height={290}>
            <ComposedChart data={daily} margin={{ top: 16, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "var(--text-dim)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: "var(--text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={52} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={44} />
              <Tooltip {...tooltipProps}
                formatter={(v, n) => (n === "spend" ? [`${fmtNum(v)} บาท`, "งบที่ใช้"] : [fmtNum(v), activeDaily.label])} />
              <Legend wrapperStyle={{ fontSize: 13 }}
                formatter={(v) => (v === "spend" ? "งบที่ใช้ (บาท)" : activeDaily.label)} />
              <Bar yAxisId="left" dataKey={dailyMetric} fill={activeDaily.color + "77"} radius={[3, 3, 0, 0]} maxBarSize={20} />
              <Line yAxisId="right" type="monotone" dataKey="spend" stroke="#d99514" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 17, color: "var(--text-heading)", fontWeight: 700 }}>เส้นทางลูกค้า (Funnel)</div>
          <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2, marginBottom: 14 }}>
            จากเห็นโฆษณา → ติดต่อ → ปิดการขาย
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <FunnelRow label="การเข้าถึง (Reach)" value={fmtNum(funnel.reach)} pct={100} color="#2f6bff" />
            <FunnelRow label="คลิก / มีส่วนร่วม" sublabel={`CTR ${fmtDec(funnel.ctr, 1)}%`} value={fmtNum(funnel.clicks)} pct={Math.min(100, (funnel.clicks / funnel.reach) * 100 * 8)} color="#0bb5c9" />
            <FunnelRow label="ทักแชท / Leadform" value={`${fmtNum(funnel.results)} ข้อความ`} pct={Math.min(100, (funnel.results / funnel.clicks) * 100 * 1.5)} color="#7c5cff" />
            <FunnelRow label="ต้นทุน/ข้อความ" value={`${fmtDec(funnel.costPerResult, 2)} บาท`} pct={42} color="#d99514" />
          </div>
        </div>
      </div>

      {/* 3. โดนัทงบ + อายุ×เพศ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 18 }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 17, color: "var(--text-heading)", fontWeight: 700 }}>สัดส่วนงบ</div>
              <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>แบ่งงบตามมิติที่เลือก</div>
            </div>
            <SegToggle options={BREAKDOWN_DIMS} value={breakdownDim} onChange={setBreakdownDim} />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={92} paddingAngle={2}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="var(--bg-card)" strokeWidth={2} />)}
              </Pie>
              <Tooltip {...tooltipProps} formatter={(v) => [`${fmtNum(v)} บาท`, "งบ"]} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 17, color: "var(--text-heading)", fontWeight: 700 }}>ผลลัพธ์ตามกลุ่มอายุ & เพศ</div>
              <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>กลุ่มไหนได้ผลที่สุด</div>
            </div>
            <SegToggle options={DAILY_METRICS} value={ageMetric} onChange={setAgeMetric} />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ageData} margin={{ top: 16, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="age" tick={{ fill: "var(--text-dim)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={48} />
              <Tooltip {...tooltipProps} formatter={(v, n) => [fmtNum(v), n === "female" ? "หญิง" : "ชาย"]} />
              <Legend wrapperStyle={{ fontSize: 13 }} formatter={(v) => (v === "female" ? "หญิง" : "ชาย")} />
              <Bar dataKey="female" stackId="a" fill="#e06fae" maxBarSize={48} />
              <Bar dataKey="male" stackId="a" fill="#2f6bff" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. ตารางแคมเปญ — คลิกขยาย 2 ชั้น */}
      <div style={cardStyle}>
        <div style={{ fontSize: 17, color: "var(--text-heading)", fontWeight: 700, marginBottom: 2 }}>ผลลัพธ์รายแคมเปญ</div>
        <div style={{ fontSize: 13, color: "var(--text-faint)", marginBottom: 14 }}>
          คลิกชื่อแคมเปญ → ดูกลุ่มเป้าหมาย → ดูคอนเทนต์ (คลิกรูปเพื่อขยาย)
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ color: "var(--text-faint)", fontSize: 13 }}>
                <th style={th("left")}>แคมเปญ</th>
                <th style={th("right")}>งบ</th>
                <th style={th("right")}>ข้อความ</th>
                <th style={th("right")}>ต้นทุนข้อความ</th>
                <th style={th("right")}>Lead</th>
                <th style={th("right")}>CPL</th>
                <th style={th("right")}>Reach</th>
                <th style={th("center")}>สถานะ</th>
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
                      <td style={mono("right")}>{fmtNum(c.spend)} บาท</td>
                      <td style={mono("right")}>{fmtNum(c.results)}</td>
                      <td style={mono("right")}>{fmtDec(c.costPerResult, 2)} บาท</td>
                      <td style={mono("right")}>{fmtNum(c.lead)}</td>
                      <td style={mono("right")}>{fmtDec(c.cpl, 2)} บาท</td>
                      <td style={mono("right")}>{fmtNum(c.reach)}</td>
                      <td style={td("center")}><StatusBadge status={c.status} /></td>
                    </tr>

                    {/* แถว ad set (กลุ่มเป้าหมาย) */}
                    {cOpen && c.adsets.map((as) => {
                      const asOpen = !!openAdsets[as.id];
                      return (
                        <FragmentRows key={as.id}>
                          <tr onClick={() => toggleAdset(as.id)}
                            style={{ borderTop: "1px solid var(--border-subtle)", cursor: "pointer", background: asOpen ? "var(--bg-chip)" : "var(--bg-page)" }}>
                            <td style={{ ...td("left"), paddingLeft: 38, color: "var(--text-body)", fontWeight: 600 }}>
                              <span style={{ display: "inline-block", width: 16, color: "var(--text-faint)", transform: asOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>▸</span>
                              👥 {as.name}
                            </td>
                            <td style={mono("right")}>{fmtNum(as.spend)} บาท</td>
                            <td style={mono("right")}>{fmtNum(as.results)}</td>
                            <td style={mono("right")}>—</td>
                            <td style={mono("right")}>{fmtNum(as.lead)}</td>
                            <td style={mono("right")}>{fmtDec(as.cpl, 2)} บาท</td>
                            <td style={mono("right")}>{fmtNum(as.reach)}</td>
                            <td style={td("center")}><StatusBadge status={as.status} /></td>
                          </tr>

                          {/* แถว ad (คอนเทนต์ + รูป) */}
                          {asOpen && as.ads.map((ad) => (
                            <tr key={ad.id} style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-page)" }}>
                              <td style={{ ...td("left"), paddingLeft: 64 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  <img src={ad.imageUrl} alt={ad.name} onClick={() => setLightbox({ url: ad.imageUrl, name: ad.name })}
                                    style={{ width: 46, height: 46, borderRadius: 8, objectFit: "cover", cursor: "zoom-in", border: "1px solid var(--border-subtle)", flexShrink: 0 }} />
                                  <div>
                                    <div style={{ color: "var(--text-body)", fontWeight: 500 }}>{ad.name}</div>
                                    <div style={{ fontSize: 12, color: "var(--text-faint)" }}>{ad.format} · CTR {fmtDec(ad.ctr, 1)}%</div>
                                  </div>
                                </div>
                              </td>
                              <td style={mono("right")}>{fmtNum(ad.spend)} บาท</td>
                              <td style={mono("right")}>{fmtNum(ad.results)}</td>
                              <td style={mono("right")}>—</td>
                              <td style={mono("right")}>{fmtNum(ad.lead)}</td>
                              <td style={mono("right")}>—</td>
                              <td style={mono("right")}>{fmtNum(ad.reach)}</td>
                              <td style={td("center")}>—</td>
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
            style={{ maxWidth: "90vw", maxHeight: "78vh", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 600, fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>{lightbox.name}</div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>คลิกที่ใดก็ได้เพื่อปิด</div>
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
