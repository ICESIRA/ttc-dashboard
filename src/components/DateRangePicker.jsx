// ────────────────────────────────────────────────────────────────
// DateRangePicker.jsx — ตัวเลือกช่วงวันที่สไตล์ Google Ads
//   ซ้าย: รายการ preset (วันนี้/เมื่อวาน/สัปดาห์นี้/7·14·30 วัน/เดือนนี้/เดือนก่อน/ทั้งหมด
//         + "N วันจนถึงวันนี้/เมื่อวาน" + สวิตช์ Compare)
//   ขวา: ช่อง Start/End + ปฏิทินเลือกช่วง (ไฮไลต์หัว-ท้าย + แถบระหว่าง)
//   ล่าง: Cancel / Apply
//   contract เดิม: onChange(start, end, cmpStart|null, cmpEnd|null)
// ────────────────────────────────────────────────────────────────
import { useState } from "react";
import { ACCENT } from "../config/constants.js";
import { dateToISO, dateToInt, addDays, presetRange, daysUpTo } from "../lib/daterange.js";

const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["S","M","T","W","T","F","S"];

const PRESETS = [
  { id: "today",     label: "วันนี้" },
  { id: "yesterday", label: "เมื่อวาน" },
  { id: "thisWeek",  label: "สัปดาห์นี้ (อา.–วันนี้)" },
  { id: "last7",     label: "7 วันล่าสุด" },
  { id: "lastWeek",  label: "สัปดาห์ก่อน (อา.–ส.)" },
  { id: "last14",    label: "14 วันล่าสุด" },
  { id: "thisMonth", label: "เดือนนี้" },
  { id: "last30",    label: "30 วันล่าสุด" },
  { id: "lastMonth", label: "เดือนก่อน" },
  { id: "all",       label: "ทั้งหมด" },
];

const firstOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const parseISO = (s) => { const d = new Date(s + "T00:00:00"); return isNaN(d) ? null : d; };

export default function DateRangePicker({ start, end, compareStart, compareEnd, rows, onChange }) {
  const [open, setOpen] = useState(false);
  const [tStart, setTStart] = useState(start);
  const [tEnd, setTEnd] = useState(end);
  const [view, setView] = useState(firstOfMonth(start));
  const [preset, setPreset] = useState(null);
  const [cmpOn, setCmpOn] = useState(!!(compareStart && compareEnd));
  const [cStart, setCStart] = useState(compareStart || null);
  const [cEnd, setCEnd] = useState(compareEnd || null);
  const [upToN, setUpToN] = useState(30);

  const hasCompare = compareStart && compareEnd;

  const openPanel = () => {
    setTStart(start); setTEnd(end); setView(firstOfMonth(start));
    setCmpOn(!!(compareStart && compareEnd));
    setCStart(compareStart || null); setCEnd(compareEnd || null);
    setPreset(null); setOpen(true);
  };

  const applyRange = (r, id) => {
    setTStart(r.start); setTEnd(r.end); setView(firstOfMonth(r.start)); setPreset(id);
  };
  const pickPreset = (id) => applyRange(presetRange(id, rows), id);
  const pickDaysUpTo = (anchor) => applyRange(daysUpTo(upToN, anchor), "upto-" + anchor);

  const clickDay = (d) => {
    setPreset(null);
    if (!tStart || (tStart && tEnd)) { setTStart(d); setTEnd(null); }
    else if (dateToInt(d) >= dateToInt(tStart)) { setTEnd(d); }
    else { setTStart(d); }
  };

  const apply = () => {
    const s = tStart, e = tEnd || tStart;
    const cs = cmpOn && cStart && cEnd ? cStart : null;
    const ce = cmpOn && cStart && cEnd ? cEnd : null;
    onChange(s, e, cs, ce);
    setOpen(false);
  };

  // ── ปฏิทินของเดือน view ──
  const y = view.getFullYear(), m = view.getMonth();
  const firstDow = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));

  const sInt = tStart ? dateToInt(tStart) : null;
  const eInt = tEnd ? dateToInt(tEnd) : null;
  const dayBg = (d) => {
    const di = dateToInt(d);
    if (di === sInt || di === eInt) return ACCENT;
    if (sInt && eInt && di > sInt && di < eInt) return ACCENT + "22";
    return "transparent";
  };
  const dayColor = (d) => {
    const di = dateToInt(d);
    return (di === sInt || di === eInt) ? "#fff" : "var(--text-primary)";
  };

  return (
    <div style={{ position: "relative", marginBottom: 18 }}>
      {/* pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 15, color: "var(--text-muted)", fontWeight: 500 }}>ช่วงเวลา:</span>
        <button onClick={() => (open ? setOpen(false) : openPanel())}
          style={{
            display: "inline-flex", alignItems: "center", gap: 10, padding: "9px 16px", borderRadius: 12,
            cursor: "pointer", background: "var(--bg-card)", border: `1.5px solid ${ACCENT}`,
            color: "var(--text-primary)", fontSize: 16, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace",
          }}>
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
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 50, display: "flex",
            background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 14,
            boxShadow: "0 12px 32px rgba(0,0,0,0.18)", overflow: "hidden",
          }}>
            {/* ── ซ้าย: presets ── */}
            <div style={{ width: 210, borderRight: "1px solid var(--border-subtle)", padding: 10, display: "flex", flexDirection: "column", gap: 2, maxHeight: 430, overflowY: "auto" }}>
              {PRESETS.map((p) => {
                const active = preset === p.id;
                return (
                  <button key={p.id} onClick={() => pickPreset(p.id)}
                    style={{
                      textAlign: "left", padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                      background: active ? ACCENT + "1f" : "transparent",
                      color: active ? ACCENT : "var(--text-primary)", fontWeight: active ? 700 : 500,
                      fontSize: 14, fontFamily: "'IBM Plex Sans Thai', sans-serif",
                    }}>
                    {p.label}
                  </button>
                );
              })}

              {/* N วันจนถึง วันนี้/เมื่อวาน */}
              <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: 6, paddingTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="number" min={1} value={upToN}
                    onChange={(e) => setUpToN(Math.max(1, Number(e.target.value) || 1))}
                    style={{ width: 46, ...miniInput }} />
                  <button onClick={() => pickDaysUpTo("today")} style={miniBtn}>วันจนถึงวันนี้</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="number" min={1} value={upToN}
                    onChange={(e) => setUpToN(Math.max(1, Number(e.target.value) || 1))}
                    style={{ width: 46, ...miniInput }} />
                  <button onClick={() => pickDaysUpTo("yesterday")} style={miniBtn}>วันจนถึงเมื่อวาน</button>
                </div>
              </div>

              {/* Compare toggle */}
              <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: 6, paddingTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}>เปรียบเทียบ</span>
                <button onClick={() => setCmpOn((v) => !v)}
                  style={{
                    width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative",
                    background: cmpOn ? ACCENT : "var(--border-default)", transition: "background 0.15s",
                  }}>
                  <span style={{
                    position: "absolute", top: 3, left: cmpOn ? 21 : 3, width: 18, height: 18, borderRadius: "50%",
                    background: "#fff", transition: "left 0.15s",
                  }} />
                </button>
              </div>
            </div>

            {/* ── ขวา: ช่อง + ปฏิทิน ── */}
            <div style={{ padding: 16, width: 320, display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Start / End */}
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={miniLabel}>วันที่เริ่ม</label>
                  <input type="date" value={tStart ? dateToISO(tStart) : ""}
                    onChange={(e) => { const d = parseISO(e.target.value); if (d) { setTStart(d); if (tEnd && dateToInt(d) > dateToInt(tEnd)) setTEnd(d); setView(firstOfMonth(d)); setPreset(null); } }}
                    style={dateInput} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={miniLabel}>ถึงวันที่</label>
                  <input type="date" value={tEnd ? dateToISO(tEnd) : ""}
                    onChange={(e) => { const d = parseISO(e.target.value); if (d) { setTEnd(d); setPreset(null); } }}
                    style={dateInput} />
                </div>
              </div>

              {/* month nav */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-heading)" }}>{MONTHS_EN[m]} {y}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setView(new Date(y, m - 1, 1))} style={navBtn}>‹</button>
                  <button onClick={() => setView(new Date(y, m + 1, 1))} style={navBtn}>›</button>
                </div>
              </div>

              {/* weekday header */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                {DOW.map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 12, color: "var(--text-faint)", fontWeight: 600 }}>{d}</div>)}
              </div>

              {/* days */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                {cells.map((d, i) => d === null
                  ? <div key={i} />
                  : (
                    <button key={i} onClick={() => clickDay(d)}
                      style={{
                        height: 34, border: "none", cursor: "pointer", fontSize: 13,
                        fontFamily: "'IBM Plex Mono', monospace", background: dayBg(d), color: dayColor(d),
                        borderRadius: 8, fontWeight: (dateToInt(d) === sInt || dateToInt(d) === eInt) ? 700 : 400,
                      }}>
                      {d.getDate()}
                    </button>
                  ))}
              </div>

              {/* ช่วงเทียบ (เมื่อเปิด compare) */}
              {cmpOn && (
                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 10, display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={miniLabel}>เทียบ: เริ่ม</label>
                    <input type="date" value={cStart ? dateToISO(cStart) : ""}
                      onChange={(e) => setCStart(parseISO(e.target.value))} style={dateInput} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={miniLabel}>เทียบ: ถึง</label>
                    <input type="date" value={cEnd ? dateToISO(cEnd) : ""}
                      onChange={(e) => setCEnd(parseISO(e.target.value))} style={dateInput} />
                  </div>
                </div>
              )}

              {/* footer */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                <button onClick={() => setOpen(false)}
                  style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 14, fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>
                  ยกเลิก
                </button>
                <button onClick={apply}
                  style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: ACCENT, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>
                  ใช้ช่วงนี้
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const miniLabel = { display: "block", fontSize: 12, color: "var(--text-muted)", marginBottom: 4, fontFamily: "'IBM Plex Sans Thai', sans-serif" };
const dateInput = {
  width: "100%", boxSizing: "border-box", fontSize: 14, padding: "9px 10px", borderRadius: 8,
  background: "var(--bg-chip)", color: "var(--text-primary)", border: "1px solid var(--border-default)",
  fontFamily: "'IBM Plex Sans Thai', sans-serif",
};
const miniInput = {
  boxSizing: "border-box", fontSize: 13, padding: "6px 8px", borderRadius: 6,
  background: "var(--bg-chip)", color: "var(--text-primary)", border: "1px solid var(--border-default)",
  fontFamily: "'IBM Plex Mono', monospace",
};
const miniBtn = {
  flex: 1, textAlign: "left", padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border-default)",
  background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 12.5,
  fontFamily: "'IBM Plex Sans Thai', sans-serif", whiteSpace: "nowrap",
};
const navBtn = {
  width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border-default)", background: "transparent",
  color: "var(--text-primary)", cursor: "pointer", fontSize: 16, lineHeight: 1,
};
