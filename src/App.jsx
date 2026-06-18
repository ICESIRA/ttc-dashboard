// ──────────────────────────────────────────────────────────────
// App.jsx — root: โหลดธีม + ข้อมูล แล้วส่งให้ Dashboard
// จัดการหน้า loading รอบแรก + หน้า error ถ้ายังไม่มีข้อมูลเลย
//
// ZOOM = ขยายทั้งหน้าเหมือนกดซูมเบราว์เซอร์ (1 = 100%, 1.5 = 150%)
//   อยากปรับขนาดทั้ง dashboard แก้เลขตรง ZOOM ค่าเดียว
// ──────────────────────────────────────────────────────────────

import { useState } from "react";
import { ThemeStyle } from "./config/theme.jsx";
import { useSheetData } from "./data/useSheetData.js";
import Dashboard from "./components/Dashboard.jsx";

const ZOOM = 1.8; // 180% — ขยายทั้งหน้า (แก้เลขนี้ปรับขนาด: 1.5=150%, 2=200%)

function Center({ children }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 12,
      fontFamily: "'IBM Plex Sans Thai', sans-serif", color: "var(--text-primary)", background: "var(--bg-page)",
    }}>
      {children}
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState("light");
  const { rows, adSpendDaily, loading, error, lastUpdated, refresh } = useSheetData();
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // รอบแรก: กำลังโหลด
  if (loading) {
    return (
      <>
        <ThemeStyle mode={theme} />
        <Center>
          <div style={{
            width: 48, height: 48, border: "4px solid var(--border-default)",
            borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite",
          }} />
          <div style={{ fontSize: 18, fontWeight: 600 }}>กำลังโหลด Dashboard...</div>
          <div style={{ fontSize: 13, color: "var(--text-dim)" }}>TTC Factory</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </Center>
      </>
    );
  }

  // โหลดครั้งแรกไม่สำเร็จ และยังไม่มีข้อมูลเลย
  if (error && rows.length === 0) {
    return (
      <>
        <ThemeStyle mode={theme} />
        <Center>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>โหลดข้อมูลไม่สำเร็จ</div>
          <div style={{ fontSize: 14, color: "var(--text-dim)", maxWidth: 420, textAlign: "center" }}>{error}</div>
          <button onClick={refresh}
            style={{ marginTop: 8, background: "var(--accent)", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            ลองใหม่
          </button>
        </Center>
      </>
    );
  }

  return (
    <>
      <ThemeStyle mode={theme} />
      <div style={{ zoom: ZOOM }}>
        <Dashboard
          rows={rows} adSpendDaily={adSpendDaily} theme={theme} onToggleTheme={toggleTheme}
          error={error} lastUpdated={lastUpdated} onRefresh={refresh}
        />
      </div>
    </>
  );
}
