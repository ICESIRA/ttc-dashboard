/**
 * Code.gs — Google Apps Script Web App
 * ทำหน้าที่เป็น API ส่งข้อมูลจาก Google Sheet เป็น JSON ให้ dashboard ดึง
 *
 * ════════════════════════════════════════════════════════════
 * วิธี deploy (ทำครั้งเดียว):
 *   1. เปิด Google Sheet ที่เก็บข้อมูล → เมนู Extensions → Apps Script
 *   2. ลบโค้ดเดิม แล้ววางไฟล์นี้ทั้งหมด
 *   3. แก้ DEFAULT_TAB ให้ตรงชื่อ tab ที่เก็บข้อมูล (ถ้าไม่ใช่ชื่อด้านล่าง)
 *   4. กด Deploy → New deployment → เลือก type = "Web app"
 *        - Execute as       : Me
 *        - Who has access   : Anyone   ← สำคัญ ต้องเป็น Anyone ถึงจะดึงได้
 *   5. copy "Web app URL" (ลงท้าย /exec) → เอาไปใส่ VITE_SHEET_API_URL
 *
 * แถวแรกของชีต = header (ชื่อคอลัมน์) — แต่ละ row จะกลายเป็น 1 object
 * โดย key = ชื่อ header. mapping เป็น schema ทำฝั่ง dashboard (sheetApi.js)
 * ════════════════════════════════════════════════════════════
 */

var DEFAULT_TAB = "รายการเสนอราคา";

function doGet(e) {
  try {
    var tabName = (e && e.parameter && e.parameter.tab) || DEFAULT_TAB;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(tabName);

    if (!sheet) {
      return jsonResponse({ error: 'ไม่พบ tab ชื่อ "' + tabName + '"' });
    }

    var values = sheet.getDataRange().getValues();
    if (values.length < 2) {
      return jsonResponse([]); // ไม่มีข้อมูล (มีแต่ header หรือว่างเปล่า)
    }

    var headers = values[0].map(function (h) {
      return String(h).trim();
    });

    var rows = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      // ข้ามแถวว่าง (ทุก cell ว่าง)
      var isEmpty = row.every(function (c) {
        return c === "" || c === null;
      });
      if (isEmpty) continue;

      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        if (headers[j] === "") continue;
        obj[headers[j]] = row[j];
      }
      rows.push(obj);
    }

    return jsonResponse(rows);
  } catch (err) {
    return jsonResponse({ error: String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
