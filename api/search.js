import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function json(res, body, status = 200) {
  return res
    .status(status)
    .setHeader("Content-Type", "application/json; charset=utf-8")
    .json(body);
}
function localResources() {
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
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
function filterLocal(items, q, language, type, level) {
  const nq = norm(q);
  return items.filter((r) => {
    const text = norm(
      [
        r.title,
        r.title_ar,
        r.title_fr,
        r.title_en,
        r.description,
        r.field,
        ...(r.keywords || []),
      ].join(" ")
    );
    return (
      (!nq || text.includes(nq)) &&
      (!language || r.language === language) &&
      (!type || r.type === type || r.resource_type === type) &&
      (!level || level === "all" || r.level === level)
    );
  });
}
export default async function handler(req, res) {
  if (req.method !== "GET")
    return json(res, { ok: false, error: "Method not allowed" }, 405);
  const q = String(req.query?.q || "").trim(),
    language = String(req.query?.language || "").trim(),
    type = String(req.query?.type || "").trim(),
    level = String(req.query?.level || "").trim();
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
      if (q)
        query = query.or(
          `title.ilike.%${q.replace( /[%_,()]/g, " " )}%,description.ilike.%${q.replace(/[%_,()]/g, " ")}%`
        );
      const { data, error, count } = await query
        .range(from, from + limit - 1)
        .order("created_at", { ascending: false });
      if (!error && Number(count || 0) > 0)
        return json(res, {
          ok: true,
          total: Number(count || 0),
          pages: Math.ceil(Number(count || 0) / limit),
          pagination: { page, limit, total: Number(count || 0) },
          results: data || [],
          resources: data || [],
          data: data || [],
        });
    }
    const filtered = filterLocal(localResources(), q, language, type, level),
      results = filtered.slice(from, from + limit);
    return json(res, {
      ok: true,
      total: filtered.length,
      pages: Math.max(1, Math.ceil(filtered.length / limit)),
      pagination: { page, limit, total: filtered.length },
      results,
      resources: results,
      data: results,
      source: "generated-library",
    });
  } catch (error) {
    console.error("SEARCH_API_ERROR", error);
    return json(
      res,
      { ok: false, error: "Search service temporarily unavailable" },
      500
    );
  }
}
