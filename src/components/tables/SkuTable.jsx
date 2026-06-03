// ─────────────────────────────────────────────────────────────
// SkuTable.jsx — ตารางวิเคราะห์ SKU (เรียงตามกำไรขั้นต้น) + แถบ margin
// ─────────────────────────────────────────────────────────────

import { PALETTE } from "../../config/constants.js";
import { fmtB } from "../../lib/format.js";
import { cardStyle } from "../ui.js";

const HEADERS = ["อันดับ", "SKU", "ยอดขาย", "ออเดอร์", "ต้นทุนสินค้า", "กำไรขั้นต้น", "Margin %"];

const marginColor = (m) => (m > 55 ? "#10b981" : m > 40 ? "#f59e0b" : "#f87171");

export default function SkuTable({ skuData, activeSku, onToggleSku }) {
  return (
    <div style={{ ...cardStyle, overflowX: "auto" }}>
      <div style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 12 }}>ตารางวิเคราะห์ SKU (เรียงตามกำไรขั้นต้น)</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            {HEADERS.map((h) => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-faint)", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skuData.map((d, i) => (
            <tr key={d.sku} onClick={() => onToggleSku(d.sku)}
              style={{
                borderBottom: "1px solid var(--border-subtle)", cursor: "pointer", transition: "background 0.15s",
                background: activeSku === d.sku ? `${PALETTE[d.sku]}18` : "transparent",
              }}>
              <td style={{ padding: "10px 12px" }}>
                <span style={{ background: i < 3 ? PALETTE[d.sku] : "var(--bg-chip)", color: i < 3 ? "#000" : "var(--text-faint)", borderRadius: 4, padding: "2px 8px", fontWeight: 700, fontSize: 13 }}>#{i + 1}</span>
              </td>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: PALETTE[d.sku] }} />
                  <span style={{ color: "var(--text-body)", fontWeight: 500 }}>{d.sku}</span>
                </div>
              </td>
              <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontFamily: "'Space Mono'" }}>{fmtB(d.rev)}</td>
              <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>{d.ord.toLocaleString()}</td>
              <td style={{ padding: "10px 12px", color: "#f87171", fontFamily: "'Space Mono'" }}>{fmtB(d.cogs)}</td>
              <td style={{ padding: "10px 12px", fontFamily: "'Space Mono'", fontWeight: 700, color: d.grossP > 0 ? "#10b981" : "#f87171" }}>{fmtB(d.grossP)}</td>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: Math.min(60, Math.max(0, d.marginPct * 1.2)), height: 4, borderRadius: 2, background: marginColor(d.marginPct) }} />
                  <span style={{ fontSize: 13, color: marginColor(d.marginPct) }}>{d.marginPct}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
