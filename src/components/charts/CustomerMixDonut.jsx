// ─────────────────────────────────────────────────────────────
// CustomerMixDonut.jsx — โดนัทสัดส่วนลูกค้าใหม่ vs เก่า (คลิก legend = filter)
// ─────────────────────────────────────────────────────────────

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { fmtB } from "../../lib/format.js";
import { tooltipProps, cardStyle, cardTitle, cardSubtitle } from "../ui.js";

function LegendRow({ label, value, pct, color, active, onClick }) {
  return (
    <div onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
        borderRadius: 8, cursor: "pointer",
        background: active ? `${color}22` : "transparent",
        border: `1px solid ${active ? color : "transparent"}`,
      }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: "var(--text-body)" }}>{label}</div>
        <div style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "'Space Mono'" }}>{fmtB(value)}</div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "'Space Mono'" }}>{pct.toFixed(0)}%</div>
    </div>
  );
}

export default function CustomerMixDonut({ mixData, activeCustomer, onToggleCustomer }) {
  const total = mixData[0].value + mixData[1].value;
  const newPct = total > 0 ? (mixData[0].value / total) * 100 : 0;
  const oldPct = total > 0 ? (mixData[1].value / total) * 100 : 0;

  return (
    <div style={cardStyle}>
      <div style={cardTitle}>สัดส่วนลูกค้าใหม่ vs เก่า</div>
      <div style={cardSubtitle}>วัดจากยอดขายรวม · กระทบตาม filter ปัจจุบัน</div>

      {total === 0 ? (
        <div style={{ fontSize: 13, color: "var(--text-faint)", padding: "30px 0", textAlign: "center" }}>
          ไม่มีข้อมูลในช่วงที่เลือก
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mixData} dataKey="value" innerRadius={42} outerRadius={62} startAngle={90} endAngle={-270} stroke="none">
                  {mixData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip {...tooltipProps} formatter={(v, n) => [fmtB(v), `ลูกค้า${n}`]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", pointerEvents: "none",
            }}>
              <div style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: 1 }}>รวม</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-heading)", fontFamily: "'Space Mono'" }}>{fmtB(total)}</div>
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            <LegendRow label="ลูกค้าใหม่" value={mixData[0].value} pct={newPct} color="#3b82f6"
              active={activeCustomer === "ใหม่"} onClick={() => onToggleCustomer("ใหม่")} />
            <LegendRow label="ลูกค้าเก่า" value={mixData[1].value} pct={oldPct} color="#f59e0b"
              active={activeCustomer === "เก่า"} onClick={() => onToggleCustomer("เก่า")} />
          </div>
        </div>
      )}
    </div>
  );
}
