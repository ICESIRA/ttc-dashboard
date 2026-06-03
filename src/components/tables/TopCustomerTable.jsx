// ─────────────────────────────────────────────────────────────
// TopCustomerTable.jsx — ตารางลูกค้า Top 10 (เรียงตามยอดขาย)
// ─────────────────────────────────────────────────────────────

import { ACCENT } from "../../config/constants.js";
import { fmtB, fmtNum, sum } from "../../lib/format.js";
import { cardStyle } from "../ui.js";

export default function TopCustomerTable({ topCustomers, allFiltered }) {
  const topTotal = topCustomers.reduce((a, c) => a + c.revenue, 0);
  const overall = sum(allFiltered, "revenue");
  const maxRev = topCustomers[0]?.revenue || 0;

  return (
    <div style={{ ...cardStyle, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <div style={{ fontSize: 14, color: "var(--text-dim)" }}>ลูกค้า Top 10</div>
        <div style={{ fontSize: 12, color: "var(--text-faint)", fontFamily: "'Space Mono'" }}>
          {overall > 0 ? `${((topTotal / overall) * 100).toFixed(0)}% ของยอดรวม` : ""}
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 10 }}>เรียงตามยอดขายรวม · กระทบตาม filter ปัจจุบัน</div>

      {topCustomers.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--text-faint)", padding: "20px 0", textAlign: "center" }}>ไม่มีข้อมูลในช่วงที่เลือก</div>
      ) : (
        <div style={{ flex: 1, minHeight: 200, overflowY: "auto", paddingRight: 4 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead style={{ position: "sticky", top: 0, background: "var(--bg-card)", zIndex: 1 }}>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <th style={{ padding: "6px 4px", textAlign: "left", color: "var(--text-faint)", fontWeight: 500, width: 28 }}>#</th>
                <th style={{ padding: "6px 4px", textAlign: "left", color: "var(--text-faint)", fontWeight: 500 }}>ชื่อลูกค้า</th>
                <th style={{ padding: "6px 4px", textAlign: "right", color: "var(--text-faint)", fontWeight: 500 }}>ยอดขาย</th>
                <th style={{ padding: "6px 4px", textAlign: "right", color: "var(--text-faint)", fontWeight: 500, width: 60 }}>ออเดอร์</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((c, i) => {
                const pct = maxRev > 0 ? (c.revenue / maxRev) * 100 : 0;
                return (
                  <tr key={c.name} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "8px 4px", color: i < 3 ? ACCENT : "var(--text-faint)", fontWeight: i < 3 ? 700 : 400, fontSize: 13, fontFamily: "'Space Mono'" }}>
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td style={{ padding: "8px 4px" }}>
                      <div style={{ position: "relative" }}>
                        <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: `${ACCENT}15`, borderRadius: 3, zIndex: 0 }} />
                        <span style={{ position: "relative", zIndex: 1, color: "var(--text-body)", fontSize: 14 }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "8px 4px", textAlign: "right", color: i === 0 ? ACCENT : "var(--text-muted)", fontFamily: "'Space Mono'", fontWeight: i === 0 ? 700 : 500 }}>
                      {fmtB(c.revenue)}
                    </td>
                    <td style={{ padding: "8px 4px", textAlign: "right", color: "var(--text-dim)", fontFamily: "'Space Mono'", fontSize: 13 }}>
                      {fmtNum(c.orders)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
