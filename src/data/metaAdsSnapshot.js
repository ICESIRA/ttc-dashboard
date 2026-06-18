// ──────────────────────────────────────────────────────────────
// metaAdsSnapshot.js — โครงข้อมูล Meta Ads (placeholder)
//
// ⚠️ ตัวเลข + รูป เป็น placeholder — รอต่อ Meta realtime ผ่าน Cloudflare Worker
//   เมื่อ Worker พร้อม: fetch จาก Worker แล้ว return object รูปเดียวกันนี้
//
//   โครงสร้างซ้อน 3 ชั้น (คลิกขยายได้):
//     campaigns[] → adsets[] (กลุ่มเป้าหมาย) → ads[] (คอนเทนต์ + รูป)
//
//   รูปจริงจาก Meta: ใส่ที่ ad.imageUrl (ดึงผ่าน Worker เพราะ token อยู่ฝั่ง server)
//     ตอนนี้ใช้ placeholder URL ไปก่อน
// ──────────────────────────────────────────────────────────────

// รูป placeholder (ภาพสีตาม ratio โฆษณา) — เปลี่ยนเป็น Meta image URL จริงทีหลัง
const ph = (w, h, label) =>
  `https://placehold.co/${w}x${h}/2f6bff/ffffff?text=${encodeURIComponent(label)}`;

export const META_SNAPSHOT = {
  meta: {
    account: "TTC Factory Ad Account",
    dateStart: "2026-06-01",
    dateStop: "2026-06-30",
    currency: "THB",
    source: "snapshot",
    pulledAt: "2026-06-19",
  },

  kpi: {
    spend: 48250,
    costPerResult: 154.65,
    results: 312,
    reach: 284910,
    deltaSpend: 2.0,
    deltaCostPerResult: 5.4,
    deltaResults: 8.8,
    deltaReach: -12.2,
  },

  daily: Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const wave = Math.sin(i / 3) * 0.5 + 0.5;
    return {
      day,
      messages: Math.round(1400 + wave * 1000 + (i % 5) * 60),
      leadform: Math.round(800 + wave * 600 + (i % 4) * 40),
      reach: Math.round(6000 + wave * 4000 + (i % 6) * 200),
      spend: Math.round(1200 + wave * 800 + (i % 7) * 50),
    };
  }),

  funnel: {
    reach: 284910,
    clicks: 7750,
    ctr: 2.7,
    results: 312,
    costPerResult: 154.65,
  },

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

  // ── ตารางแคมเปญ — ซ้อน adsets → ads (คลิกขยาย) ──
  campaigns: [
    {
      id: "cmp_2605",
      name: "M2605 · Conversion – เมนูใหม่",
      objective: "Conversion",
      spend: 18400, results: 142, costPerResult: 129.58, lead: 96, cpl: 191.67, reach: 98200, status: "Active",
      adsets: [
        {
          id: "as_2605_1", name: "กลุ่มคนรักอาหาร 25-34 กทม.",
          spend: 10200, results: 88, lead: 60, cpl: 170.0, reach: 54000, status: "Active",
          ads: [
            { id: "ad_1", name: "วิดีโอเมนูใหม่ 15 วิ", format: "Video", spend: 6100, results: 52, lead: 36, reach: 31000, ctr: 3.1, imageUrl: ph(600, 600, "Ad Video 1") },
            { id: "ad_2", name: "ภาพชุดเมนู Carousel", format: "Carousel", spend: 4100, results: 36, lead: 24, reach: 23000, ctr: 2.6, imageUrl: ph(600, 600, "Carousel 2") },
          ],
        },
        {
          id: "as_2605_2", name: "Lookalike ลูกค้าเก่า 1%",
          spend: 8200, results: 54, lead: 36, cpl: 227.8, reach: 44200, status: "Active",
          ads: [
            { id: "ad_3", name: "รีวิวลูกค้า + โปรเปิดตัว", format: "Image", spend: 8200, results: 54, lead: 36, reach: 44200, ctr: 2.2, imageUrl: ph(600, 600, "Image 3") },
          ],
        },
      ],
    },
    {
      id: "cmp_2606",
      name: "M2606 · Messages – โปรชุดเซ็ต",
      objective: "Messages",
      spend: 12600, results: 108, costPerResult: 116.67, lead: 61, cpl: 206.56, reach: 71500, status: "Active",
      adsets: [
        {
          id: "as_2606_1", name: "กลุ่มสนใจชุดเซ็ต 28-45",
          spend: 12600, results: 108, lead: 61, cpl: 206.56, reach: 71500, status: "Active",
          ads: [
            { id: "ad_4", name: "โปรชุดเซ็ต ทักแชทรับส่วนลด", format: "Image", spend: 7600, results: 68, lead: 38, reach: 43000, ctr: 2.9, imageUrl: ph(600, 600, "Promo Set") },
            { id: "ad_5", name: "วิดีโอแกะกล่องชุดเซ็ต", format: "Video", spend: 5000, results: 40, lead: 23, reach: 28500, ctr: 2.4, imageUrl: ph(600, 600, "Unboxing") },
          ],
        },
      ],
    },
    {
      id: "cmp_2607",
      name: "M2607 · Traffic – รีวิวลูกค้า",
      objective: "Traffic",
      spend: 9250, results: 48, costPerResult: 192.71, lead: 33, cpl: 280.30, reach: 64300, status: "Active",
      adsets: [
        {
          id: "as_2607_1", name: "กลุ่มกว้าง สนใจร้านอาหาร",
          spend: 9250, results: 48, lead: 33, cpl: 280.30, reach: 64300, status: "Active",
          ads: [
            { id: "ad_6", name: "รวมรีวิว 5 ดาว", format: "Carousel", spend: 9250, results: 48, lead: 33, reach: 64300, ctr: 1.8, imageUrl: ph(600, 600, "Reviews") },
          ],
        },
      ],
    },
    {
      id: "cmp_2608",
      name: "M2608 · Awareness – แบรนด์",
      objective: "Awareness",
      spend: 8000, results: 14, costPerResult: 571.43, lead: 9, cpl: 888.89, reach: 50910, status: "Pause",
      adsets: [
        {
          id: "as_2608_1", name: "กลุ่มกว้าง สร้างการรับรู้",
          spend: 8000, results: 14, lead: 9, cpl: 888.89, reach: 50910, status: "Pause",
          ads: [
            { id: "ad_7", name: "แนะนำแบรนด์ TTC", format: "Video", spend: 8000, results: 14, lead: 9, reach: 50910, ctr: 1.1, imageUrl: ph(600, 600, "Brand TTC") },
          ],
        },
      ],
    },
  ],
};
