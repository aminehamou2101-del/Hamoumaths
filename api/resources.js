```javascript
import { createClient } from "@supabase/supabase-js";

/*
  HAMOU MATH GLOBAL
  Real Database Resources API

  - Reads real resources from Supabase
  - Pagination
  - Search
  - Language filter
  - Type filter
  - Level filter
  - Keeps compatibility with the old API response
*/

function getSupabase() {
  const url = process.env.SUPABASE_URL;

  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are missing");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function clean(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function safeNumber(value, fallback, min, max) {
  const n = Number.parseInt(value, 10);

  if (!Number.isFinite(n)) return fallback;

  return Math.min(Math.max(n, min), max);
}

export default async function handler(req, res) {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300"
  );

  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const supabase = getSupabase();

    const q = clean(req.query?.q);
    const language = clean(req.query?.language);
    const type = clean(
      req.query?.type || req.query?.resource_type
    );
    const level = clean(req.query?.level);

    const page = safeNumber(
      req.query?.page,
      1,
      1,
      1000000
    );

    const limit = safeNumber(
      req.query?.limit,
      24,
      1,
      100
    );

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    /*
      IMPORTANT:
      We deliberately select only columns known to exist
      in the original HAMOU MATH resources table.
    */

    let query = supabase
      .from("resources")
      .select(
        `
        id,
        title,
        description,
        content,
        resource_type,
        language,
        level,
        subject,
        file_url,
        cover_url
        `,
        { count: "exact" }
      )
      .range(from, to);

    /*
      Language
    */
    if (language) {
      query = query.eq("language", language);
    }

    /*
      Level
    */
    if (level) {
      query = query.eq("level", level);
    }

    /*
      Resource type
    */
    if (type) {
      query = query.eq("resource_type", type);
    }

    /*
      Search
    */
    if (q) {
      const safeQuery = q
        .replace(/[%_]/g, "")
        .replace(/,/g, " ")
        .trim()
        .slice(0, 120);

      if (safeQuery) {
        query = query.or(
          [
            `title.ilike.%${safeQuery}%`,
            `description.ilike.%${safeQuery}%`,
            `subject.ilike.%${safeQuery}%`,
            `content.ilike.%${safeQuery}%`
          ].join(",")
        );
      }
    }

    const {
      data,
      error,
      count
    } = await query;

    if (error) {
      console.error(
        "HAMOU MATH resources error:",
        error
      );

      return res.status(500).json({
        ok: false,
        success: false,
        error: "Database query failed",
        details:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined
      });
    }

    const resources = Array.isArray(data)
      ? data
      : [];

    const total =
      typeof count === "number"
        ? count
        : resources.length;

    /*
      Compatible response.

      The old frontend can continue using:
      response.data

      New code can use:
      response.resources
    */

    return res.status(200).json({
      ok: true,
      success: true,

      filters: {
        q,
        language,
        type,
        level
      },

      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_previous: page > 1
      },

      total,

      data: resources,

      resources,

      architecture:
        "HAMOU MATH GLOBAL — Supabase Database-backed Library"
    });

  } catch (error) {
    console.error(
      "HAMOU MATH API error:",
      error
    );

    return res.status(500).json({
      ok: false,
      success: false,
      error: "Server configuration or API error"
    });
  }
}
```
