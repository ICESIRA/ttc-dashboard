// ──────────────────────────────────────────────────────────────
// useMetaData.js — ดึงข้อมูล Meta Ads จาก Cloudflare Worker
//   รับ since/until (YYYY-MM-DD) เพื่อ filter ช่วงวันที่ — เปลี่ยนแล้ว re-fetch
//   ใช้ข้อมูลจริงจาก Meta เท่านั้น — ถ้า Worker ล่ม/error → แสดง error
// ──────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

// URL ของ Worker ที่ deploy แล้ว
const WORKER_URL = "https://meta-worker.nonc-cha.workers.dev";

export function useMetaData(since, until) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // ต่อ query ช่วงวันที่ ถ้ามี
        let url = WORKER_URL;
        if (since && until) {
          const q = new URLSearchParams({ since, until }).toString();
          url = `${WORKER_URL}?${q}`;
        }
        const res = await fetch(url);
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
  }, [since, until]);

  return { data, loading, error };
}
