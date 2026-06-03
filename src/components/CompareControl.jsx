// ─────────────────────────────────────────────────────────────
// CompareControl.jsx — เลือกโหมดเทียบ (dropdown) + เลือกช่วง (เดือน/ปี)
// บังคับ limit ตามโหมด (เช่น 2 เดือน เลือกได้ไม่เกิน 2)
// ─────────────────────────────────────────────────────────────

import { MONTHS, ACCENT } from "../config/constants.js";
import { COMPARE_MODES, getMode } from "../lib/compare.js";

const chipStyle = (active, color) => ({
  padding: "7px 16px",
  borderRadius: 20,
  fontSize: 15,
  cursor: "pointer",
  transition: "all 0.15s",
  background: active ? color : "var(--bg-chip)",
  border: `1px solid ${active ? color : "var(--border-default)"}`,
  color: active ? "#fff" : "var(--text-muted)",
  fontWeight: active ? 600 : 400,
});

export default function CompareControl({
  mode, selMonths, selYears, activeYear, availableYears,
  onChangeMode, onToggleMonth, onToggleYear, onChangeActiveYear,
}) {
  const m = getMode(mode);

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
      borderRadius: 14, padding: "16px 20px", marginBottom: 18,
      display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center",
    }}>
      {/* dropdown โหมด */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 15, color: "var(--text-muted)", fontWeight: 500 }}>โหมดเทียบ:</span>
        <select value={mode} onChange={(e) => onChangeMode(e.target.value)}
          style={{
            fontSize: 15, padding: "8px 14px", borderRadius: 10, cursor: "pointer",
            background: "var(--bg-chip)", color: "var(--text-primary)",
            border: `1.5px solid ${ACCENT}`, fontFamily: "'IBM Plex Sans Thai', sans-serif",
            fontWeight: 600,
          }}>
          {COMPARE_MODES.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div style={{ width: 1, height: 24, background: "var(--border-subtle)" }} />

      {/* ตัวเลือกปี (โหมด year) */}
      {m.pick === "year" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 15, color: "var(--text-muted)" }}>เลือกปี:</span>
          {availableYears.map((y) => (
            <button key={y} onClick={() => onToggleYear(y)} style={chipStyle(selYears.includes(y), "#7c3aed")}>
              {y}
            </button>
          ))}
        </div>
      ) : (
        // ตัวเลือกเดือน (โหมด month/daily)
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 15, color: "var(--text-muted)" }}>
            เลือกเดือน {m.limit ? `(สูงสุด ${m.limit})` : ""}:
          </span>
          {MONTHS.map((mm) => {
            const active = selMonths.includes(mm);
            const isMax = !active && m.limit && selMonths.length >= m.limit;
            return (
              <button key={mm} onClick={() => !isMax && onToggleMonth(mm)}
                disabled={isMax}
                style={{ ...chipStyle(active, ACCENT), opacity: isMax ? 0.35 : 1, cursor: isMax ? "not-allowed" : "pointer" }}>
                {mm}
              </button>
            );
          })}

          {/* ปีที่ใช้กรอง (โหมดเดือน) */}
          <div style={{ width: 1, height: 24, background: "var(--border-subtle)", margin: "0 4px" }} />
          <span style={{ fontSize: 15, color: "var(--text-muted)" }}>ปี:</span>
          <select value={activeYear || ""} onChange={(e) => onChangeActiveYear(e.target.value ? Number(e.target.value) : null)}
            style={{
              fontSize: 15, padding: "7px 12px", borderRadius: 10, cursor: "pointer",
              background: "var(--bg-chip)", color: "var(--text-primary)",
              border: "1px solid var(--border-default)", fontFamily: "'IBM Plex Sans Thai', sans-serif",
            }}>
            <option value="">ทุกปี</option>
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
