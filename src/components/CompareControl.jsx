// ─────────────────────────────────────────────────────────────
// CompareControl.jsx — เลือกโหมดเทียบ (dropdown) + ช่วง (เดือน/เดือนเริ่ม/ปี)
//   months    : เลือกเดือนอิสระหลายเดือน
//   startMonth: เลือกเดือน "เริ่ม" 1 เดือน → ระบบไล่ย้อนหลังให้ (3/6)
//   year      : เลือกปี
// ─────────────────────────────────────────────────────────────

import { MONTHS, ACCENT } from "../config/constants.js";
import { COMPARE_MODES, getMode, lookbackMonths } from "../lib/compare.js";

const chip = (active, color) => ({
  padding: "7px 16px", borderRadius: 20, fontSize: 15, cursor: "pointer", transition: "all 0.15s",
  background: active ? color : "var(--bg-chip)",
  border: `1px solid ${active ? color : "var(--border-default)"}`,
  color: active ? "#fff" : "var(--text-muted)", fontWeight: active ? 600 : 400,
});

export default function CompareControl({
  mode, selMonths, selYears, startMonth, activeYear, availableYears,
  onChangeMode, onToggleMonth, onToggleYear, onSetStartMonth, onChangeActiveYear,
}) {
  const m = getMode(mode);
  const previewMonths = m.pick === "startMonth" && startMonth ? lookbackMonths(startMonth, m.lookback) : [];

  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 14,
      padding: "16px 20px", marginBottom: 18, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 15, color: "var(--text-muted)", fontWeight: 500 }}>โหมดเทียบ:</span>
        <select value={mode} onChange={(e) => onChangeMode(e.target.value)}
          style={{
            fontSize: 15, padding: "8px 14px", borderRadius: 10, cursor: "pointer",
            background: "var(--bg-chip)", color: "var(--text-primary)", border: `1.5px solid ${ACCENT}`,
            fontFamily: "'IBM Plex Sans Thai', sans-serif", fontWeight: 600,
          }}>
          {COMPARE_MODES.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
        </select>
      </div>

      <div style={{ width: 1, height: 24, background: "var(--border-subtle)" }} />

      {m.pick === "year" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 15, color: "var(--text-muted)" }}>เลือกปี:</span>
          {availableYears.map((y) => (
            <button key={y} onClick={() => onToggleYear(y)} style={chip(selYears.includes(y), "#7c3aed")}>{y}</button>
          ))}
        </div>
      ) : m.pick === "startMonth" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 15, color: "var(--text-muted)" }}>เลือกเดือนเริ่ม (ระบบไล่ย้อนหลัง {m.lookback} เดือน):</span>
          {MONTHS.map((mm) => (
            <button key={mm} onClick={() => onSetStartMonth(mm)}
              style={chip(startMonth === mm, ACCENT)}
              title={previewMonths.length && startMonth === mm ? previewMonths.join(", ") : ""}>
              {mm}
            </button>
          ))}
          <div style={{ width: 1, height: 24, background: "var(--border-subtle)", margin: "0 4px" }} />
          <span style={{ fontSize: 15, color: "var(--text-muted)" }}>ปี:</span>
          <select value={activeYear || ""} onChange={(e) => onChangeActiveYear(e.target.value ? Number(e.target.value) : null)}
            style={{ fontSize: 15, padding: "7px 12px", borderRadius: 10, cursor: "pointer", background: "var(--bg-chip)", color: "var(--text-primary)", border: "1px solid var(--border-default)", fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>
            <option value="">ทุกปี</option>
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          {previewMonths.length > 0 && (
            <span style={{ fontSize: 14, color: ACCENT, marginLeft: 4 }}>→ {previewMonths.join(" · ")}</span>
          )}
        </div>
      ) : (
        // months / daily
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 15, color: "var(--text-muted)" }}>
            {m.id === "daily" ? "เลือก 1 เดือน:" : "เลือกเดือน (กดได้หลายเดือน):"}
          </span>
          {MONTHS.map((mm) => {
            const active = selMonths.includes(mm);
            const isMax = !active && m.limit && selMonths.length >= m.limit;
            return (
              <button key={mm} onClick={() => !isMax && onToggleMonth(mm)} disabled={isMax}
                style={{ ...chip(active, ACCENT), opacity: isMax ? 0.35 : 1, cursor: isMax ? "not-allowed" : "pointer" }}>
                {mm}
              </button>
            );
          })}
          <div style={{ width: 1, height: 24, background: "var(--border-subtle)", margin: "0 4px" }} />
          <span style={{ fontSize: 15, color: "var(--text-muted)" }}>ปี:</span>
          <select value={activeYear || ""} onChange={(e) => onChangeActiveYear(e.target.value ? Number(e.target.value) : null)}
            style={{ fontSize: 15, padding: "7px 12px", borderRadius: 10, cursor: "pointer", background: "var(--bg-chip)", color: "var(--text-primary)", border: "1px solid var(--border-default)", fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>
            <option value="">ทุกปี</option>
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
