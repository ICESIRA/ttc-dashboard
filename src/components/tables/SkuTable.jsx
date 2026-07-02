// ─────────────────────────────────────────────────────────────
// SkuTable.jsx — ตารางกลุ่มสินค้า: ยอดเสนอ / ยอดขาย / ออเดอร์ / อัตราปิด
// (ตัดคอลัมน์ต้นทุน/กำไร/Margin ออกชั่วคราว เพราะยังไม่มีข้อมูล COGS)
// ─────────────────────────────────────────────────────────────

import { PALETTE } from "../../config/constants.js";
import { fmtB, fmtDec } from "../../lib/format.js";
import { cardStyle } from "../ui.js";

const HEADERS = ["Rank", "Product", "Quoted", "Sales (closed)", "Orders", "Close rate"];

const closeColor = (c) => (c > 50 ? "#10b981" : c > 30 ? "#f59e0b" : "#f87171");

export default function SkuTable({ skuData, activeSku, onToggleSku }) {
  return (
    <div style={{ ...cardStyle, overflowX: "auto" }}>
      <div style={{ fontSize: 16, color: "var(--text-dim)", fontWeight: 600, marginBottom: 12 }}>Product groups (sorted by sales)</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            {HEADERS.map((h) => (
              <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-faint)", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
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
              <td style={{ padding: "12px" }}>
                <span style={{ background: i < 3 ? PALETTE[d.sku] : "var(--bg-chip)", color: i < 3 ? "#fff" : "var(--text-faint)", borderRadius: 4, padding: "2px 9px", fontWeight: 700, fontSize: 14 }}>#{i + 1}</span>
              </td>
              <td style={{ padding: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 11, height: 11, borderRadius: 3, background: PALETTE[d.sku] }} />
                  <span style={{ color: "var(--text-body)", fontWeight: 500 }}>{d.sku}</span>
                </div>
              </td>
              <td style={{ padding: "12px", color: "var(--text-muted)", fontFamily: "'IBM Plex Mono'" }}>{fmtB(d.quoted)}</td>
              <td style={{ padding: "12px", color: "var(--text-body)", fontWeight: 600, fontFamily: "'IBM Plex Mono'" }}>{fmtB(d.rev)}</td>
              <td style={{ padding: "12px", color: "var(--text-muted)" }}>{d.ord.toLocaleString()}</td>
              <td style={{ padding: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: Math.min(60, Math.max(2, d.closeRate * 0.6)), height: 5, borderRadius: 3, background: closeColor(d.closeRate) }} />
                  <span style={{ fontSize: 14, color: closeColor(d.closeRate), fontFamily: "'IBM Plex Mono'" }}>{fmtDec(d.closeRate, 0)}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
