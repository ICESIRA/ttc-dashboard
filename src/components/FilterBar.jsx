// ─────────────────────────────────────────────────────────────
// FilterBar.jsx — แถบ filter เดือน (multi-select) + ปี
// 2 เดือนแรกที่กด = base เปรียบเทียบ (สีฟ้า), เดือนถัดไป = filter เสริม (เหลือง)
// ─────────────────────────────────────────────────────────────

import { MONTHS, YEARS, CURRENT_YEAR, ACCENT } from "../config/constants.js";
import { getLatestMonthsForYear } from "../lib/format.js";

export default function FilterBar({
  activeMonths, activeYear, showAllMonths,
  onToggleMonth, onChangeYear, onToggleShowAll,
}) {
  const isMonthActive = (m) => activeMonths.includes(m);
  const isBase = (m) => activeMonths.indexOf(m) === 0 || activeMonths.indexOf(m) === 1;

  const latestMonths = getLatestMonthsForYear(activeYear || CURRENT_YEAR);
  const monthsToShow = showAllMonths
    ? MONTHS
    : MONTHS.filter((m) => latestMonths.includes(m) || isMonthActive(m));

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: "var(--text-faint)" }}>เดือน:</span>

      {monthsToShow.map((m) => {
        const active = isMonthActive(m);
        const activeColor = isBase(m) ? ACCENT : "#f59e0b";
        return (
          <button key={m} onClick={() => onToggleMonth(m)}
            style={{
              padding: "5px 12px", borderRadius: 16, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
              background: active ? activeColor : "var(--bg-chip)",
              border: `1px solid ${active ? activeColor : "var(--border-default)"}`,
              color: active ? "#fff" : "var(--text-muted)", fontWeight: active ? 700 : 400,
            }}>
            {m}
          </button>
        );
      })}

      <button onClick={onToggleShowAll}
        style={{
          padding: "5px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer",
          background: "transparent", border: "1px dashed var(--border-default)", color: "var(--text-muted)",
        }}>
        {showAllMonths ? "− ย่อ" : "+ ดูเดือนอื่น"}
      </button>

      <div style={{ width: 1, height: 20, background: "var(--bg-chip)", margin: "0 4px" }} />

      <span style={{ fontSize: 13, color: "var(--text-faint)" }}>ปี:</span>
      {YEARS.map((y) => (
        <button key={y} onClick={() => onChangeYear(y)}
          style={{
            padding: "5px 14px", borderRadius: 16, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
            background: activeYear === y ? "#7c3aed" : "var(--bg-chip)",
            border: `1px solid ${activeYear === y ? "#7c3aed" : "var(--border-default)"}`,
            color: activeYear === y ? "#fff" : "var(--text-muted)", fontWeight: activeYear === y ? 700 : 400,
          }}>
          {y}
        </button>
      ))}

      <div style={{ marginLeft: 8, fontSize: 12, color: "var(--text-dim)" }}>
        {activeMonths.length === 0 && !activeYear
          ? "ยังไม่ได้เลือก · แสดงข้อมูลทั้งหมด"
          : `เลือก ${activeMonths.length} เดือน · ปี ${activeYear || "ทั้งหมด"}`}
      </div>
    </div>
  );
}
