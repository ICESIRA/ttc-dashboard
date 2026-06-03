# TTC Factory — Sales Dashboard

Dashboard ยอดขาย แสดงผลแบบ interactive ดึงข้อมูลสดจาก Google Sheet
รีเฟรชอัตโนมัติทุก 30 วินาที — Host บน GitHub Pages

**Stack:** React 18 + Vite + Recharts · ข้อมูลจาก Google Sheet ผ่าน Apps Script Web App

---

## ภาพรวมระบบ (architecture)

```
Google Sheet (ฐานข้อมูล)
      │
      │  Apps Script Web App  (apps-script/Code.gs)  → ส่งข้อมูลเป็น JSON
      ▼
Dashboard (React, host บน GitHub Pages)
      │  fetch ทุก 30 วิ  (src/data/useSheetData.js)
      ▼
   หน้าจอ
```

อัปเดตข้อมูล = แก้ใน Google Sheet → dashboard อัปเดตเองภายใน 30 วิ (ไม่ต้อง deploy ใหม่)
อัปเดตโค้ด/ฟีเจอร์ = push เข้า `main` → GitHub Actions build + deploy ขึ้นเว็บอัตโนมัติ

---

## ติดตั้งครั้งแรก (one-time setup)

### 1. ตั้งค่า Google Sheet → Apps Script (ฐานข้อมูล + API)

1. เปิด Google Sheet ที่เก็บข้อมูล → เมนู **Extensions → Apps Script**
2. ลบโค้ดเดิม วางเนื้อหาจาก `apps-script/Code.gs` ทั้งหมด
3. แก้ตัวแปร `DEFAULT_TAB` ให้ตรงชื่อ tab ที่เก็บข้อมูล
4. กด **Deploy → New deployment → type = Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**  ← ต้องเป็น Anyone
5. copy **Web app URL** (ลงท้าย `/exec`) เก็บไว้

> โครงสร้างชีต: **แถวแรก = header (ชื่อคอลัมน์)**, แถวถัด ๆ ไป = ข้อมูล (1 แถว = 1 inquiry/QA)
> ชื่อ header รองรับทั้งอังกฤษและไทย — ดู mapping ใน `src/data/sheetApi.js`

### 2. ตั้งค่าโปรเจกต์ + ทดสอบบนเครื่อง

```bash
npm install
cp .env.example .env
# แก้ .env ใส่ URL ที่ copy มาจากขั้น 1
npm run dev
```

เปิด `http://localhost:5173` ควรเห็นข้อมูลจริงจากชีต

### 3. Deploy ขึ้น GitHub Pages

1. push โค้ดขึ้น GitHub repo (branch `main`)
2. ที่ repo → **Settings → Pages → Source = "GitHub Actions"**
3. ที่ repo → **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `VITE_SHEET_API_URL`
   - Value: URL Apps Script (`/exec`) จากขั้น 1
4. push เข้า `main` อีกครั้ง (หรือกด Actions → Run workflow) → รอ build เสร็จ
5. ลิงค์เว็บจะอยู่ที่ **Settings → Pages** (รูปแบบ `https://<user>.github.io/<repo>/`)

ใครมีลิงค์ก็เปิดดูได้เลย

---

## Workflow ในอนาคต

| อยากทำอะไร | ทำยังไง |
|---|---|
| แก้ข้อมูล | แก้ใน Google Sheet → dashboard อัปเดตเองใน 30 วิ |
| เพิ่ม/แก้ฟีเจอร์ | แก้ไฟล์ใน `src/` → `git push` → ขึ้นเว็บอัตโนมัติ |
| เปลี่ยน SKU/ช่องทาง/สี | แก้ `src/config/constants.js` ที่เดียว |
| เปลี่ยนความถี่ refresh | แก้ `REFRESH_INTERVAL_MS` ใน `src/config/constants.js` |
| เปลี่ยนชื่อ tab | แก้ `SHEET_TAB` ใน `src/config/dataSource.js` |

---

## โครงสร้างไฟล์

```
src/
├── config/
│   ├── constants.js      SKU, ช่องทาง, เดือน, สี, ความถี่ refresh
│   ├── theme.jsx         ธีม light/dark (CSS variables)
│   └── dataSource.js     URL Apps Script + ชื่อ tab
├── data/
│   ├── sheetApi.js       fetch + normalize ข้อมูลดิบ → schema
│   └── useSheetData.js   hook: โหลด + auto-refresh 30 วิ + loading/error
├── lib/
│   ├── format.js         format ตัวเลข/เงิน + helper
│   └── analytics.js      คำนวณ KPI/aggregation ทั้งหมด (pure functions)
├── components/
│   ├── Dashboard.jsx     orchestrate state + layout
│   ├── Header.jsx        หัว + สถานะ refresh
│   ├── FilterBar.jsx     filter เดือน/ปี
│   ├── ui.js             style ที่ใช้ซ้ำ
│   ├── kpi/KPICard.jsx
│   ├── charts/           SkuBarChart, CustomerMixDonut, TrendPanel
│   └── tables/           TopCustomerTable, ChannelCards, SkuTable, SkuChannelHeatmap
├── App.jsx               root: ธีม + โหลดข้อมูล + หน้า loading/error
└── main.jsx              entry point

apps-script/Code.gs       backend Apps Script (วางใน Google Sheet)
.github/workflows/deploy.yml   auto-deploy → GitHub Pages
```

แต่ละไฟล์ออกแบบให้อยู่ราว 200–300 บรรทัด/ฟีเจอร์ เพื่อให้ dev คนอื่น clone ไปต่อยอดได้ง่าย

---

## คำสั่ง

```bash
npm run dev       # dev server (hot reload)
npm run build     # build production → dist/
npm run preview   # ดู build จริงบนเครื่องก่อน deploy
```
