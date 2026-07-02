// ─────────────────────────────────────────────────────────────
// useSheetData.js — React hook: ดึงข้อมูล + auto-refresh ทุก 30 วิ
//
// คืน { rows, loading, error, lastUpdated, refresh }
//   - rows         : ข้อมูลที่ normalize แล้ว
//   - loading      : true เฉพาะรอบโหลดแรก (refresh เบื้องหลังไม่ทำให้ loading=true)
//   - error        : ข้อความ error (null ถ้าปกติ)
//   - lastUpdated  : Date ของรอบที่โหลดสำเร็จล่าสุด
//   - refresh()    : สั่งโหลดใหม่เอง
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchRows } from "../data/sheetApi.js";
import { REFRESH_INTERVAL_MS } from "../config/constants.js";

export function useSheetData() {
  const [rows, setRows] = useState([]);
  const [adSpendDaily, setAdSpendDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isFirstLoad = useRef(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchRows();
      setRows(data.rows || []);
      setAdSpendDaily(data.adSpendDaily || []);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      // ถ้า refresh เบื้องหลัง fail → เก็บข้อมูลเดิมไว้ แค่โชว์ error
      setError(err.message || "Failed to load data");
    } finally {
      if (isFirstLoad.current) {
        setLoading(false);
        isFirstLoad.current = false;
      }
    }
  }, []);

  useEffect(() => {
    load(); // โหลดรอบแรก
    const id = setInterval(load, REFRESH_INTERVAL_MS); // auto-refresh
    return () => clearInterval(id);
  }, [load]);

  return { rows, adSpendDaily, loading, error, lastUpdated, refresh: load };
}
