// ─────────────────────────────────────────────────────────────
// OfferVsSalesPanel.jsx — เทียบ "ยอดเสนอ vs ยอดขาย(ปิดได้)" (ข้อ 7)
// บน: เส้น 2 เส้นซ้อน (เสนอ/ปิดได้) + Close Rate
// ล่าง: bar เทียบ 2 แท่งต่อจุด (เสนอ/ปิดได้)
// ─────────────────────────────────────────────────────────────

import {
  ComposedChart, Line, Bar, BarChart, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, LabelList,
} from "recharts";
import { ACCENT } from "../../config/constants.js";
import { fmt, fmtDec } from "../../lib/format.js";
import { tooltipProps, cardStyle } from "../ui.js";

const C_QUOTED = "#94a3b8"; // ยอดเสนอ (เทา)
const C_SALES = ACCENT;     // ยอดปิดได้ (ฟ้า)

export default function OfferVsSalesPanel({ trend }) {
  const { data, title } = trend;
  const totalQuoted = data.reduce((a, d) => a + d.quoted, 0);
  const totalSales = data.reduce((a, d) => a + d.revenue, 0);
  const overallClose = totalQuoted > 0 ? (totalSales / totalQuoted) * 100 : 0;

  return (
    <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 16, color: "var(--text-dim)", fontWeight: 600 }}>ยอดเสนอ vs ยอดขาย · {title}</div>
          <div style={{ fontSize: 13, color: "var(--text-faint)" }}>เส้นบน = เทรนซ้อน · แท่งล่าง = เทียบรายช่วง</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, color: "var(--text-faint)" }}>อัตราปิดรวม (Close Rate)</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: overallClose > 50 ? "#10b981" : "#f59e0b", fontFamily: "'IBM Plex Mono', monospace" }}>
            {fmtDec(overallClose, 1)}%
          </div>
        </div>
      </div>

      {/* เทรนซ้อน */}
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 24, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--text-dim)", fontSize: 13 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={64} />
          <Tooltip {...tooltipProps}
            formatter={(v, n) => [fmt(v), n === "quoted" ? "ยอดเสนอ" : n === "revenue" ? "ยอดขาย(ปิดได้)" : n]} />
          <Legend formatter={(v) => (v === "quoted" ? "ยอดเสนอ" : "ยอดขาย(ปิดได้)")} wrapperStyle={{ fontSize: 14 }} />
          <Line type="monotone" dataKey="quoted" stroke={C_QUOTED} strokeWidth={2.5} strokeDasharray="5 4" dot={{ r: 3, fill: C_QUOTED }} />
          <Line type="monotone" dataKey="revenue" stroke={C_SALES} strokeWidth={3} dot={{ r: 4, fill: C_SALES }} />
        </ComposedChart>
      </ResponsiveContainer>

      <div style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} />

      {/* bar เทียบ */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 24, right: 16, left: 8, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--text-dim)", fontSize: 13 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--text-faint)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={64} />
          <Tooltip {...tooltipProps}
            formatter={(v, n) => [fmt(v), n === "quoted" ? "ยอดเสนอ" : "ยอดขาย(ปิดได้)"]} />
          <Bar dataKey="quoted" fill={C_QUOTED} radius={[4, 4, 0, 0]} maxBarSize={48} />
          <Bar dataKey="revenue" fill={C_SALES} radius={[4, 4, 0, 0]} maxBarSize={48}>
            <LabelList dataKey="revenue" position="top" formatter={fmt}
              style={{ fill: "var(--text-body)", fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
