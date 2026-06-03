// ─────────────────────────────────────────────────────────────
// ui.js — style ที่ใช้ซ้ำหลายที่ (tooltip ของ Recharts + การ์ด)
// ─────────────────────────────────────────────────────────────

// style ของ tooltip ใน Recharts (อ้าง CSS var ตามธีม)
export const tooltipProps = {
  contentStyle: {
    background: "var(--tooltip-bg)",
    border: "1px solid var(--tooltip-border)",
    borderRadius: 8,
    fontSize: 14,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  labelStyle: { color: "var(--tooltip-text)", fontWeight: 600 },
  itemStyle: { color: "var(--tooltip-text)" },
};

// style การ์ดมาตรฐาน
export const cardStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: 12,
  padding: "16px 20px",
};

export const cardTitle = { fontSize: 14, color: "var(--text-dim)", marginBottom: 4 };
export const cardSubtitle = { fontSize: 12, color: "var(--text-faint)", marginBottom: 12 };
