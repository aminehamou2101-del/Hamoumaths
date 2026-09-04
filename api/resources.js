import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function send(res, body, status = 200) {
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

function loadLocalResources() {
  try {
    const file = path.join(
      process.cwd(),
      "data",
      "resources.generated.json"
    );

    if (!fs.existsSync(file)) return [];

    const content = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(content);

    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.resources)) return parsed.resources;
    if (Array.isArray(parsed.data)) return parsed.data;

    return [];
  } catch (error) {
    console.error("LOCAL_RESOURCES_ERROR:", error);
    return [];
  }
}

function resourceType(resource) {
  return (
    resource.resource_type ??
    resource.type ??
    resource.category ??
    "resource"
  );
}

function resourceLanguage(resource) {
  return (
    resource.language ??
    resource.lang ??
    "ar"
  );
}

function resourceLevel(resource) {
  return (
    resource.level ??
    resource.grade ??
    "all"
  );
}

function matchesSearch(resource, search) {
  if (!search) return true;

  const values = [
    resource.title,
    resource.title_ar,
    resource.title_fr,
    resource.title_en,
    resource.description,
    resource.field,
    resource.category,
    resource.subject,
    resource.keywords,
  ];

  return normalize(values.flat().join(" ")).includes(normalize(search));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return send(
      res,
      {
        ok: false,
        error: "Method not allowed",
      },
      405
    );
  }

  const q = String(req.query?.q ?? "").trim();
  const language = String(req.query?.language ?? "").trim();
  const level = String(req.query?.level ?? "").trim();
  const type = String(req.query?.type ?? "").trim();

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

  /*
   * =========================================================
   * SUPABASE
   * =========================================================
   */

  const supabaseUrl = String(
    process.env.SUPABASE_URL ?? ""
  ).trim();

  const serviceRoleKey = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  ).trim();

  if (supabaseUrl && serviceRoleKey) {
    try {
      const supabase = createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

      /*
       * مهم:
       * نستعمل select("*") ولا نفترض وجود field/category
       * حتى لا تتوقف المكتبة إذا كانت بنية الجدول مختلفة.
       */
      let query = supabase
        .from("resources")
        .select("*", { count: "exact" });

      if (language && language !== "all") {
        query = query.eq("language", language);
      }

      if (level && level !== "all") {
        query = query.eq("level", level);
      }

      if (type && type !== "all") {
        /*
         * resource_type هو الاسم المتوقع في schema الحالي.
         */
        query = query.eq("resource_type", type);
      }

      if (q) {
        /*
         * البحث فقط في الأعمدة الموجودة فعليًا في البنية الحالية.
         * لا نستخدم field هنا.
         */
        const safe = q
          .replace(/[,%()]/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (safe) {
          query = query.or(
            `title.ilike.%${safe}%,description.ilike.%${safe}%`
          );
        }
      }

      const result = await query
        .range(from, to)
        .order("created_at", {
          ascending: false,
        });

      if (!result.error) {
        const resources = Array.isArray(result.data)
          ? result.data
          : [];

        const total = Number(result.count ?? 0);

        return send(res, {
          ok: true,
          source: "supabase",
          resources,
          data: resources,
          total,
          pages: Math.max(1, Math.ceil(total / limit)),
          pagination: {
            page,
            limit,
            total,
          },
        });
      }

      console.error(
        "SUPABASE_RESOURCES_ERROR:",
        result.error
      );
    } catch (error) {
      console.error(
        "SUPABASE_RESOURCES_EXCEPTION:",
        error
      );
    }
  }

  /*
   * =========================================================
   * FALLBACK LOCAL LIBRARY
   * =========================================================
   */

  let resources = loadLocalResources();

  resources = resources.filter((resource) => {
    if (
      language &&
      language !== "all" &&
      resourceLanguage(resource) !== language
    ) {
      return false;
    }

    if (
      level &&
      level !== "all" &&
      resourceLevel(resource) !== level
    ) {
      return false;
    }

    if (
      type &&
      type !== "all" &&
      resourceType(resource) !== type
    ) {
      return false;
    }

    if (!matchesSearch(resource, q)) {
      return false;
    }

    return true;
  });

  const total = resources.length;

  const pageResources = resources.slice(
    from,
    from + limit
  );

  return send(res, {
    ok: true,
    source: "generated-library",
    resources: pageResources,
    data: pageResources,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    pagination: {
      page,
      limit,
      total,
    },
  });
}
