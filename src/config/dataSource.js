// ─────────────────────────────────────────────────────────────
// dataSource.js — ตั้งค่าแหล่งข้อมูล (Google Apps Script Web App)
//
// วิธีตั้งค่า:
//   1. Deploy Apps Script เป็น Web App (ดู apps-script/Code.gs + README)
//   2. copy URL ที่ได้ (ลงท้าย /exec) มาวางใน .env เป็น VITE_SHEET_API_URL
//      หรือใส่ fallback ตรง DEFAULT_API_URL ด้านล่างได้เลย
//
// หมายเหตุ: ใช้ import.meta.env เพื่อให้เปลี่ยน URL ได้โดยไม่ต้องแก้โค้ด
// ─────────────────────────────────────────────────────────────

// วาง URL Apps Script ของคุณตรงนี้ (หรือเว้นว่างแล้วใช้ .env)
const DEFAULT_API_URL = "";

export const SHEET_API_URL =
  import.meta.env.VITE_SHEET_API_URL || DEFAULT_API_URL;

// ชื่อชีต (tab) ที่จะดึง — ส่งเป็น query param ให้ Apps Script
export const SHEET_TAB = "รายการเสนอราคา";
