// ─────────────────────────────────────────────────────────────
// KPICard.jsx — การ์ดแสดง KPI 1 ตัว (รองรับ delta เทียบเดือน)
// ─────────────────────────────────────────────────────────────

export default function KPICard({ label, value, sub, color, delta }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ fontSize: 12, color: "var(--text-faint)" }}>{label}</div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color,
          fontFamily: "'Space Mono', monospace",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{sub}</div>}
      {delta && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: delta.pct >= 0 ? "#10b981" : "#f87171",
          }}
        >
          {delta.pct >= 0 ? "▲" : "▼"} {Math.abs(delta.pct).toFixed(1)}%
          <span style={{ color: "var(--text-faint)", marginLeft: 4, fontWeight: 400 }}>
            {delta.label}
          </span>
        </div>
      )}
    </div>
  );
}
