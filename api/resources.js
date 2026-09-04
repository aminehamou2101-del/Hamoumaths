import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({
        ok: false,
        error: "Method not allowed"
      });
    }

    const SUPABASE_URL =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const SUPABASE_KEY =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({
        ok: false,
        error: "Supabase environment variables are missing"
      });
    }

    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    const queryParams = req.query || {};

    const page = Math.max(
      parseInt(queryParams.page || "1", 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(queryParams.limit || "20", 10) || 20,
        1
      ),
      100
    );

    const language =
      typeof queryParams.language === "string"
        ? queryParams.language.trim()
        : "";

    const level =
      typeof queryParams.level === "string"
        ? queryParams.level.trim()
        : "";

    const type =
      typeof queryParams.type === "string"
        ? queryParams.type.trim()
        : "";

    const q =
      typeof queryParams.q === "string"
        ? queryParams.q.trim()
        : "";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("resources")
      .select("*", { count: "exact" });

    if (language) {
      query = query.eq("language", language);
    }

    if (level) {
      query = query.eq("level", level);
    }

    if (type) {
      query = query.eq("resource_type", type);
    }

    /*
      نستخدم title فقط للبحث النصي حتى لا نفترض
      وجود أعمدة إضافية في قاعدة البيانات.
    */
    if (q) {
      query = query.ilike("title", `%${q}%`);
    }

    query = query.range(from, to);

    const {
      data,
      error,
      count
    } = await query;

    if (error) {
      console.error("SUPABASE_RESOURCES_ERROR:", error);

      return res.status(500).json({
        ok: false,
        error: "Database query failed",
        details: error.message
      });
    }

    const total = count || 0;

    return res.status(200).json({
      ok: true,
      success: true,

      filters: {
        language,
        type,
        level,
        q
      },

      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },

      total,
      pages: Math.ceil(total / limit),

      data: data || [],
      resources: data || [],

      architecture: "Supabase database-backed pagination"
    });

  } catch (error) {
    console.error("RESOURCES_API_CRASH:", error);

    return res.status(500).json({
      ok: false,
      error: "Internal server error",
      details: error?.message || "Unknown error"
    });
  }
}
