import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function json(res, body, status = 200) {
  return res
    .status(status)
    .setHeader("Content-Type", "application/json; charset=utf-8")
    .json(body);
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

    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return json(
      res,
      {
        ok: false,
        error: "Method not allowed"
      },
      405
    );
  }

  const q = cleanQuery(req.query?.q);

  const language = String(
    req.query?.language ?? ""
  ).trim();

  const level = String(
    req.query?.level ?? ""
  ).trim();

  const type = String(
    req.query?.type ?? ""
  ).trim();

  const field = String(
    req.query?.field ?? ""
  ).trim();

  const subject = String(
    req.query?.subject ?? ""
  ).trim();

  const page = Math.max(
    Number.parseInt(req.query?.page ?? "1", 10) || 1,
    1
  );

  const limit = Math.min(
    Math.max(
      Number.parseInt(req.query?.limit ?? "24", 10) || 24,
      1
    ),
    100
  );

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const supabaseUrl =
      String(process.env.SUPABASE_URL || "").trim();

    const serviceRoleKey =
      String(
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
      ).trim();

    /*
     * =====================================================
     * SUPABASE — المصدر الرئيسي للمكتبة
     * =====================================================
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
       * إظهار الموارد النشطة فقط إذا كان العمود موجودًا.
       * إذا كانت قاعدة البيانات قديمة فلن نكسر API.
       */

      query = query.eq("is_active", true);

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

      /*
       * بحث واسع في الحقول الأساسية.
       */

      if (q) {
        const safe = q
          .replace(/[%_,]/g, " ")
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

      const {
        data,
        error,
        count
      } = await query
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

      if (!error) {
        const total = Number(count || 0);

        return json(res, {
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
            from,
            to
          },

          filters: {
            q,
            language,
            level,
            type,
            field,
            subject
          },

          resources: data || [],

          data: data || []
        });
      }

      console.error(
        "SUPABASE_RESOURCES_ERROR:",
        error
      );
    }

    /*
     * =====================================================
     * FALLBACK — المكتبة المحلية
     * =====================================================
     */

    const local = localResources();

    const nq = normalize(q);

    const filtered = local.filter((resource) => {
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

      const searchable = normalize(
        [
          resource.title,
          resource.title_ar,
          resource.title_fr,
          resource.title_en,
          resource.description,
          resource.field,
          resource.fieldAr,
          resource.subject,
          resource.author,
          resource.publisher,
          resource.source_name,
          ...(Array.isArray(resource.keywords)
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
    });

    const total = filtered.length;

    const data = filtered.slice(
      from,
      to + 1
    );

    return json(res, {
      ok: true,

      source: "local",

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

      filters: {
        q,
        language,
        level,
        type,
        field,
        subject
      },

      resources: data,

      data
    });
  } catch (error) {
    console.error(
      "RESOURCES_API_ERROR:",
      error
    );

    return json(
      res,
      {
        ok: false,
        error: "تعذر تحميل مكتبة HAMOU MATH"
      },
      500
    );
  }
}
