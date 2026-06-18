// ─────────────────────────────────────────────────────────────
// metaAdsSnapshot.js — ข้อมูลโฆษณา "ของจริง" จาก TTC Ad Account (Meta)
//
// ⚠️ นี่คือ SNAPSHOT (ดึงครั้งเดียว) — ไม่อัปเดตอัตโนมัติ
//    ดึงเมื่อ 2026-06-18 · ช่วง 1–18 มิ.ย. 2026 · บัญชี TTC Ad Account (359318456016031)
//
// ขั้นถัดไป (realtime): เปลี่ยนมา fetch จาก Google Apps Script proxy ที่ดึง Meta API สด
//    โครงสร้าง object นี้ออกแบบให้ proxy คืนรูปแบบเดียวกันได้เลย
// ─────────────────────────────────────────────────────────────

export const META_SNAPSHOT = {
  meta: {
    account: "TTC Ad Account",
    accountId: "359318456016031",
    currency: "THB",
    dateStart: "2026-06-01",
    dateStop: "2026-06-18",
    pulledAt: "2026-06-18",
    source: "snapshot", // เปลี่ยนเป็น "live" เมื่อต่อ proxy
  },

  // แคมเปญที่กำลังรัน (ACTIVE) — เรียงตามงบมาก→น้อย
  // results = จำนวน "เริ่มแชท" (Messaging conversations started)
  campaigns: [
    { name: "260218_TTC_MSG_New content 2026 สติ๊กเกอร์", status: "ACTIVE", objective: "OUTCOME_ENGAGEMENT",
      spend: 11543.23, reach: 16452, impressions: 56133, clicks: 813, cpc: 14.20, cpm: 205.64, ctr: 1.45, results: 61, costPerResult: 189.23 },
    { name: "250716_TTC_MSG_Custom_Hitbox", status: "ACTIVE", objective: "OUTCOME_ENGAGEMENT",
      spend: 9311.26, reach: 43066, impressions: 88561, clicks: 1870, cpc: 4.98, cpm: 105.14, ctr: 2.11, results: 200, costPerResult: 46.56 },
    { name: "260406_TTC_MSG_New content 2026 นามบัตร", status: "ACTIVE", objective: "OUTCOME_ENGAGEMENT",
      spend: 7322.20, reach: 14754, impressions: 38873, clicks: 758, cpc: 9.66, cpm: 188.36, ctr: 1.95, results: 95, costPerResult: 77.08 },
    { name: "250704_TCC_inboxretarget_", status: "ACTIVE", objective: "OUTCOME_ENGAGEMENT",
      spend: 5590.13, reach: 6000, impressions: 21785, clicks: 461, cpc: 12.13, cpm: 256.60, ctr: 2.12, results: 39, costPerResult: 143.34 },
    { name: "260113_TTC_MSG_New content 2026", status: "ACTIVE", objective: "OUTCOME_ENGAGEMENT",
      spend: 3741.76, reach: 14880, impressions: 38428, clicks: 860, cpc: 4.35, cpm: 97.37, ctr: 2.24, results: 56, costPerResult: 66.82 },
  ],

  // เทรนด์รายวัน (ระดับบัญชี) — results รายวันไม่มีจาก API จึงเก็บ spend/reach/impr/clicks
  daily: [
    { day: 1,  spend: 1705.62, reach: 8158,  impressions: 13644, clicks: 211 },
    { day: 2,  spend: 2918.30, reach: 17331, impressions: 25494, clicks: 411 },
    { day: 3,  spend: 2334.16, reach: 10295, impressions: 15139, clicks: 295 },
    { day: 4,  spend: 1971.97, reach: 9722,  impressions: 14289, clicks: 274 },
    { day: 5,  spend: 2046.79, reach: 6575,  impressions: 11318, clicks: 276 },
    { day: 6,  spend: 1687.67, reach: 5077,  impressions: 8568,  clicks: 197 },
    { day: 7,  spend: 2031.02, reach: 8970,  impressions: 14569, clicks: 284 },
    { day: 8,  spend: 2464.34, reach: 7279,  impressions: 12078, clicks: 228 },
    { day: 9,  spend: 2577.36, reach: 9963,  impressions: 15435, clicks: 271 },
    { day: 10, spend: 2112.66, reach: 7613,  impressions: 11963, clicks: 256 },
    { day: 11, spend: 1873.59, reach: 6543,  impressions: 10720, clicks: 218 },
    { day: 12, spend: 1472.32, reach: 6901,  impressions: 10389, clicks: 204 },
    { day: 13, spend: 1451.08, reach: 7401,  impressions: 11537, clicks: 225 },
    { day: 14, spend: 1906.52, reach: 7889,  impressions: 13170, clicks: 270 },
    { day: 15, spend: 1985.80, reach: 6152,  impressions: 11858, clicks: 229 },
    { day: 16, spend: 2796.90, reach: 11565, impressions: 19062, clicks: 353 },
    { day: 17, spend: 2018.59, reach: 7561,  impressions: 11991, clicks: 269 },
    { day: 18, spend: 2153.89, reach: 7601,  impressions: 12556, clicks: 291 },
  ],
};
