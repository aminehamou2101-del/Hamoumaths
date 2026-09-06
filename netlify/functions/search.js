import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function response(body, statusCode = 200) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}

function localResources() {
  try {
    const file = path.join(
      process.cwd(),
      "data",
      "resources.generated.json"
    );

    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));

    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.resources)) return parsed.resources;
    if (Array.isArray(parsed.data)) return parsed.data;

    return [];
  } catch (error) {
    console.error("LOCAL_LIBRARY_ERROR", error);
    return [];
  }
}

function norm(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function cleanSearch(value) {
  return String(value ?? "")
    .replace(/[%_,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
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
        r.content,
        r.category,
        r.type,
        r.resource_type,
        r.field,
        r.subject,
        ...(Array.isArray(r.keywords) ? r.keywords : []),
      ].join(" ")
    );

    const matchesQuery = !nq || text.includes(nq);

    const matchesLanguage =
      !language ||
      language === "all" ||
      String(r.language ?? "").toLowerCase() === language.toLowerCase();

    const matchesType =
      !type ||
      type === "all" ||
      String(r.type ?? "").toLowerCase() === type.toLowerCase() ||
      String(r.resource_type ?? "").toLowerCase() === type.toLowerCase();

    const matchesLevel =
      !level ||
      level === "all" ||
      String(r.level ?? "").toLowerCase() === level.toLowerCase();

    return (
      matchesQuery &&
      matchesLanguage &&
      matchesType &&
      matchesLevel
    );
  });
}

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return response(
      {
        ok: false,
        error: "Method not allowed",
      },
      405
    );
  }

  const params = event.queryStringParameters || {};

  const q = cleanSearch(params.q);
  const language = String(params.language ?? "").trim();
  const type = String(params.type ?? "").trim();
  const level = String(params.level ?? "").trim();

  const page = Math.max(
    parseInt(params.page ?? "1", 10) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      parseInt(params.limit ?? "24", 10) || 24,
      1
    ),
    100
  );

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const supabaseUrl =
      String(process.env.SUPABASE_URL ?? "").trim();

    const supabaseKey =
      String(
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.SUPABASE_ANON_KEY ||
          ""
      ).trim();

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(
        supabaseUrl,
        supabaseKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

      let query = supabase
        .from("resources")
        .select("*", { count: "exact" })
        .eq("is_published", true);

      if (language && language !== "all") {
        query = query.eq("language", language);
      }

      if (level && level !== "all") {
        query = query.eq("level", level);
      }

      if (type && type !== "all") {
        query = query.eq("type", type);
      }

      if (q) {
        const safe = q
          .replace(/[%_,()]/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        query = query.or(
          [
            `title.ilike.%${safe}%`,
            `description.ilike.%${safe}%`,
            `content.ilike.%${safe}%`,
            `category.ilike.%${safe}%`,
            `type.ilike.%${safe}%`,
          ].join(",")
        );
      }

      const {
        data,
        error,
        count,
      } = await query
        .range(from, to)
        .order("created_at", {
          ascending: false,
        });

      if (!error) {
        const total = Number(count || 0);

        return response({
          ok: true,
          source: "supabase",
          total,
          pages: Math.max(
            1,
            Math.ceil(total / limit)
          ),
          pagination: {
            page,
            limit,
            total,
          },
          results: data || [],
          resources: data || [],
          data: data || [],
        });
      }

      console.error(
        "SUPABASE_SEARCH_ERROR",
        error
      );
    }

    // Fallback للمكتبة المحلية
    const local = localResources();

    const filtered = filterLocal(
      local,
      q,
      language,
      type,
      level
    );

    const results = filtered.slice(
      from,
      to + 1
    );

    const total = filtered.length;

    return response({
      ok: true,
      source: "generated-library",
      total,
      pages: Math.max(
        1,
        Math.ceil(total / limit)
      ),
      pagination: {
        page,
        limit,
        total,
      },
      results,
      resources: results,
      data: results,
    });
  } catch (error) {
    console.error(
      "SEARCH_API_ERROR",
      error
    );

    // حتى في حالة تعطل Supabase
    // نحاول استخدام المكتبة المحلية
    try {
      const local = localResources();

      const filtered = filterLocal(
        local,
        q,
        language,
        type,
        level
      );

      const results = filtered.slice(
        from,
        to + 1
      );

      const total = filtered.length;

      return response({
        ok: true,
        source: "generated-library",
        total,
        pages: Math.max(
          1,
          Math.ceil(total / limit)
        ),
        pagination: {
          page,
          limit,
          total,
        },
        results,
        resources: results,
        data: results,
      });
    } catch {
      return response(
        {
          ok: false,
          error:
            "Search service temporarily unavailable",
          results: [],
          resources: [],
          data: [],
        },
        500
      );
    }
  }
}
