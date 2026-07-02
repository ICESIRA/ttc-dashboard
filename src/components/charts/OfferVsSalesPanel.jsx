// ────────────────────────────────────────────────────────────────
// OfferVsSalesPanel.jsx — ตารางยอดเสนอ/ยอดขาย รายสัปดาห์ (เลือกเดือนได้)
//   แสดงทีละเดือน · dropdown เลือกเดือน · แบ่งคอลัมน์รายสัปดาห์
//   แต่ละสัปดาห์เป็น "ตารางย่อย": SKU | ยอดเสนอ | ยอดขาย | ratio (ปิดได้)
// ────────────────────────────────────────────────────────────────
import { useMemo, useState } from "react";
import { ACCENT, monthIndex } from "../../config/constants.js";
import { fmtNum } from "../../lib/format.js";
import { cardStyle } from "../ui.js";

// label สัปดาห์ — รับจำนวนวันสุดท้ายของเดือนเพื่อระบุช่วงให้ถูก
const weekRangeLabel = (w, daysInMonth) => {
  const ranges = [
    [1, 7], [8, 14], [15, 21], [22, 28], [29, daysInMonth || 31],
  ];
  const r = ranges[w - 1];
  if (!r) return `Week ${w}`;
  return `Week ${r[0]}-${r[1]}`;
};
// จำนวนวันในเดือน (mi = 0-11)
const daysInMonthOf = (year, mi) => new Date(year, mi + 1, 0).getDate();
const weekOf = (day) => {
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  if (day <= 28) return 4;
  return 5;
};

// สี ratio: ยิ่งปิดได้สูง ยิ่งเขียว
const ratioColor = (r) => (r >= 50 ? "#16a34a" : r >= 25 ? "#d99514" : "var(--text-faint)");

export default function OfferVsSalesPanel({ rows }) {
  const [selectedKey, setSelectedKey] = useState(null); // year*100+mi
  const [showRatioInfo, setShowRatioInfo] = useState(false); // popup อธิบาย ratio

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

  // ข้อมูลของเดือนที่เลือก — เก็บทั้ง quoted + revenue ต่อ (สัปดาห์ × SKU)
  const monthData = useMemo(() => {
    if (activeKey == null) return null;
    const opt = monthOptions.find((m) => m.key === activeKey);
    if (!opt) return null;
    const { year, mi, month } = opt;
    const weeks = {};          // weeks[w][sku] = { quoted, revenue }
    const skuSet = new Set();
    for (const r of rows) {
      if (r.year !== year || monthIndex(r.month) !== mi) continue;
      const w = weekOf(r.day && r.day >= 1 ? r.day : 1);
      const sku = r.sku || "Others";
      skuSet.add(sku);
      if (!weeks[w]) weeks[w] = {};
      if (!weeks[w][sku]) weeks[w][sku] = { quoted: 0, revenue: 0 };
      weeks[w][sku].quoted += r.quotedRevenue || 0;
      weeks[w][sku].revenue += r.revenue || 0;
    }
    const weekList = Object.keys(weeks).map(Number).sort((a, b) => a - b);
    return { year, month, weeks, weekList, skus: [...skuSet], daysInMonth: daysInMonthOf(year, mi) };
  }, [rows, activeKey, monthOptions]);

  return (
    <div style={{ ...cardStyle, position: "relative" }}>
      {/* popup อธิบาย ratio */}
      {showRatioInfo && (
        <>
          <div onClick={() => setShowRatioInfo(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{
            position: "absolute", top: 14, right: 14, zIndex: 50, width: 300,
            background: "var(--bg-card)", border: `1px solid ${ACCENT}`, borderRadius: 12,
            padding: "14px 16px", boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-heading)" }}>What is ratio?</span>
              <span onClick={() => setShowRatioInfo(false)} style={{ cursor: "pointer", color: "var(--text-faint)", fontSize: 16, lineHeight: 1 }}>✕</span>
            </div>
            <div style={{ fontSize: 13.5, color: "var(--text-body)", lineHeight: 1.7 }}>
              <b style={{ color: ACCENT }}>Close Rate</b><br />
              = Sales ÷ Quoted × 100<br />
              Shows what % of the quoted amount closed into actual sales
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-faint)" }}>
                Color: ≥50% green · ≥25% amber · lower = faint
              </div>
            </div>
          </div>
        </>
      )}

      {/* หัว + dropdown เลือกเดือน */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 17, color: "var(--text-heading)", fontWeight: 700 }}>
            Quoted vs Sales — Weekly
          </div>
          <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>
            By product group · each week shows Quoted / Sales / ratio (close rate)
          </div>
        </div>
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
      </div>

      {!monthData && (
        <div style={{ fontSize: 14, color: "var(--text-faint)", padding: "20px 0" }}>No data</div>
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

          {/* คอลัมน์รายสัปดาห์ — แต่ละอันเป็นตารางย่อย */}
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
            {monthData.weekList.map((w) => {
              // รวมทั้งสัปดาห์ (ทุก SKU)
              const wk = monthData.weeks[w] || {};
              const totQ = monthData.skus.reduce((a, s) => a + (wk[s]?.quoted || 0), 0);
              const totR = monthData.skus.reduce((a, s) => a + (wk[s]?.revenue || 0), 0);
              const totRatio = totQ > 0 ? (totR / totQ) * 100 : 0;
              return (
                <div key={w} style={{ flex: "1 1 0", minWidth: 300 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700, color: ACCENT, textAlign: "center",
                    background: "var(--bg-chip)", borderRadius: 6, padding: "6px 0", marginBottom: 8,
                  }}>
                    {weekRangeLabel(w, monthData.daysInMonth)}
                  </div>

                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, tableLayout: "fixed" }}>
                    <thead>
                      <tr style={{ color: "var(--text-faint)" }}>
                        <th style={{ ...thTd, textAlign: "left", width: "34%" }}>SKU</th>
                        <th style={{ ...thTd, textAlign: "right" }}>Quoted</th>
                        <th style={{ ...thTd, textAlign: "right" }}>Sales</th>
                        <th onClick={() => setShowRatioInfo(true)}
                          title="Close rate = Sales ÷ Quoted × 100 (click for details)"
                          style={{ ...thTd, textAlign: "right", width: "22%", cursor: "pointer", color: ACCENT, textDecoration: "underline dotted", userSelect: "none" }}>
                          ratio ⓘ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthData.skus.map((sku) => {
                        const cell = wk[sku] || { quoted: 0, revenue: 0 };
                        const ratio = cell.quoted > 0 ? (cell.revenue / cell.quoted) * 100 : 0;
                        return (
                          <tr key={sku} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                            <td style={{ ...thTd, textAlign: "left", color: "var(--text-body)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sku}</td>
                            <td style={{ ...thTd, textAlign: "right", color: "var(--text-muted)", fontFamily: mono }}>{fmtNum(cell.quoted)}</td>
                            <td style={{ ...thTd, textAlign: "right", color: ACCENT, fontWeight: 700, fontFamily: mono }}>{fmtNum(cell.revenue)}</td>
                            <td style={{ ...thTd, textAlign: "right", color: ratioColor(ratio), fontWeight: 700, fontFamily: mono }}>{ratio.toFixed(0)}%</td>
                          </tr>
                        );
                      })}
                      {/* แถวรวม */}
                      <tr style={{ borderTop: "2px solid var(--border-default)", background: "var(--bg-page)" }}>
                        <td style={{ ...thTd, textAlign: "left", fontWeight: 700, color: "var(--text-heading)" }}>Total</td>
                        <td style={{ ...thTd, textAlign: "right", fontWeight: 700, fontFamily: mono, color: "var(--text-muted)" }}>{fmtNum(totQ)}</td>
                        <td style={{ ...thTd, textAlign: "right", fontWeight: 700, fontFamily: mono, color: ACCENT }}>{fmtNum(totR)}</td>
                        <td style={{ ...thTd, textAlign: "right", fontWeight: 700, fontFamily: mono, color: ratioColor(totRatio) }}>{totRatio.toFixed(0)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const mono = "'IBM Plex Mono', monospace";
const thTd = { padding: "6px 8px", fontWeight: 500 };
