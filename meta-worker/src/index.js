// ──────────────────────────────────────────────────────────────
// Cloudflare Worker — ดึงข้อมูล Meta Ads → แปลงเป็นรูป META_SNAPSHOT
//   ส่ง JSON ให้ dashboard (github.io) ผ่าน fetch
//
// secret/var ที่ต้องตั้ง (ผ่าน wrangler):
//   META_TOKEN   = access token (secret)  → wrangler secret put META_TOKEN
//   AD_ACCOUNT   = "act_359318456016031"  → ตั้งใน wrangler.jsonc vars หรือ secret
//
// Meta Graph API version
const GV = "v21.0";

// แปลงวันที่เป็น YYYY-MM-DD
const ymd = (d) => d.toISOString().slice(0, 10);

// ── ช่วงวันที่: เดือนปัจจุบัน (ปรับได้) ──
function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { since: ymd(start), until: ymd(now) };
}

// เดือนก่อน — ช่วงเดียวกัน (วันที่ 1 ถึงวันเดียวกันของเดือนก่อน) ไว้เทียบ delta
function prevMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  return { since: ymd(start), until: ymd(end) };
}

// % เปลี่ยนแปลง (cur เทียบ prev)
function pct(cur, prev) {
  if (!prev || prev === 0) return 0;
  return ((cur - prev) / prev) * 100;
}

// helper เรียก Graph API
async function graph(path, params, token) {
  const url = new URL(`https://graph.facebook.com/${GV}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);
  const res = await fetch(url.toString());
  const json = await res.json();
  if (json.error) throw new Error(`Meta API: ${json.error.message}`);
  return json;
}

const num = (v) => (v ? Number(v) : 0);

// เลขเดือนไทยย่อ (ไว้ทำ daily ถ้าต้องใช้)
const PIE_COLORS = ["#2f6bff", "#7c5cff", "#0bb5c9", "#d99514", "#e06fae", "#16a34a"];

export default {
  async fetch(request, env, ctx) {
    // ── CORS ──
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), {
        status,
        headers: { "Content-Type": "application/json", ...cors },
      });

    try {
      const token = env.META_TOKEN;
      const account = env.AD_ACCOUNT; // "act_359318456016031"
      if (!token) return json({ error: "ยังไม่ได้ตั้ง META_TOKEN (wrangler secret)" }, 500);
      if (!account) return json({ error: "ยังไม่ได้ตั้ง AD_ACCOUNT" }, 500);

      const { since, until } = monthRange();
      const timeRange = JSON.stringify({ since, until });

      // ══ 1) ภาพรวมบัญชี (KPI + funnel) ══
      const acc = await graph(`${account}/insights`, {
        time_range: timeRange,
        fields: "spend,reach,impressions,clicks,ctr,actions,cost_per_action_type",
        level: "account",
      }, token);
      const a0 = (acc.data && acc.data[0]) || {};
      // นับ "ข้อความ" จาก actions (messaging conversations started)
      const getAction = (arr, type) => {
        const f = (arr || []).find((x) => x.action_type === type);
        return f ? num(f.value) : 0;
      };
      const results =
        getAction(a0.actions, "onsite_conversion.messaging_conversation_started_7d") ||
        getAction(a0.actions, "onsite_conversion.total_messaging_connection") ||
        getAction(a0.actions, "lead") || 0;
      const spend = num(a0.spend);
      const reach = num(a0.reach);
      const clicks = num(a0.clicks);
      const ctr = num(a0.ctr);
      const costPerResult = results > 0 ? spend / results : 0;

      // ══ 1b) เดือนก่อน (ช่วงเดียวกัน) ไว้เทียบ delta ══
      const prev = prevMonthRange();
      let dSpend = 0, dCostPerResult = 0, dResults = 0, dReach = 0;
      try {
        const accPrev = await graph(`${account}/insights`, {
          time_range: JSON.stringify(prev),
          fields: "spend,reach,actions",
          level: "account",
        }, token);
        const p0 = (accPrev.data && accPrev.data[0]) || {};
        const pResults =
          getAction(p0.actions, "onsite_conversion.messaging_conversation_started_7d") ||
          getAction(p0.actions, "lead") || 0;
        const pSpend = num(p0.spend);
        const pReach = num(p0.reach);
        const pCostPerResult = pResults > 0 ? pSpend / pResults : 0;
        dSpend = pct(spend, pSpend);
        dResults = pct(results, pResults);
        dReach = pct(reach, pReach);
        dCostPerResult = pct(costPerResult, pCostPerResult);
      } catch (e) { /* เดือนก่อนไม่มีข้อมูล → delta = 0 */ }

      // ══ 2) รายวัน (daily) ══
      const dailyRaw = await graph(`${account}/insights`, {
        time_range: timeRange,
        fields: "spend,reach,impressions,clicks,actions",
        level: "account",
        time_increment: "1",
      }, token);
      const daily = (dailyRaw.data || []).map((d, i) => {
        const msg =
          getAction(d.actions, "onsite_conversion.messaging_conversation_started_7d") ||
          getAction(d.actions, "lead") || 0;
        const dayNum = d.date_start ? Number(d.date_start.slice(-2)) : i + 1;
        return {
          day: dayNum,
          messages: msg,
          leadform: getAction(d.actions, "lead"),
          reach: num(d.reach),
          spend: num(d.spend),
        };
      });

      // ══ 3) breakdown เพศ ══
      const genderRaw = await graph(`${account}/insights`, {
        time_range: timeRange, fields: "spend", breakdowns: "gender", level: "account",
      }, token);
      const genderMap = { male: "ชาย", female: "หญิง", unknown: "ไม่ระบุ" };
      const gender = (genderRaw.data || []).map((g, i) => ({
        name: genderMap[g.gender] || g.gender,
        value: Math.round(num(g.spend)),
        color: PIE_COLORS[i % PIE_COLORS.length],
      }));

      // ══ 4) breakdown อายุ ══
      const ageRaw = await graph(`${account}/insights`, {
        time_range: timeRange, fields: "spend", breakdowns: "age", level: "account",
      }, token);
      const age = (ageRaw.data || []).map((g, i) => ({
        name: g.age, value: Math.round(num(g.spend)), color: PIE_COLORS[i % PIE_COLORS.length],
      }));

      // ══ 5) breakdown จังหวัด (region) ══
      const regionRaw = await graph(`${account}/insights`, {
        time_range: timeRange, fields: "spend", breakdowns: "region", level: "account", limit: "8",
      }, token);
      const province = (regionRaw.data || [])
        .sort((x, y) => num(y.spend) - num(x.spend))
        .slice(0, 6)
        .map((g, i) => ({ name: g.region || "อื่นๆ", value: Math.round(num(g.spend)), color: PIE_COLORS[i % PIE_COLORS.length] }));

      // ══ 6) ageGender (อายุ × เพศ) สำหรับ stacked bar ══
      const agRaw = await graph(`${account}/insights`, {
        time_range: timeRange, fields: "actions,reach", breakdowns: "age,gender", level: "account",
      }, token);
      const ageOrder = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"];
      const buildAgeGender = (metric) => {
        const map = {};
        for (const row of agRaw.data || []) {
          const ageKey = row.age;
          if (!map[ageKey]) map[ageKey] = { age: ageKey, female: 0, male: 0 };
          let val = 0;
          if (metric === "reach") val = num(row.reach);
          else val = getAction(row.actions, metric === "messages"
            ? "onsite_conversion.messaging_conversation_started_7d" : "lead");
          if (row.gender === "female") map[ageKey].female += val;
          else if (row.gender === "male") map[ageKey].male += val;
        }
        return ageOrder.filter((a) => map[a]).map((a) => map[a]);
      };

      // ══ 7) แคมเปญ → adset → ad (+ รูป) — ดึงแบบ batch กัน Worker timeout ══
      // แทนการ loop ยิง insights ทีละตัว (หลายร้อย call) → ใช้ account insights ทีละ level (call เดียวต่อ level)
      const insightsByLevel = async (level) => {
        const map = {};
        let url = `${account}/insights`;
        let params = {
          time_range: timeRange,
          level,
          fields: "spend,reach,clicks,ctr,actions,campaign_id,adset_id,ad_id",
          limit: "500",
        };
        // ดึงทุกหน้า (paging)
        for (let page = 0; page < 6; page++) {
          const res = await graph(url, params, token).catch(() => ({ data: [] }));
          for (const row of res.data || []) {
            const key = level === "campaign" ? row.campaign_id : level === "adset" ? row.adset_id : row.ad_id;
            if (key) map[key] = row;
          }
          const next = res.paging && res.paging.cursors && res.paging.cursors.after;
          if (!next || !(res.data || []).length) break;
          params = { ...params, after: next };
        }
        return map;
      };

      const campInsights = await insightsByLevel("campaign");
      const adsetInsights = await insightsByLevel("adset");
      const adInsights = await insightsByLevel("ad");

      // ดึง list แคมเปญ (แบน) + adset/ad tree (แยก query กัน Meta ไม่ส่ง nested ลึก)
      const campRaw = await graph(`${account}/campaigns`, {
        fields: "name,objective,status",
        limit: "200",
      }, token).catch(() => ({ data: [] }));

      // adset + ad + creative (ทีละแคมเปญที่มี spend เท่านั้น เพื่อลด call)
      const campWithSpend = (campRaw.data || []).filter((c) => num((campInsights[c.id] || {}).spend) > 0);

      const adsetTreeByCampaign = {};
      for (const c of campWithSpend) {
        const tree = await graph(`${c.id}/adsets`, {
          fields: "name,status,ads.limit(50){name,status,creative{thumbnail_url,image_url,object_story_spec,image_hash,asset_feed_spec}}",
          limit: "50",
        }, token).catch(() => ({ data: [] }));
        adsetTreeByCampaign[c.id] = tree.data || [];
      }

      const pickImg = (cr) => {
        cr = cr || {};
        const oss = cr.object_story_spec || {};
        const linkImg = oss.link_data && oss.link_data.picture;
        const videoImg = oss.video_data && oss.video_data.image_url;
        // asset_feed_spec (dynamic creative) มักมีรูปคมชัด
        const afs = cr.asset_feed_spec || {};
        const afsImg = afs.images && afs.images[0] && (afs.images[0].url || afs.images[0].permalink_url);
        // image_url = รูปเต็ม, thumbnail_url = รูปย่อ
        const full = cr.image_url || afsImg || linkImg || videoImg || cr.thumbnail_url || "";
        const thumb = cr.thumbnail_url || full || "";
        return { full, thumb };
      };
      const resultsOf = (row) =>
        getAction(row && row.actions, "onsite_conversion.messaging_conversation_started_7d") ||
        getAction(row && row.actions, "lead");

      const campaigns = [];
      for (const c of campRaw.data || []) {
        const c0 = campInsights[c.id] || {};
        const cSpend = num(c0.spend);
        const cResults = resultsOf(c0);
        const cLead = getAction(c0.actions, "lead");

        const adsets = [];
        for (const as of adsetTreeByCampaign[c.id] || []) {
          const as0 = adsetInsights[as.id] || {};
          const asSpend = num(as0.spend);
          const asResults = resultsOf(as0);
          const asLead = getAction(as0.actions, "lead");

          const ads = [];
          for (const ad of (as.ads && as.ads.data) || []) {
            const ad0 = adInsights[ad.id] || {};
            const { full, thumb } = pickImg(ad.creative);
            ads.push({
              id: ad.id, name: ad.name, format: "Ad",
              status: ad.status === "ACTIVE" ? "Active" : "Pause",
              spend: num(ad0.spend), results: resultsOf(ad0), lead: getAction(ad0.actions, "lead"),
              costPerResult: resultsOf(ad0) > 0 ? num(ad0.spend) / resultsOf(ad0) : 0,
              reach: num(ad0.reach), ctr: num(ad0.ctr), imageUrl: thumb, fullImageUrl: full,
            });
          }

          adsets.push({
            id: as.id, name: as.name, status: as.status === "ACTIVE" ? "Active" : "Pause",
            spend: asSpend, results: asResults, costPerResult: asResults > 0 ? asSpend / asResults : 0,
            lead: asLead, cpl: asLead > 0 ? asSpend / asLead : 0, reach: num(as0.reach), ads,
          });
        }

        // ซ่อน adset ที่ค่าใช้จ่าย 0 + เรียงงบมาก→น้อย
        const adsetsFiltered = adsets
          .filter((a) => a.spend > 0)
          .sort((a, b) => b.spend - a.spend);

        campaigns.push({
          id: c.id, name: c.name, objective: c.objective,
          status: c.status === "ACTIVE" ? "Active" : "Pause",
          spend: cSpend, results: cResults, costPerResult: cResults > 0 ? cSpend / cResults : 0,
          lead: cLead, cpl: cLead > 0 ? cSpend / cLead : 0, reach: num(c0.reach), adsets: adsetsFiltered,
        });
      }

      // ══ กรอง + เรียงแคมเปญ ══
      // 3) ตัดแคมเปญที่ไม่มีการใช้งบ (spend = 0) ออก
      // 2) เรียง: Active ขึ้นก่อน แล้วเรียงงบมาก→น้อย
      const campaignsSorted = campaigns
        .filter((c) => c.spend > 0)
        .sort((a, b) => {
          const aActive = a.status === "Active" ? 1 : 0;
          const bActive = b.status === "Active" ? 1 : 0;
          if (aActive !== bActive) return bActive - aActive; // Active ก่อน
          return b.spend - a.spend; // งบมากก่อน
        });

      // ══ ประกอบ payload รูปเดียวกับ META_SNAPSHOT ══
      const payload = {
        meta: {
          account: "TTC AD Performance",
          dateStart: since, dateStop: until,
          currency: "THB", source: "live",
          pulledAt: ymd(new Date()),
        },
        kpi: {
          spend, costPerResult, results, reach,
          deltaSpend: dSpend, deltaCostPerResult: dCostPerResult, deltaResults: dResults, deltaReach: dReach,
        },
        daily,
        funnel: { reach, clicks, ctr, results, costPerResult },
        budgetBreakdown: { gender, age, province },
        ageGender: {
          messages: buildAgeGender("messages"),
          leadform: buildAgeGender("leadform"),
          reach: buildAgeGender("reach"),
        },
        campaigns: campaignsSorted,
      };

      return json(payload);
    } catch (err) {
      return json({ error: String(err.message || err) }, 500);
    }
  },
};
