// ─────────────────────────────────────────────────────────────
// KPICard.jsx — การ์ด KPI 1 ตัว
// value รับได้ 2 แบบ:
//   - string ปกติ เช่น "12.5%"
//   - object { num, unit } → render หน่วย (พัน/ล้าน/บาท/ครั้ง) เล็กกว่าตัวเลข
// ─────────────────────────────────────────────────────────────

export default function KPICard({ label, value, sub, color, delta }) {
  const isParts = value && typeof value === "object" && "num" in value;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ fontSize: 14, color: "var(--text-faint)" }}>{label}</div>
      <div
        style={{
          color,
          fontFamily: "'IBM Plex Mono', monospace",
          fontWeight: 700,
          lineHeight: 1.1,
          display: "flex",
          alignItems: "baseline",
          gap: 5,
          flexWrap: "wrap",
        }}
      >
        {isParts ? (
          <>
            <span style={{ fontSize: 30 }}>{value.num}</span>
            {value.unit && (
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-dim)" }}>
                {value.unit}
              </span>
            )}
          </>
        ) : (
          <span style={{ fontSize: 30 }}>{value}</span>
        )}
      </div>
      {sub && <div style={{ fontSize: 13, color: "var(--text-dim)" }}>{sub}</div>}
      {delta && delta.pct !== null && delta.pct !== undefined && (
        <div style={{ fontSize: 13, fontWeight: 600, color: delta.pct >= 0 ? "#10b981" : "#f87171" }}>
          {delta.pct >= 0 ? "▲" : "▼"} {Math.abs(delta.pct).toFixed(1)}%
          <span style={{ color: "var(--text-faint)", marginLeft: 4, fontWeight: 400 }}>{delta.label}</span>
        </div>
      )}
    </div>
  );
}
