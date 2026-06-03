// ─────────────────────────────────────────────────────────────
// Header.jsx — หัว dashboard: ชื่อ + สถานะข้อมูล + ปุ่ม theme/clear
// แสดงสถานะ auto-refresh (อัปเดตล่าสุดเมื่อกี่วินาทีที่แล้ว / error)
// ─────────────────────────────────────────────────────────────

import { ACCENT } from "../config/constants.js";

function fmtTime(date) {
  if (!date) return "—";
  return date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function Header({
  filteredCount, totalCount, hasFilter, theme,
  error, lastUpdated, onToggleTheme, onClearFilters, onRefresh,
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
      <div>
        <div style={{ fontSize: 13, color: "var(--accent)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
          TTC FACTORY · SKU ANALYTICS
        </div>
        <h1 style={{ margin: 0, fontSize: 29, fontWeight: 700, color: "var(--text-heading)" }}>Sales Dashboard</h1>
        <div style={{ fontSize: 14, color: "var(--text-faint)", marginTop: 2 }}>
          {filteredCount.toLocaleString()} แถว / {totalCount.toLocaleString()} แถวทั้งหมด
          {hasFilter && <span style={{ color: ACCENT, marginLeft: 8 }}>● กำลัง filter อยู่</span>}
        </div>
        <div style={{ fontSize: 12, color: error ? "#f87171" : "var(--text-dim)", marginTop: 4 }}>
          {error
            ? `⚠ ${error} (กำลังใช้ข้อมูลล่าสุดที่โหลดได้)`
            : `🟢 อัปเดตอัตโนมัติทุก 30 วิ · ล่าสุด ${fmtTime(lastUpdated)}`}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {hasFilter && (
          <button onClick={onClearFilters}
            style={{ background: "var(--bg-chip)", border: "1px solid var(--border-default)", color: "var(--text-muted)", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
            ล้าง filter ทั้งหมด ×
          </button>
        )}
        <button onClick={onRefresh} title="โหลดข้อมูลใหม่ตอนนี้"
          style={{ background: "var(--bg-chip)", border: "1px solid var(--border-default)", color: "var(--text-primary)", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 16, width: 38, height: 38 }}>
          ↻
        </button>
        <button onClick={onToggleTheme}
          title={theme === "light" ? "เปลี่ยนเป็นโหมดมืด" : "เปลี่ยนเป็นโหมดสว่าง"}
          style={{
            background: "var(--bg-chip)", border: "1px solid var(--border-default)", color: "var(--text-primary)",
            padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 19, lineHeight: 1, width: 38, height: 38,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
          {theme === "light" ? "🌙" : "☀"}
        </button>
      </div>
    </div>
  );
}
