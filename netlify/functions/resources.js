
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60"
    },
    body: JSON.stringify(body)
  };
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function cleanQuery(value) {
  return String(value ?? "")
    .trim()
    .replace(/[%,()]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function localResources() {
  try {
    const file = path.join(
      process.cwd(),
      "data",
      "resources.generated.json"
    );

    if (!fs.existsSync(file)) {
      return [];
    }

    const parsed = JSON.parse(
      fs.readFileSync(file, "utf8")
    );

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (Array.isArray(parsed?.resources)) {
      return parsed.resources;
    }

    if (Array.isArray(parsed?.data)) {
      return parsed.data;
    }

    return [];
  } catch (error) {
    console.error("LOCAL_RESOURCES_ERROR:", error);
    return [];
  }
}

function getParams(event) {
  const params = event?.queryStringParameters || {};

  return {
    q: cleanQuery(params.q),
    language: String(params.language ?? "").trim(),
    level: String(params.level ?? "").trim(),
    type: String(params.type ?? "").trim(),
    field: String(params.field ?? "").trim(),
    subject: String(params.subject ?? "").trim(),
    page: Math.max(
      Number.parseInt(params.page ?? "1", 10) || 1,
      1
    ),
    limit: Math.min(
      Math.max(
        Number.parseInt(params.limit ?? "24", 10) || 24,
        1
      ),
      100
    )
  };
}

function buildResult({
  source,
  data,
  total,
  page,
  limit,
  from,
  to,
  filters
}) {
  return {
    ok: true,
    source,
    total,
    pages: Math.max(
      1,
      Math.ceil(total / limit)
    ),
    pagination: {
      page,
      limit,
      total,
      from,
      to
    },
    filters,
    resources: data || [],
    data: data || []
  };
}

export async function handler(event) {
  const method = String(
    event?.httpMethod || "GET"
  ).toUpperCase();

  if (method !== "GET") {
    return response(405, {
      ok: false,
      error: "Method not allowed"
    });
  }

  const {
    q,
    language,
    level,
    type,
    field,
    subject,
    page,
    limit
  } = getParams(event);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const filters = {
    q,
    language,
    level,
    type,
    field,
    subject
  };

  try {
    const supabaseUrl = String(
      process.env.SUPABASE_URL || ""
    ).trim();

    const serviceRoleKey = String(
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    ).trim();

    /*
     * ==========================================
     * SUPABASE
     * ==========================================
     */

    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      );

      let query = supabase
        .from("resources")
        .select("*", {
          count: "exact"
        });

      /*
       * مهم:
       * resources يستخدم is_published
       * وليس is_active.
       */

      query = query.eq(
        "is_published",
        true
      );

      if (language) {
        query = query.eq(
          "language",
          language
        );
      }

      if (level && level !== "all") {
        query = query.eq(
          "level",
          level
        );
      }

      /*
       * يدعم resource_type أو type.
       * نحاول resource_type أولًا لأنه موجود
       * في بنية مشروعك القديمة.
       */

      if (type && type !== "all") {
        query = query.eq(
          "resource_type",
          type
        );
      }

      if (field && field !== "all") {
        query = query.eq(
          "field",
          field
        );
      }

      if (subject && subject !== "all") {
        query = query.eq(
          "subject",
          subject
        );
      }

      if (q) {
        const safe = q
          .replace(/[%_,]/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (safe) {
          query = query.or(
            [
              `title.ilike.%${safe}%`,
              `title_ar.ilike.%${safe}%`,
              `title_fr.ilike.%${safe}%`,
              `title_en.ilike.%${safe}%`,
              `description.ilike.%${safe}%`,
              `field.ilike.%${safe}%`,
              `subject.ilike.%${safe}%`,
              `author.ilike.%${safe}%`,
              `publisher.ilike.%${safe}%`,
              `source_name.ilike.%${safe}%`
            ].join(",")
          );
        }
      }

      const result = await query
        .range(from, to)
        .order(
          "is_featured",
          {
            ascending: false,
            nullsFirst: false
          }
        )
        .order(
          "created_at",
          {
            ascending: false,
            nullsFirst: false
          }
        );

      if (!result.error) {
        const total = Number(
          result.count || 0
        );

        return response(
          200,
          buildResult({
            source: "supabase",
            data: result.data || [],
            total,
            page,
            limit,
            from,
            to,
            filters
          })
        );
      }

      console.error(
        "SUPABASE_RESOURCES_ERROR:",
        result.error
      );
    }

    /*
     * ==========================================
     * LOCAL FALLBACK
     * ==========================================
     */

    const local = localResources();

    const nq = normalize(q);

    const filtered = local.filter(
      (resource) => {
        const resourceLanguage =
          String(
            resource.language ?? ""
          ).trim();

        const resourceLevel =
          String(
            resource.level ?? ""
          ).trim();

        const resourceType =
          String(
            resource.resource_type ??
              resource.type ??
              ""
          ).trim();

        const resourceField =
          String(
            resource.field ?? ""
          ).trim();

        const resourceSubject =
          String(
            resource.subject ?? ""
          ).trim();

        const published =
          resource.is_published ??
          resource.published ??
          resource.is_active ??
          true;

        if (
          published === false ||
          published === 0 ||
          published === "false"
        ) {
          return false;
        }

        const searchable = normalize(
          [
            resource.title,
            resource.title_ar,
            resource.title_fr,
            resource.title_en,
            resource.description,
            resource.content,
            resource.field,
            resource.fieldAr,
            resource.subject,
            resource.author,
            resource.publisher,
            resource.source_name,
            ...(Array.isArray(
              resource.keywords
            )
              ? resource.keywords
              : [])
          ]
            .filter(Boolean)
            .join(" ")
        );

        const matchesSearch =
          !nq ||
          searchable.includes(nq);

        const matchesLanguage =
          !language ||
          resourceLanguage === language;

        const matchesLevel =
          !level ||
          level === "all" ||
          resourceLevel === level;

        const matchesType =
          !type ||
          type === "all" ||
          resourceType === type;

        const matchesField =
          !field ||
          field === "all" ||
          resourceField === field;

        const matchesSubject =
          !subject ||
          subject === "all" ||
          resourceSubject === subject;

        return (
          matchesSearch &&
          matchesLanguage &&
          matchesLevel &&
          matchesType &&
          matchesField &&
          matchesSubject
        );
      }
    );

    const total = filtered.length;

    const data = filtered.slice(
      from,
      to + 1
    );

    return response(
      200,
      buildResult({
        source: "local",
        data,
        total,
        page,
        limit,
        from,
        to,
        filters
      })
    );
  } catch (error) {
    console.error(
      "RESOURCES_FUNCTION_ERROR:",
      error
    );

    /*
     * حتى في حالة فشل Supabase،
     * نحاول المكتبة المحلية.
     */

    try {
      const local = localResources();

      const data = local.slice(
        from,
        to + 1
      );

      return response(
        200,
        buildResult({
          source: "local",
          data,
          total: local.length,
          page,
          limit,
          from,
          to,
          filters
        })
      );
    } catch {
      return response(500, {
        ok: false,
        error:
          "تعذر تحميل مكتبة HAMOU MATH"
      });
    }
  }
}
