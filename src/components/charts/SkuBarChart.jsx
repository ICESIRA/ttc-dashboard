// ─────────────────────────────────────────────────────────────
// SkuBarChart.jsx — กราฟแท่งยอดขายต่อกลุ่มสินค้า (คลิกเพื่อ filter)
// ─────────────────────────────────────────────────────────────

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { PALETTE } from "../../config/constants.js";
import { fmt, fmtB } from "../../lib/format.js";
import { tooltipProps, cardStyle, cardTitle, cardSubtitle } from "../ui.js";

export default function SkuBarChart({ skuData, activeSku, onToggleSku }) {
  const data = skuData.map((d) => ({ name: d.sku, grossProfit: d.grossP, revenue: d.rev }));

  return (
    <div style={cardStyle}>
      <div style={cardTitle}>ยอดขายต่อกลุ่มสินค้า (คลิกเพื่อ filter)</div>
      <div style={cardSubtitle}>แยกตามกลุ่ม: กล่อง STD / Custom / สติกเกอร์</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} onClick={(d) => d && onToggleSku(d.activeLabel)}>
          <XAxis dataKey="name" tick={{ fill: "var(--text-dim)", fontSize: 13 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--border-default)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} />
          <Tooltip {...tooltipProps}
            formatter={(v, n) => [fmtB(v), "ยอดขาย"]} />
          <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.name}
                fill={activeSku && activeSku !== d.name ? "var(--bg-chip)" : PALETTE[d.name]}
                stroke={activeSku === d.name ? "#fff" : "none"} strokeWidth={2} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
