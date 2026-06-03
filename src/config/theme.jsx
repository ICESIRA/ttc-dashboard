// ─────────────────────────────────────────────────────────────
// theme.js — ธีม light/dark (CSS variables) + คอมโพเนนต์ ThemeStyle
// ─────────────────────────────────────────────────────────────

export const THEMES = {
  dark: {
    "--bg-page": "#0f172a",
    "--bg-card": "#0b1220",
    "--bg-chip": "#1e293b",
    "--accent": "#38bdf8",
    "--text-heading": "#f1f5f9",
    "--text-primary": "#e2e8f0",
    "--text-body": "#cbd5e1",
    "--text-muted": "#94a3b8",
    "--text-dim": "#64748b",
    "--text-faint": "#475569",
    "--border-default": "#475569",
    "--border-subtle": "#1e293b",
    "--card-row-bg": "#0f172a",
    "--card-row-border": "#1e293b",
    "--card-row-shadow": "none",
    "--tooltip-bg": "#1e293b",
    "--tooltip-border": "#334155",
    "--tooltip-text": "#f1f5f9",
    "--popup-bg": "#0b1220",
    "--popup-shadow": "0 8px 24px rgba(0,0,0,0.5)",
  },
  light: {
    "--bg-page": "#f8fafc",
    "--bg-card": "#ffffff",
    "--bg-chip": "#e2e8f0",
    "--accent": "#2563eb",
    "--text-heading": "#0f172a",
    "--text-primary": "#1e293b",
    "--text-body": "#334155",
    "--text-muted": "#475569",
    "--text-dim": "#64748b",
    "--text-faint": "#94a3b8",
    "--border-default": "#cbd5e1",
    "--border-subtle": "#e2e8f0",
    "--card-row-bg": "#f8fafc",
    "--card-row-border": "#e2e8f0",
    "--card-row-shadow": "0 1px 2px rgba(0,0,0,0.04)",
    "--tooltip-bg": "#ffffff",
    "--tooltip-border": "#cbd5e1",
    "--tooltip-text": "#0f172a",
    "--popup-bg": "#ffffff",
    "--popup-shadow": "0 8px 24px rgba(0,0,0,0.12)",
  },
};

// ใส่ CSS variables ลง :root ตามโหมดที่เลือก
export function ThemeStyle({ mode }) {
  const vars = THEMES[mode] || THEMES.light;
  const cssText = Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join(" ");
  return <style>{`:root { ${cssText} }`}</style>;
}
