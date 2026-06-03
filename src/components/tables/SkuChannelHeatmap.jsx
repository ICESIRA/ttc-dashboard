// ─────────────────────────────────────────────────────────────
// SkuChannelHeatmap.jsx — heatmap ยอดขาย SKU × ช่องทาง
// คลิก cell → filter ทั้ง SKU + Channel พร้อมกัน
// ─────────────────────────────────────────────────────────────

import { SKUS, CHANNELS, CH_COLOR, PALETTE } from "../../config/constants.js";
import { fmtB, sum } from "../../lib/format.js";
import { cardStyle } from "../ui.js";

export default function SkuChannelHeatmap({
  rows, activeSku, activeChannel, onToggleSku, onSetCell,
}) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 4 }}>ยอดขายต่อ SKU × ช่องทาง (Heatmap)</div>
      <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 14 }}>เพื่อดูว่า SKU แต่ละตัวขายดีช่องทางไหน</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ padding: "6px 8px", color: "var(--text-faint)", textAlign: "left" }}>SKU</th>
              {CHANNELS.map((ch) => <th key={ch} style={{ padding: "6px 8px", color: CH_COLOR[ch], fontWeight: 500, textAlign: "center" }}>{ch}</th>)}
              <th style={{ padding: "6px 8px", color: "var(--text-dim)", textAlign: "center" }}>รวม</th>
            </tr>
          </thead>
          <tbody>
            {SKUS.map((sku) => {
              const skuRows = rows.filter((r) => r.sku === sku);
              const chRevs = CHANNELS.map((ch) => sum(skuRows.filter((r) => r.channel === ch), "revenue"));
              const total = chRevs.reduce((a, b) => a + b, 0);
              const maxCh = Math.max(...chRevs);
              return (
                <tr key={sku} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <td onClick={() => onToggleSku(sku)}
                    style={{
                      padding: "10px 8px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                      background: activeSku === sku ? `${PALETTE[sku]}22` : "transparent", borderRadius: 6, whiteSpace: "nowrap",
                    }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: PALETTE[sku] }} />
                    <span style={{ color: activeSku === sku ? PALETTE[sku] : "var(--text-body)", fontWeight: activeSku === sku ? 700 : 400 }}>{sku}</span>
                  </td>
                  {chRevs.map((v, ci) => {
                    const ch = CHANNELS[ci];
                    const isActiveCell = activeSku === sku && activeChannel === ch;
                    return (
                      <td key={ci} onClick={() => onSetCell(sku, ch, isActiveCell)}
                        style={{
                          padding: "10px 8px", textAlign: "center", cursor: "pointer",
                          background: isActiveCell ? `${CH_COLOR[ch]}44` : v === maxCh && v > 0 ? `${CH_COLOR[ch]}22` : "transparent",
                          borderRadius: (v === maxCh || isActiveCell) ? 6 : 0,
                          border: isActiveCell ? `1px solid ${CH_COLOR[ch]}` : "1px solid transparent",
                          transition: "all 0.15s",
                        }}>
                        <span style={{
                          fontFamily: "'Space Mono'", fontSize: 13,
                          color: isActiveCell ? "#fff" : v === maxCh && v > 0 ? CH_COLOR[ch] : "var(--text-dim)",
                          fontWeight: (v === maxCh || isActiveCell) ? 700 : 400,
                        }}>{fmtB(v)}</span>
                        {v === maxCh && v > 0 && !isActiveCell && <div style={{ fontSize: 11, color: CH_COLOR[ch], marginTop: 2 }}>▲ top</div>}
                        {isActiveCell && <div style={{ fontSize: 11, color: "#fff", marginTop: 2 }}>● ON</div>}
                      </td>
                    );
                  })}
                  <td style={{ padding: "10px 8px", textAlign: "center", fontFamily: "'Space Mono'", color: "var(--text-muted)", fontWeight: 600 }}>{fmtB(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
