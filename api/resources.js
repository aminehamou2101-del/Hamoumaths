import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
function json(res, b, s = 200) {
  return res
    .status(s)
    .setHeader("Content-Type", "application/json; charset=utf-8")
    .json(b);
}
function local() {
  try {
    return JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), "data", "resources.generated.json"),
        "utf8"
      )
    );
  } catch {
    return [];
  }
}
function norm(v) {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
export default async function handler(req, res) {
  if (req.method !== "GET")
    return json(res, { ok: false, error: "Method not allowed" }, 405);
  const q = String(req.query?.q || "").trim(),
    language = String(req.query?.language || "").trim(),
    level = String(req.query?.level || "").trim(),
    type = String(req.query?.type || "").trim();
  const page = Math.max(parseInt(req.query?.page || "1", 10) || 1, 1),
    limit = Math.min(
      Math.max(parseInt(req.query?.limit || "24", 10) || 24, 1),
      100
    ),
    from = (page - 1) * limit;
  try {
    const url = String(process.env.SUPABASE_URL || "").trim(),
      key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    if (url && key) {
      const sb = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      let query = sb.from("resources").select("*", { count: "exact" });
      if (language) query = query.eq("language", language);
      if (level && level !== "all") query = query.eq("level", level);
      if (type) query = query.eq("resource_type", type);
      if (q) {
        const safe = q.replace(/[%_,()]/g, " ");
        query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
      }
      const { data, error, count } = await query
        .range(from, from + limit - 1)
        .order("created_at", { ascending: false });
      if (!error && Number(count || 0) > 0)
        return json(res, {
          ok: true,
          total: Number(count || 0),
          pages: Math.ceil(Number(count || 0) / limit),
          pagination: { page, limit, total: Number(count || 0) },
          resources: data || [],
          data: data || [],
        });
    }
    const nq = norm(q);
    let all = local().filter(
      (r) =>
        (!language || r.language === language) &&
        (!level || level === "all" || r.level === level) &&
        (!type || r.type === type || r.resource_type === type) &&
        (!nq ||
          norm(
            [
              r.title,
              r.title_ar,
              r.title_fr,
              r.title_en,
              r.description,
              r.field,
              ...(r.keywords || []),
            ].join(" ")
          ).includes(nq))
    );
    const data = all.slice(from, from + limit);
    return json(res, {
      ok: true,
      total: all.length,
      pages: Math.max(1, Math.ceil(all.length / limit)),
      pagination: { page, limit, total: all.length },
      resources: data,
      data,
      source: "generated-library",
    });
  } catch (e) {
    console.error("RESOURCES_API_ERROR", e);
    return json(res, { ok: false, error: "تعذر تحميل المكتبة" }, 500);
  }
}
