// ─────────────────────────────────────────────────────────────
// ChannelCards.jsx — การ์ดช่องทางขาย (แสดงสูงสุด 4) + popup เลือกช่องทาง
// ─────────────────────────────────────────────────────────────

import { CHANNELS, CH_COLOR, ACCENT } from "../../config/constants.js";
import { fmtB } from "../../lib/format.js";
import { cardStyle } from "../ui.js";

export default function ChannelCards({
  channelData, visibleChannels, activeChannel, showPicker,
  onToggleChannel, onTogglePicker, onToggleVisible,
}) {
  return (
    <div style={{ ...cardStyle, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 14, color: "var(--text-dim)" }}>ช่องทางขาย (คลิกเพื่อ filter)</div>
        <button onClick={onTogglePicker}
          style={{
            background: showPicker ? `${ACCENT}22` : "transparent",
            border: `1.5px solid ${showPicker ? ACCENT : "var(--card-row-border)"}`,
            color: showPicker ? ACCENT : "var(--text-body)",
            padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600,
          }}>
          ⚙ Filter
        </button>
      </div>

      {showPicker && (
        <div style={{
          position: "absolute", top: 50, right: 16, zIndex: 50,
          background: "var(--popup-bg)", border: `1px solid ${ACCENT}66`, borderRadius: 10,
          padding: "12px 14px", minWidth: 220, boxShadow: "var(--popup-shadow)",
        }}>
          <div style={{ fontSize: 12, color: ACCENT, letterSpacing: 1, fontWeight: 700, marginBottom: 8 }}>
            เลือก 4 ช่องทาง · เลือกแล้ว {visibleChannels.length}/4
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {CHANNELS.map((ch) => {
              const checked = visibleChannels.includes(ch);
              const isMax = !checked && visibleChannels.length >= 4;
              return (
                <label key={ch}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6,
                    cursor: isMax ? "not-allowed" : "pointer",
                    background: checked ? `${CH_COLOR[ch]}18` : "transparent",
                    opacity: isMax ? 0.4 : 1, transition: "all 0.15s",
                  }}>
                  <input type="checkbox" checked={checked} disabled={isMax}
                    onChange={() => onToggleVisible(ch)}
                    style={{ accentColor: CH_COLOR[ch], cursor: isMax ? "not-allowed" : "pointer" }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: CH_COLOR[ch] }} />
                  <span style={{ fontSize: 14, color: checked ? "var(--text-primary)" : "var(--text-muted)", fontWeight: checked ? 600 : 400 }}>{ch}</span>
                </label>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 8, lineHeight: 1.4 }}>
            💡 แสดงสูงสุด 4 ช่องทาง · ติ๊กเลือกหรือเอาออก
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {channelData.filter((ch) => visibleChannels.includes(ch.channel)).map((ch) => (
          <div key={ch.channel} onClick={() => onToggleChannel(ch.channel)}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px", borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
              background: activeChannel === ch.channel ? `${CH_COLOR[ch.channel]}22` : "var(--card-row-bg)",
              border: `1px solid ${activeChannel === ch.channel ? CH_COLOR[ch.channel] : "var(--card-row-border)"}`,
              boxShadow: activeChannel === ch.channel ? "none" : "var(--card-row-shadow)",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: CH_COLOR[ch.channel] }} />
              <span style={{ fontSize: 16, color: "var(--text-body)" }}>{ch.channel}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontFamily: "'Space Mono'", color: activeChannel === ch.channel ? CH_COLOR[ch.channel] : "var(--text-muted)" }}>{fmtB(ch.revenue)}</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)" }}>{ch.orders.toLocaleString()} orders</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
