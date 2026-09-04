import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: "Supabase configuration missing"
      });
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey
    );

    const page = Math.max(
      parseInt(req.query.page || "1", 10),
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit || "24", 10),
        1
      ),
      100
    );

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("resources")
      .select("*", { count: "exact" })
      .range(from, to);

    if (req.query.language) {
      query = query.eq(
        "language",
        String(req.query.language)
      );
    }

    if (req.query.level) {
      query = query.eq(
        "level",
        String(req.query.level)
      );
    }

    if (req.query.type) {
      query = query.eq(
        "resource_type",
        String(req.query.type)
      );
    }

    if (req.query.q) {
      const q = String(req.query.q)
        .trim()
        .replace(/[%_]/g, "");

      if (q) {
        query = query.or(
          `title.ilike.%${q}%,description.ilike.%${q}%,subject.ilike.%${q}%`
        );
      }
    }

    const result = await query;

    if (result.error) {
      console.error(result.error);

      return res.status(500).json({
        success: false,
        error: "Unable to load resources"
      });
    }

    const total = result.count || 0;

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      resources: result.data || []
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
}
