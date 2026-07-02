// ────────────────────────────────────────────────────────────────
// ContactHeatmap.jsx — Inquiries × Quoted heatmap (weekday × week-of-month)
//   rows = Mon..Sun (derived from date) · columns = Week 1-7 / 8-14 / ...
//   toggle: Inquiries (qaCount) ↔ Quoted (quotedRevenue) · darker = more
//   respects the selected date range (fed filtered rows)
// ────────────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { ACCENT, monthIndex } from "../../config/constants.js";
import { fmt, fmtNum } from "../../lib/format.js";
import { cardStyle } from "../ui.js";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEK_COLS = [
  { k: 1, label: "1–7" }, { k: 2, label: "8–14" }, { k: 3, label: "15–21" },
  { k: 4, label: "22–28" }, { k: 5, label: "29+" },
];
const weekOf = (day) => (day <= 7 ? 1 : day <= 14 ? 2 : day <= 21 ? 3 : day <= 28 ? 4 : 5);
const jsDowToMon = (d) => (d + 6) % 7; // JS Sun=0 → index 6; Mon=1 → 0

const METRICS = [
  { id: "inquiries", label: "Inquiries", field: "qaCount", fmt: (v) => fmtNum(v) },
  { id: "quoted", label: "Quoted", field: "quotedRevenue", fmt: (v) => fmt(v) },
];

export default function ContactHeatmap({ rows }) {
  const [metric, setMetric] = useState("inquiries");
  const M = METRICS.find((m) => m.id === metric);

  const { grid, rowTot, colTot, grand, peak, max } = useMemo(() => {
    const grid = WEEKDAYS.map(() => WEEK_COLS.map(() => 0));
    for (const r of rows) {
      const mi = monthIndex(r.month);
      if (mi < 0) continue;
      const day = r.day && r.day >= 1 ? r.day : 1;
      const dow = jsDowToMon(new Date(r.year, mi, day).getDay());
      const wc = weekOf(day) - 1;
      grid[dow][wc] += r[M.field] || 0;
    }
    const rowTot = grid.map((row) => row.reduce((a, b) => a + b, 0));
    const colTot = WEEK_COLS.map((_, ci) => grid.reduce((a, row) => a + row[ci], 0));
    const grand = rowTot.reduce((a, b) => a + b, 0);
    let peak = { v: -1, ri: 0, ci: 0 }, max = 0;
    grid.forEach((row, ri) => row.forEach((v, ci) => {
      if (v > max) max = v;
      if (v > peak.v) peak = { v, ri, ci };
    }));
    return { grid, rowTot, colTot, grand, peak, max };
  }, [rows, M]);

  const cellBg = (v) => (v <= 0 || max <= 0 ? "transparent" : `rgba(225,86,79,${(0.10 + 0.8 * (v / max)).toFixed(3)})`);
  const cellColor = (v) => (max > 0 && v / max > 0.55 ? "#fff" : "var(--text-body)");

  return (
    <div style={cardStyle}>
      {/* header + toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 17, color: "var(--text-heading)", fontWeight: 700 }}>
            Inquiries × Quoted — Heatmap
          </div>
          <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 2 }}>
            Weekday × week-of-month · darker = more · which day people contact most
          </div>
        </div>
        <div style={{ display: "inline-flex", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-default)" }}>
          {METRICS.map((m) => {
            const active = metric === m.id;
            return (
              <button key={m.id} onClick={() => setMetric(m.id)}
                style={{
                  padding: "8px 18px", fontSize: 14, cursor: "pointer", border: "none",
                  background: active ? ACCENT : "var(--bg-chip)",
                  color: active ? "#fff" : "var(--text-muted)", fontWeight: active ? 700 : 500,
                  fontFamily: "'IBM Plex Sans Thai', sans-serif",
                }}>
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {grand === 0 ? (
        <div style={{ fontSize: 14, color: "var(--text-faint)", padding: "20px 0" }}>No data in the selected range</div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 13, width: "100%", tableLayout: "fixed", minWidth: 560 }}>
              <thead>
                <tr style={{ color: "var(--text-faint)" }}>
                  <th style={{ ...cellPad, textAlign: "left", width: 56 }} />
                  {WEEK_COLS.map((c) => <th key={c.k} style={{ ...cellPad, textAlign: "center", fontWeight: 600 }}>{c.label}</th>)}
                  <th style={{ ...cellPad, textAlign: "center", color: "var(--text-dim)", fontWeight: 700, width: 60 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {WEEKDAYS.map((wd, ri) => (
                  <tr key={wd}>
                    <td style={{ ...cellPad, color: "var(--text-muted)", fontWeight: 600 }}>{wd}</td>
                    {grid[ri].map((v, ci) => (
                      <td key={ci} style={{
                        ...cellPad, textAlign: "center", fontFamily: mono,
                        background: cellBg(v), color: cellColor(v),
                        fontWeight: peak.ri === ri && peak.ci === ci ? 700 : 400,
                        border: peak.ri === ri && peak.ci === ci ? `2px solid #e1564f` : "1px solid var(--border-subtle)",
                        borderRadius: 4,
                      }}>{v > 0 ? M.fmt(v) : ""}</td>
                    ))}
                    <td style={{ ...cellPad, textAlign: "center", fontFamily: mono, color: "var(--text-muted)", fontWeight: 700 }}>{M.fmt(rowTot[ri])}</td>
                  </tr>
                ))}
                {/* total row */}
                <tr style={{ borderTop: "2px solid var(--border-default)" }}>
                  <td style={{ ...cellPad, color: "var(--text-dim)", fontWeight: 700 }}>Total</td>
                  {colTot.map((v, ci) => (
                    <td key={ci} style={{ ...cellPad, textAlign: "center", fontFamily: mono, color: "var(--text-dim)", fontWeight: 700 }}>{M.fmt(v)}</td>
                  ))}
                  <td style={{ ...cellPad, textAlign: "center", fontFamily: mono, color: ACCENT, fontWeight: 700 }}>{M.fmt(grand)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* legend + peak */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-faint)" }}>
              Low
              <span style={{ width: 120, height: 10, borderRadius: 5, background: "linear-gradient(to right, rgba(225,86,79,0.10), rgba(225,86,79,0.9))" }} />
              High
            </div>
            <div style={{ fontSize: 13, color: "var(--text-body)", fontWeight: 600 }}>
              Peak: {WEEKDAYS[peak.ri]} · {WEEK_COLS[peak.ci].label} ({M.fmt(peak.v)})
            </div>
          </div>

          {/* summary footer */}
          <div style={{ display: "flex", gap: 40, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-subtle)" }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text-heading)", fontFamily: mono }}>{M.fmt(grand)}</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)" }}>Total {M.label.toLowerCase()} (selected range)</div>
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#e1564f", fontFamily: mono }}>{M.fmt(peak.v)}</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)" }}>Busiest cell</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const mono = "'IBM Plex Mono', monospace";
const cellPad = { padding: "8px 6px", fontWeight: 500 };
