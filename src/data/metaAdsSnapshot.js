// ──────────────────────────────────────────────────────────────
// metaAdsSnapshot.js — โครงข้อมูล Meta Ads (placeholder)
//
// ⚠️ ตัวเลขเป็น placeholder — รอต่อ Meta realtime ผ่าน Cloudflare Worker
//   เมื่อ Worker พร้อม: ให้ fetch จาก Worker แล้ว return object รูปเดียวกันนี้
//   โครงสร้างนี้ออกแบบให้ component อ่านได้ทันที ไม่ต้องแก้ MetaAdsReport.jsx
//
//   วิธีต่อจริงทีหลัง (ใน useSheetData หรือ hook ใหม่):
//     const res = await fetch("https://<worker>.workers.dev/meta-insights");
//     const META = await res.json();  // รูปแบบเดียวกับ META_SNAPSHOT
// ──────────────────────────────────────────────────────────────

export const META_SNAPSHOT = {
  meta: {
    account: "TTC Factory Ad Account",
    dateStart: "2026-06-01",
    dateStop: "2026-06-30",
    currency: "THB",
    source: "snapshot",      // "snapshot" | "live"
    pulledAt: "2026-06-19",
  },

  // ── KPI การ์ดบนสุด (4 ตัว) — มี delta vs เดือนก่อน ──
  kpi: {
    spend: 48250,            // งบที่ใช้ (บาท)
    costPerResult: 154.65,   // ต้นทุนต่อข้อความ (บาท)
    results: 312,            // จำนวนข้อความ
    reach: 284910,           // การเข้าถึง
    deltaSpend: 2.0,         // % vs เดือนก่อน
    deltaCostPerResult: 5.4,
    deltaResults: 8.8,
    deltaReach: -12.2,
  },

  // ── กราฟรายวัน (31 วัน) — แต่ละ metric แยก series ──
  //   messages = ข้อความ, leadform = Leadform, reach = Reach, spend = งบ (เส้น)
  daily: Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    // ค่า placeholder รูปคลื่น (ให้กราฟดูมีชีวิต)
    const wave = Math.sin(i / 3) * 0.5 + 0.5;
    return {
      day,
      messages: Math.round(1400 + wave * 1000 + (i % 5) * 60),
      leadform: Math.round(800 + wave * 600 + (i % 4) * 40),
      reach: Math.round(6000 + wave * 4000 + (i % 6) * 200),
      spend: Math.round(1200 + wave * 800 + (i % 7) * 50),
    };
  }),

  // ── Funnel (เส้นทางลูกค้า) ──
  funnel: {
    reach: 284910,
    clicks: 7750,
    ctr: 2.7,                // %
    results: 312,            // ทักแชท / Leadform
    costPerResult: 154.65,
  },

  // ── สัดส่วนงบ — แยกตาม 3 มิติ (โดนัท toggle) ──
  budgetBreakdown: {
    gender: [
      { name: "หญิง", value: 26500, color: "#2f6bff" },
      { name: "ชาย", value: 20200, color: "#7c5cff" },
      { name: "ไม่ระบุ", value: 1550, color: "#0bb5c9" },
    ],
    age: [
      { name: "18-24", value: 7200, color: "#2f6bff" },
      { name: "25-34", value: 18400, color: "#7c5cff" },
      { name: "35-44", value: 12600, color: "#0bb5c9" },
      { name: "45-54", value: 6800, color: "#d99514" },
      { name: "55+", value: 3250, color: "#e06fae" },
    ],
    province: [
      { name: "กรุงเทพฯ", value: 19800, color: "#2f6bff" },
      { name: "นนทบุรี", value: 9200, color: "#7c5cff" },
      { name: "สมุทรปราการ", value: 7600, color: "#0bb5c9" },
      { name: "ชลบุรี", value: 6100, color: "#d99514" },
      { name: "อื่นๆ", value: 5550, color: "#e06fae" },
    ],
  },

  // ── ผลลัพธ์ตามกลุ่มอายุ × เพศ (stacked bar) ──
  //   แยก metric: messages / leadform / reach (toggle)
  ageGender: {
    messages: [
      { age: "18-24", female: 42, male: 30 },
      { age: "25-34", female: 95, male: 70 },
      { age: "35-44", female: 58, male: 46 },
      { age: "45-54", female: 28, male: 22 },
      { age: "55+", female: 10, male: 11 },
    ],
    leadform: [
      { age: "18-24", female: 28, male: 20 },
      { age: "25-34", female: 60, male: 44 },
      { age: "35-44", female: 38, male: 30 },
      { age: "45-54", female: 18, male: 14 },
      { age: "55+", female: 7, male: 6 },
    ],
    reach: [
      { age: "18-24", female: 38000, male: 30000 },
      { age: "25-34", female: 72000, male: 58000 },
      { age: "35-44", female: 44000, male: 36000 },
      { age: "45-54", female: 22000, male: 18000 },
      { age: "55+", female: 9000, male: 8000 },
    ],
  },

  // ── ตารางแคมเปญ ──
  campaigns: [
    { name: "M2605 · Conversion – เมนูใหม่", objective: "Conversion", spend: 18400, results: 142, costPerResult: 129.58, lead: 96, cpl: 191.67, reach: 98200, status: "Active" },
    { name: "M2606 · Messages – โปรชุดเซ็ต", objective: "Messages", spend: 12600, results: 108, costPerResult: 116.67, lead: 61, cpl: 206.56, reach: 71500, status: "Active" },
    { name: "M2607 · Traffic – รีวิวลูกค้า", objective: "Traffic", spend: 9250, results: 48, costPerResult: 192.71, lead: 33, cpl: 280.30, reach: 64300, status: "Active" },
    { name: "M2608 · Awareness – แบรนด์", objective: "Awareness", spend: 8000, results: 14, costPerResult: 571.43, lead: 9, cpl: 888.89, reach: 50910, status: "Pause" },
  ],
};
