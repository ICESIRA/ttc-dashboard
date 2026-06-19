// ────────────────────────────────────────────────────────────────
// OfferVsSalesPanel.jsx — ตารางยอดเสนอ/ยอดขาย รายสัปดาห์ (3 เดือนล่าสุด)
//   layout แนวนอน: 3 เดือนข้างกัน · แต่ละเดือนแบ่งคอลัมน์รายสัปดาห์
//   แต่ละช่องแยกตามกลุ่มสินค้า (sku) · ปุ่มสลับ ยอดเสนอ ↔ ยอดขาย
// ────────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { ACCENT, monthIndex } from "../../config/constants.js";
import { fmtNum } from "../../lib/format.js";
import { cardStyle } from "../ui.js";

// แบ่งสัปดาห์จากวันที่
const weekRangeLabel = (w) =>
  ["Week 1-7", "Week 8-14", "Week 15-21", "Week 22-28", "Week 29-31"][w - 1] || `Week ${w}`;
const weekOf = (day) => {
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  if (day <= 28) return 4;
  return 5;
};

const METRICS = [
  { id: "quoted", label: "ยอดเสนอ", field: "quotedRevenue" },
  { id: "revenue", label: "ยอดขาย", field: "revenue" },
];

export default function OfferVsSalesPanel({ rows }) {
  const [metric, setMetric] = useState("quoted"); // quoted | revenue
  const activeField = METRICS.find((m) => m.id === metric).field;

  const months = useMemo(() => {
    if (!rows || rows.length === 0) return [];

    // 3 เดือนล่าสุด
    const monthKeys = {};
    for (const r of rows) {
      const mi = monthIndex(r.month);
      if (mi < 0) continue;
      const key = r.year * 100 + mi;
      if (!monthKeys[key]) monthKeys[key] = { year: r.year, mi, month: r.month };
    }
    const sortedKeys = Object.keys(monthKeys).map(Number).sort((a, b) => a - b).slice(-3);

    return sortedKeys.map((key) => {
      const { year, mi, month } = monthKeys[key];
      // weeks[w][sku] = ยอดรวม
      const weeks = {};
      const skuSet = new Set();
      for (const r of rows) {
        if (r.year !== year || monthIndex(r.month) !== mi) continue;
        const w = weekOf(r.day && r.day >= 1 ? r.day : 1);
        const sku = r.sku || "อื่นๆ";
        skuSet.add(sku);
        if (!weeks[w]) weeks[w] = {};
        weeks[w][sku] = (weeks[w][sku] || 0) + (r[activeField] || 0);
      }
      const weekList = Object.keys(weeks).map(Number).sort((a, b) => a - b);
      return { year, month, weeks, weekList, skus: [...skuSet] };
    });
  }, [rows, activeField]);

  return (
    <div style={cardStyle}>
      {/* หัว + ปุ่มสลับ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 17, color: "var(--text-heading)", fontWeight: 700 }}>
            ยอดเสนอ vs ยอดขาย — รายสัปดาห์ (3 เดือนล่าสุด)
          </div>
          <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>
            แยกตามกลุ่มสินค้า · กดปุ่มสลับมุมมอง
          </div>
        </div>
        <div style={{ display: "inline-flex", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-default)" }}>
          {METRICS.map((m) => {
            const active = metric === m.id;
            return (
              <button key={m.id} onClick={() => setMetric(m.id)}
                style={{
                  padding: "8px 18px", fontSize: 14, cursor: "pointer", border: "none",
                  background: active ? ACCENT : "var(--bg-chip)",
                  color: active ? "#fff" : "var(--text-muted)", fontWeight: active ? 700 : 500,
                  fontFamily: "'IBM Plex Sans Thai', sans-serif",
                }}>
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {months.length === 0 && (
        <div style={{ fontSize: 14, color: "var(--text-faint)", padding: "20px 0" }}>ไม่มีข้อมูล</div>
      )}

      {/* 3 เดือนแนวนอน — เลื่อนซ้าย-ขวาได้ */}
      <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
        {months.map((m) => (
          <div key={`${m.year}-${m.month}`} style={{ flex: "1 1 0", minWidth: 320 }}>
            {/* ชื่อเดือน */}
            <div style={{
              textAlign: "center", fontSize: 15, fontWeight: 700, color: "var(--text-heading)",
              background: "var(--bg-chip)", border: "1px solid var(--border-default)",
              borderRadius: 8, padding: "8px 0", marginBottom: 8,
            }}>
              {m.month} {m.year}
            </div>

            {/* คอลัมน์รายสัปดาห์ */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
              {m.weekList.map((w) => (
                <div key={w} style={{ flex: "1 1 0", minWidth: 120 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: ACCENT, textAlign: "center",
                    background: "var(--bg-chip)", borderRadius: 6, padding: "5px 0", marginBottom: 6,
                  }}>
                    {weekRangeLabel(w)}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {m.skus.map((sku) => (
                      <div key={sku} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        fontSize: 12, padding: "5px 8px", borderRadius: 6,
                        background: "var(--bg-page)", border: "1px solid var(--border-subtle)",
                      }}>
                        <span style={{ color: "var(--text-body)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 80 }}>{sku}</span>
                        <span style={{ color: ACCENT, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>
                          {fmtNum(m.weeks[w][sku] || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
