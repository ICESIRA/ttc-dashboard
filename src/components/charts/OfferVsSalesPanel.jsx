// ────────────────────────────────────────────────────────────────
// OfferVsSalesPanel.jsx — ตารางยอดเสนอ/ยอดขาย รายสัปดาห์ (เลือกเดือนได้)
//   แสดงทีละเดือน · dropdown เลือกเดือน · แบ่งคอลัมน์รายสัปดาห์
//   แต่ละช่องแยกตามกลุ่มสินค้า (sku) · ปุ่มสลับ ยอดเสนอ ↔ ยอดขาย
// ────────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { ACCENT, monthIndex } from "../../config/constants.js";
import { fmtNum } from "../../lib/format.js";
import { cardStyle } from "../ui.js";

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
  const [metric, setMetric] = useState("quoted");
  const [selectedKey, setSelectedKey] = useState(null); // year*100+mi
  const activeField = METRICS.find((m) => m.id === metric).field;

  // รายชื่อเดือนทั้งหมดที่มีข้อมูล (ใหม่→เก่า)
  const monthOptions = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    const map = {};
    for (const r of rows) {
      const mi = monthIndex(r.month);
      if (mi < 0) continue;
      const key = r.year * 100 + mi;
      if (!map[key]) map[key] = { key, year: r.year, mi, month: r.month };
    }
    return Object.values(map).sort((a, b) => b.key - a.key);
  }, [rows]);

  // เดือนที่เลือก (default = ล่าสุด)
  const activeKey = selectedKey != null && monthOptions.some((m) => m.key === selectedKey)
    ? selectedKey
    : (monthOptions[0] && monthOptions[0].key);

  // ข้อมูลของเดือนที่เลือก
  const monthData = useMemo(() => {
    if (activeKey == null) return null;
    const opt = monthOptions.find((m) => m.key === activeKey);
    if (!opt) return null;
    const { year, mi, month } = opt;
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
  }, [rows, activeKey, activeField, monthOptions]);

  return (
    <div style={cardStyle}>
      {/* หัว + ปุ่มสลับ */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 17, color: "var(--text-heading)", fontWeight: 700 }}>
            ยอดเสนอ vs ยอดขาย — รายสัปดาห์
          </div>
          <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>
            แยกตามกลุ่มสินค้า · เลือกเดือน + สลับมุมมองได้
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* dropdown เลือกเดือน */}
          <select
            value={activeKey ?? ""}
            onChange={(e) => setSelectedKey(Number(e.target.value))}
            style={{
              padding: "8px 12px", borderRadius: 10, fontSize: 14, cursor: "pointer",
              background: "var(--bg-chip)", color: "var(--text-primary)",
              border: "1px solid var(--border-default)", fontFamily: "'IBM Plex Sans Thai', sans-serif",
            }}>
            {monthOptions.map((m) => (
              <option key={m.key} value={m.key}>{m.month} {m.year}</option>
            ))}
          </select>
          {/* ปุ่มสลับ ยอดเสนอ/ยอดขาย */}
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
      </div>

      {!monthData && (
        <div style={{ fontSize: 14, color: "var(--text-faint)", padding: "20px 0" }}>ไม่มีข้อมูล</div>
      )}

      {monthData && (
        <div>
          {/* ชื่อเดือน */}
          <div style={{
            textAlign: "center", fontSize: 15, fontWeight: 700, color: "var(--text-heading)",
            background: "var(--bg-chip)", border: "1px solid var(--border-default)",
            borderRadius: 8, padding: "8px 0", marginBottom: 10,
          }}>
            {monthData.month} {monthData.year}
          </div>

          {/* คอลัมน์รายสัปดาห์ */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
            {monthData.weekList.map((w) => (
              <div key={w} style={{ flex: "1 1 0", minWidth: 150 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: ACCENT, textAlign: "center",
                  background: "var(--bg-chip)", borderRadius: 6, padding: "6px 0", marginBottom: 8,
                }}>
                  {weekRangeLabel(w)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {monthData.skus.map((sku) => (
                    <div key={sku} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      fontSize: 13, padding: "7px 10px", borderRadius: 6,
                      background: "var(--bg-page)", border: "1px solid var(--border-subtle)",
                    }}>
                      <span style={{ color: "var(--text-body)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 90 }}>{sku}</span>
                      <span style={{ color: ACCENT, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", flexShrink: 0 }}>
                        {fmtNum(monthData.weeks[w][sku] || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
