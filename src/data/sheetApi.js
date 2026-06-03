// ─────────────────────────────────────────────────────────────
// sheetApi.js — ดึงข้อมูลจาก Apps Script Web App แล้ว normalize
//
// คาดหวัง response เป็น JSON array ของ object โดยแต่ละ key = header
// ในชีต (mapping ดูใน normalizeRow ด้านล่าง — แก้ตรงนี้ถ้า header เปลี่ยน)
//
// 1 row = 1 inquiry/QA (ปิดได้แล้วถ้า revenue > 0)
// schema ปลายทาง: { id, year, month, day, sku, channel, customerName,
//   customerType, quotedRevenue, revenue, orders, qaCount, customers, cogs, adSpend }
// ─────────────────────────────────────────────────────────────

import { SHEET_API_URL, SHEET_TAB } from "../config/dataSource.js";

const toNum = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/[, ฿]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// map 1 row ดิบจากชีต → schema ของ dashboard
// ปรับชื่อ field ฝั่งซ้าย (row["..."]) ให้ตรงกับ header ในชีตของคุณ
function normalizeRow(row, idx) {
  return {
    id: row.id ?? idx,
    year: toNum(row.year ?? row.ปี),
    month: row.month ?? row.เดือน ?? "",
    day: toNum(row.day ?? row.วันที่),
    sku: row.sku ?? row.SKU ?? "อื่นๆ",
    channel: row.channel ?? row.ช่องทาง ?? "",
    customerName: row.customerName ?? row.ชื่อลูกค้า ?? "ไม่ระบุ",
    customerType: row.customerType ?? row.ประเภทลูกค้า ?? "ใหม่",
    quotedRevenue: toNum(row.quotedRevenue ?? row.ยอดเสนอราคา),
    revenue: toNum(row.revenue ?? row.ยอดขาย),
    orders: toNum(row.orders ?? row.ออเดอร์),
    qaCount: toNum(row.qaCount ?? row.QA),
    customers: toNum(row.customers ?? row.ลูกค้า),
    cogs: toNum(row.cogs ?? row.ต้นทุน),
    adSpend: toNum(row.adSpend ?? row.ค่าโฆษณา),
  };
}

// ดึงข้อมูลทั้งหมด — คืน array ที่ normalize แล้ว
// throw error ถ้า fetch fail (ให้ hook จัดการ state)
export async function fetchRows() {
  if (!SHEET_API_URL) {
    throw new Error(
      "ยังไม่ได้ตั้งค่า SHEET_API_URL — ดูวิธีใน README / src/config/dataSource.js"
    );
  }

  const url = `${SHEET_API_URL}?tab=${encodeURIComponent(SHEET_TAB)}&t=${Date.now()}`;
  const res = await fetch(url, { method: "GET", redirect: "follow" });

  if (!res.ok) {
    throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
  }

  const data = await res.json();
  const raw = Array.isArray(data) ? data : data.rows || [];
  return raw.map(normalizeRow);
}
