import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({
        ok: false,
        error: "Method not allowed"
      });
    }

    const url = String(process.env.SUPABASE_URL || "").trim();
    const key = String(process.env.SUPABASE_PUBLISHABLE_KEY || "").trim();

    // تحقق من URL
    if (!/^https:\/\/[A-Za-z0-9.-]+\.supabase\.co\/?$/.test(url)) {
      return res.status(500).json({
        ok: false,
        error: "Invalid SUPABASE_URL format"
      });
    }

    // تحقق صارم من المفتاح
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
      return res.status(500).json({
        ok: false,
        error: "Invalid SUPABASE_PUBLISHABLE_KEY format",
        hint: "The Vercel variable contains extra characters, spaces, Arabic text, quotes, or the wrong key."
      });
    }

    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const page = Math.max(
      parseInt(req.query?.page || "1", 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query?.limit || "20", 10) || 20,
        1
      ),
      100
    );

    const language =
      typeof req.query?.language === "string"
        ? req.query.language.trim()
        : "";

    const level =
      typeof req.query?.level === "string"
        ? req.query.level.trim()
        : "";

    const type =
      typeof req.query?.type === "string"
        ? req.query.type.trim()
        : "";

    const q =
      typeof req.query?.q === "string"
        ? req.query.q.trim()
        : "";

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("resources")
      .select("*", { count: "exact" });

    if (language) query = query.eq("language", language);
    if (level) query = query.eq("level", level);
    if (type) query = query.eq("resource_type", type);
    if (q) query = query.ilike("title", `%${q}%`);

    query = query.range(from, to);

    const { data, error, count } = await query;

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
      total,
      pages: Math.ceil(total / limit),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        language,
        level,
        type,
        q
      },
      data: data || [],
      resources: data || []
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
