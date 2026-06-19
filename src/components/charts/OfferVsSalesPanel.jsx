// ────────────────────────────────────────────────────────────────
// OfferVsSalesPanel.jsx — ตารางยอดเสนอ vs ยอดขาย
//   แสดง 3 เดือนล่าสุด แยกเป็นรายสัปดาห์ของแต่ละเดือน
//   สัปดาห์แบ่งตามวันที่: 1-7, 8-14, 15-21, 22-28, 29-สิ้นเดือน
// ────────────────────────────────────────────────────────────────
import { useMemo } from "react";
import { ACCENT, monthIndex } from "../../config/constants.js";
import { fmtNum, fmtDec } from "../../lib/format.js";
import { cardStyle } from "../ui.js";

// ชื่อสัปดาห์จากวันที่
const weekOf = (day) => {
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  if (day <= 28) return 4;
  return 5;
};

export default function OfferVsSalesPanel({ rows }) {
  const months = useMemo(() => {
    if (!rows || rows.length === 0) return [];

    // หา 3 เดือนล่าสุดจากข้อมูล (เรียงตาม year*100+monthIndex)
    const monthKeys = {};
    for (const r of rows) {
      const mi = monthIndex(r.month);
      if (mi < 0) continue;
      const key = r.year * 100 + mi;
      if (!monthKeys[key]) monthKeys[key] = { year: r.year, mi, month: r.month };
    }
    const sortedKeys = Object.keys(monthKeys).map(Number).sort((a, b) => b - a).slice(0, 3);

    return sortedKeys.map((key) => {
      const { year, mi, month } = monthKeys[key];
      // รวมยอดของแต่ละสัปดาห์
      const weeks = {};
      for (const r of rows) {
        if (r.year !== year || monthIndex(r.month) !== mi) continue;
        const w = weekOf(r.day && r.day >= 1 ? r.day : 1);
        if (!weeks[w]) weeks[w] = { quoted: 0, revenue: 0 };
        weeks[w].quoted += r.quotedRevenue || 0;
        weeks[w].revenue += r.revenue || 0;
      }
      const weekRows = Object.keys(weeks).map(Number).sort((a, b) => a - b).map((w) => ({
        week: w,
        quoted: weeks[w].quoted,
        revenue: weeks[w].revenue,
        closeRate: weeks[w].quoted > 0 ? (weeks[w].revenue / weeks[w].quoted) * 100 : 0,
      }));
      const totQuoted = weekRows.reduce((a, r) => a + r.quoted, 0);
      const totRevenue = weekRows.reduce((a, r) => a + r.revenue, 0);
      return {
        year, month,
        weeks: weekRows,
        totQuoted, totRevenue,
        totClose: totQuoted > 0 ? (totRevenue / totQuoted) * 100 : 0,
      };
    });
  }, [rows]);

  return (
    <div style={cardStyle}>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 17, color: "var(--text-heading)", fontWeight: 700 }}>
          ยอดเสนอ vs ยอดขาย — รายสัปดาห์ (3 เดือนล่าสุด)
        </div>
        <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>
          แยกตามเดือน · แต่ละแถวคือสัปดาห์ของเดือนนั้น
        </div>
      </div>

      {months.length === 0 && (
        <div style={{ fontSize: 14, color: "var(--text-faint)", padding: "20px 0" }}>ไม่มีข้อมูล</div>
      )}

      {months.map((m) => (
        <div key={`${m.year}-${m.month}`} style={{ marginTop: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: ACCENT, marginBottom: 8 }}>
            {m.month} {m.year}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                <th style={thLeft}>สัปดาห์</th>
                <th style={thRight}>ยอดเสนอ</th>
                <th style={thRight}>ยอดขาย</th>
                <th style={thRight}>อัตราปิด</th>
              </tr>
            </thead>
            <tbody>
              {m.weeks.map((w) => (
                <tr key={w.week} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={tdLeft}>สัปดาห์ {w.week}</td>
                  <td style={tdRight}>{fmtNum(w.quoted)} บาท</td>
                  <td style={{ ...tdRight, color: ACCENT, fontWeight: 600 }}>{fmtNum(w.revenue)} บาท</td>
                  <td style={tdRight}>{fmtDec(w.closeRate, 1)}%</td>
                </tr>
              ))}
              {/* แถวรวมของเดือน */}
              <tr style={{ borderTop: "2px solid var(--border-default)", background: "var(--bg-chip)" }}>
                <td style={{ ...tdLeft, fontWeight: 700 }}>รวมทั้งเดือน</td>
                <td style={{ ...tdRight, fontWeight: 700 }}>{fmtNum(m.totQuoted)} บาท</td>
                <td style={{ ...tdRight, fontWeight: 700, color: ACCENT }}>{fmtNum(m.totRevenue)} บาท</td>
                <td style={{ ...tdRight, fontWeight: 700 }}>{fmtDec(m.totClose, 1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

const thLeft = { textAlign: "left", padding: "8px 10px", color: "var(--text-faint)", fontWeight: 600, fontSize: 13 };
const thRight = { textAlign: "right", padding: "8px 10px", color: "var(--text-faint)", fontWeight: 600, fontSize: 13 };
const tdLeft = { textAlign: "left", padding: "9px 10px", color: "var(--text-body)" };
const tdRight = { textAlign: "right", padding: "9px 10px", color: "var(--text-body)", fontFamily: "'IBM Plex Mono', monospace" };
