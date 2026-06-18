// ─────────────────────────────────────────────────────────────
// DateRangePicker.jsx — ตัวเลือก "ช่วงวันที่" (แทน CompareControl เดิม)
//   pill โชว์ YYYY-MM-DD → YYYY-MM-DD · กดเปิด popover
//   แท็บ: ด่วน / เดือน / สัปดาห์ / กำหนดเอง
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { ACCENT } from "../config/constants.js";
import {
  dateToISO, dateToInt, presetRange, monthRange, availableMonths,
} from "../lib/daterange.js";

const TABS = [
  { id: "quick", label: "ด่วน" },
  { id: "month", label: "เดือน" },
  { id: "week", label: "สัปดาห์" },
  { id: "custom", label: "กำหนดเอง" },
];

const QUICK = [
  { id: "thisMonth", label: "เดือนนี้" },
  { id: "last7", label: "7 วันล่าสุด" },
  { id: "last14", label: "14 วันล่าสุด" },
  { id: "last30", label: "30 วันล่าสุด" },
  { id: "thisYear", label: "ปีนี้" },
  { id: "all", label: "ทั้งหมด" },
];

const WEEKS = [
  { id: "thisWeek", label: "สัปดาห์นี้" },
  { id: "lastWeek", label: "สัปดาห์ก่อน" },
  { id: "last2w", label: "2 สัปดาห์ล่าสุด" },
  { id: "last4w", label: "4 สัปดาห์ล่าสุด" },
];

const chipStyle = (active) => ({
  padding: "7px 14px", borderRadius: 18, fontSize: 14, cursor: "pointer", transition: "all 0.15s",
  background: active ? ACCENT : "var(--bg-chip)",
  border: `1px solid ${active ? ACCENT : "var(--border-default)"}`,
  color: active ? "#fff" : "var(--text-muted)", fontWeight: active ? 700 : 400,
  fontFamily: "'IBM Plex Sans Thai', sans-serif",
});

export default function DateRangePicker({ start, end, rows, onChange }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("quick");
  const [customStart, setCustomStart] = useState(dateToISO(start));
  const [customEnd, setCustomEnd] = useState(dateToISO(end));

  const curS = dateToInt(start);
  const curE = dateToInt(end);
  const matches = (r) => dateToInt(r.start) === curS && dateToInt(r.end) === curE;

  const apply = (range) => { onChange(range.start, range.end); setOpen(false); };
  const pickPreset = (id) => apply(presetRange(id, rows));
  const pickMonth = (year, month) => apply(monthRange(year, month, rows));
  const applyCustom = () => {
    const s = new Date(customStart + "T00:00:00");
    const e = new Date(customEnd + "T00:00:00");
    if (isNaN(s) || isNaN(e)) return;
    apply(s <= e ? { start: s, end: e } : { start: e, end: s });
  };

  const months = availableMonths(rows);

  return (
    <div style={{ position: "relative", marginBottom: 18 }}>
      {/* แถบบน: label + pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 15, color: "var(--text-muted)", fontWeight: 500 }}>ช่วงเวลา:</span>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "9px 16px", borderRadius: 12, cursor: "pointer",
            background: "var(--bg-card)", border: `1.5px solid ${ACCENT}`,
            color: "var(--text-primary)", fontSize: 16, fontWeight: 700,
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          <span style={{ fontSize: 16 }}>📅</span>
          <span>{dateToISO(start)}</span>
          <span style={{ color: ACCENT }}>→</span>
          <span>{dateToISO(end)}</span>
          <span style={{ marginLeft: 4, color: "var(--text-faint)", fontSize: 13 }}>▾</span>
        </button>
      </div>

      {open && (
        <>
          {/* backdrop คลิกนอกเพื่อปิด */}
          <div onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40 }} />

          {/* popover */}
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 50,
            minWidth: 380, maxWidth: 460,
            background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
            borderRadius: 14, padding: 14, boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          }}>
            {/* แท็บ */}
            <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border-subtle)", marginBottom: 14 }}>
              {TABS.map((t) => {
                const active = tab === t.id;
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    style={{
                      padding: "8px 16px", fontSize: 15, cursor: "pointer", background: "transparent",
                      border: "none", borderBottom: `2px solid ${active ? ACCENT : "transparent"}`,
                      color: active ? ACCENT : "var(--text-muted)", fontWeight: active ? 700 : 500,
                      fontFamily: "'IBM Plex Sans Thai', sans-serif", marginBottom: -1,
                    }}>
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* เนื้อหาแต่ละแท็บ */}
            {tab === "quick" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {QUICK.map((q) => (
                  <button key={q.id} onClick={() => pickPreset(q.id)}
                    style={chipStyle(matches(presetRange(q.id, rows)))}>
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            {tab === "week" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {WEEKS.map((w) => (
                  <button key={w.id} onClick={() => pickPreset(w.id)}
                    style={chipStyle(matches(presetRange(w.id, rows)))}>
                    {w.label}
                  </button>
                ))}
              </div>
            )}

            {tab === "month" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 180, overflowY: "auto" }}>
                {months.length === 0 && (
                  <span style={{ fontSize: 14, color: "var(--text-faint)" }}>ไม่มีข้อมูลเดือน</span>
                )}
                {months.map((m) => (
                  <button key={`${m.year}-${m.month}`} onClick={() => pickMonth(m.year, m.month)}
                    style={chipStyle(matches(monthRange(m.year, m.month, rows)))}>
                    {m.month} {String(m.year).slice(-2)}
                  </button>
                ))}
              </div>
            )}

            {tab === "custom" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <label style={{ fontSize: 14, color: "var(--text-muted)" }}>จาก</label>
                  <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                    style={inputStyle} />
                  <label style={{ fontSize: 14, color: "var(--text-muted)" }}>ถึง</label>
                  <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                    style={inputStyle} />
                </div>
                <button onClick={applyCustom}
                  style={{
                    alignSelf: "flex-start", padding: "8px 20px", borderRadius: 10, cursor: "pointer",
                    background: ACCENT, color: "#fff", border: "none", fontSize: 14, fontWeight: 700,
                    fontFamily: "'IBM Plex Sans Thai', sans-serif",
                  }}>
                  ใช้ช่วงนี้
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const inputStyle = {
  fontSize: 14, padding: "7px 10px", borderRadius: 8,
  background: "var(--bg-chip)", color: "var(--text-primary)",
  border: "1px solid var(--border-default)", fontFamily: "'IBM Plex Sans Thai', sans-serif",
};
