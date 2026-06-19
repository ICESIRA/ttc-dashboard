// ──────────────────────────────────────────────────────────────
// useMetaData.js — ดึงข้อมูล Meta Ads จาก Cloudflare Worker
//   Worker URL: ดึง Meta จริง → คืน object รูปเดียวกับโครงเดิม
//   ใช้ข้อมูลจริงจาก Meta เท่านั้น — ถ้า Worker ล่ม/error → แสดงข้อความ error (ไม่มีข้อมูลตัวอย่าง)
// ──────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

// URL ของ Worker ที่ deploy แล้ว
const WORKER_URL = "https://meta-worker.nonc-cha.workers.dev";

export function useMetaData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(WORKER_URL);
        const json = await res.json();
        if (!alive) return;
        if (json.error) {
          setError(json.error);
          setData(null);
        } else {
          setData(json);
        }
      } catch (e) {
        if (!alive) return;
        setError(String(e.message || e));
        setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { data, loading, error };
}
