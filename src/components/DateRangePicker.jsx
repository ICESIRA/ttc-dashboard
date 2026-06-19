// ────────────────────────────────────────────────────────────────
// DateRangePicker.jsx — เลือก "ช่วงวันที่" + "ช่วงเปรียบเทียบ" (กำหนดเอง)
//   pill โชว์ YYYY-MM-DD → YYYY-MM-DD · กดเปิด popover
//   มีช่วงหลัก + ช่วงเทียบ (กำหนดเอง) สำหรับคำนวณ ▲▼
// ────────────────────────────────────────────────────────────────
import { useState } from "react";
import { ACCENT } from "../config/constants.js";
import { dateToISO } from "../lib/daterange.js";

export default function DateRangePicker({ start, end, compareStart, compareEnd, rows, onChange }) {
  const [open, setOpen] = useState(false);
  const [customStart, setCustomStart] = useState(dateToISO(start));
  const [customEnd, setCustomEnd] = useState(dateToISO(end));
  // ช่วงเทียบ — ถ้ายังไม่เคยตั้ง ใช้ค่าว่างไว้ก่อน
  const [cmpStart, setCmpStart] = useState(compareStart ? dateToISO(compareStart) : "");
  const [cmpEnd, setCmpEnd] = useState(compareEnd ? dateToISO(compareEnd) : "");

  const applyCustom = () => {
    const s = new Date(customStart + "T00:00:00");
    const e = new Date(customEnd + "T00:00:00");
    if (isNaN(s) || isNaN(e)) return;
    const main = s <= e ? { start: s, end: e } : { start: e, end: s };

    // ช่วงเทียบ — เลือกครบทั้งคู่ถึงจะส่ง ไม่งั้นส่ง null (ใช้ default เดือนก่อน)
    let cmpS = null, cmpE = null;
    if (cmpStart && cmpEnd) {
      const cs = new Date(cmpStart + "T00:00:00");
      const ce = new Date(cmpEnd + "T00:00:00");
      if (!isNaN(cs) && !isNaN(ce)) {
        if (cs <= ce) { cmpS = cs; cmpE = ce; }
        else { cmpS = ce; cmpE = cs; }
      }
    }
    onChange(main.start, main.end, cmpS, cmpE);
    setOpen(false);
  };

  const hasCompare = compareStart && compareEnd;

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
        {hasCompare && (
          <span style={{ fontSize: 13, color: "var(--text-faint)", fontFamily: "'IBM Plex Mono', monospace" }}>
            เทียบ: {dateToISO(compareStart)} → {dateToISO(compareEnd)}
          </span>
        )}
      </div>

      {open && (
        <>
          {/* backdrop คลิกนอกเพื่อปิด */}
          <div onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          {/* popover */}
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 50,
            minWidth: 360, maxWidth: 440,
            background: "var(--bg-card)", border: "1px solid var(--border-subtle)",
            borderRadius: 14, padding: 18, boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          }}>
            {/* ── ช่วงหลัก ── */}
            <div style={{ fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 0.5, marginBottom: 10 }}>
              ช่วงวันที่
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={labelStyle}>วันที่เริ่ม</label>
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={labelStyle}>ถึงวันที่</label>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* ── ช่วงเปรียบเทียบ ── */}
            <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 0.5, marginTop: 18, marginBottom: 4 }}>
              ช่วงเปรียบเทียบ
            </div>
            <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 10 }}>
              เว้นว่างได้ — ถ้าไม่เลือกจะเทียบกับช่วงก่อนหน้าอัตโนมัติ
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={labelStyle}>วันที่เริ่ม (เทียบ)</label>
                <input type="date" value={cmpStart} onChange={(e) => setCmpStart(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={labelStyle}>ถึงวันที่ (เทียบ)</label>
                <input type="date" value={cmpEnd} onChange={(e) => setCmpEnd(e.target.value)} style={inputStyle} />
              </div>
              {(cmpStart || cmpEnd) && (
                <button onClick={() => { setCmpStart(""); setCmpEnd(""); }}
                  style={{
                    alignSelf: "flex-start", padding: "4px 10px", borderRadius: 8, cursor: "pointer",
                    background: "transparent", border: "1px solid var(--border-default)",
                    color: "var(--text-faint)", fontSize: 12,
                    fontFamily: "'IBM Plex Sans Thai', sans-serif",
                  }}>
                  ล้างช่วงเทียบ
                </button>
              )}
            </div>

            <button onClick={applyCustom}
              style={{
                width: "100%", padding: "12px 20px", borderRadius: 10, cursor: "pointer",
                background: ACCENT, color: "#fff", border: "none", fontSize: 15, fontWeight: 700,
                fontFamily: "'IBM Plex Sans Thai', sans-serif", marginTop: 18,
              }}>
              ดูข้อมูล
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const labelStyle = {
  fontSize: 14, color: "var(--text-muted)", fontWeight: 500,
  fontFamily: "'IBM Plex Sans Thai', sans-serif",
};
const inputStyle = {
  width: "100%", boxSizing: "border-box",
  fontSize: 15, padding: "11px 12px", borderRadius: 8,
  background: "var(--bg-chip)", color: "var(--text-primary)",
  border: "1px solid var(--border-default)", fontFamily: "'IBM Plex Sans Thai', sans-serif",
};
