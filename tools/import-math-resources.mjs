import { createClient } from "@supabase/supabase-js";

/*
========================================================
 HAMOU MATH GLOBAL
 Dynamic Resource Importer
 Node 24 + ES Modules + Supabase

 المصادر لا تُكتب داخل الكود.
 يتم قراءتها تلقائيًا من:

 public.resource_sources

 فقط المصادر:
 is_active = true

 يتم استخدامها.
========================================================
*/

const SUPABASE_URL =
  String(process.env.SUPABASE_URL || "").trim();

const SUPABASE_SERVICE_ROLE_KEY =
  String(
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  ).trim();

if (!SUPABASE_URL) {
  console.error("❌ SUPABASE_URL غير موجود.");
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "❌ SUPABASE_SERVICE_ROLE_KEY غير موجود."
  );
  process.exit(1);
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

/* ======================================================
   الإعدادات
====================================================== */

const BATCH_SIZE = 250;
const MAX_LINKS_PER_SOURCE = 5000;

/* ======================================================
   أدوات عامة
====================================================== */

function clean(value, max = 1000) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalize(value) {
  return clean(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);

    parsed.hash = "";

    const trackingParameters = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid"
    ];

    for (const parameter of trackingParameters) {
      parsed.searchParams.delete(parameter);
    }

    return parsed
      .toString()
      .replace(/\/$/, "");
  } catch {
    return "";
  }
}

/* ======================================================
   اكتشاف اللغة
====================================================== */

function detectLanguage(text) {
  const original = String(text ?? "");
  const value = normalize(original);

  if (/[\u0600-\u06ff]/.test(original)) {
    return "ar";
  }

  const frenchWords = [
    "mathematiques",
    "mathematique",
    "cours",
    "exercices",
    "algebre",
    "geometrie",
    "probabilite",
    "probabilites",
    "statistique",
    "statistiques",
    "analyse",
    "equations",
    "fonctions"
  ];

  if (
    frenchWords.some((word) =>
      value.includes(word)
    )
  ) {
    return "fr";
  }

  return "en";
}

/* ======================================================
   اكتشاف المستوى
====================================================== */

function detectLevel(text) {
  const value = normalize(text);

  if (
    value.includes("phd") ||
    value.includes("doctoral") ||
    value.includes("doctorate") ||
    value.includes("research")
  ) {
    return "phd";
  }

  if (
    value.includes("master") ||
    value.includes("graduate")
  ) {
    return "master";
  }

  if (
    value.includes("university") ||
    value.includes("college") ||
    value.includes("undergraduate")
  ) {
    return "university";
  }

  if (
    value.includes("baccalaureate") ||
    value.includes("baccalaureat") ||
    value.includes("bac")
  ) {
    return "baccalaureate";
  }

  if (
    value.includes("secondary") ||
    value.includes("high school") ||
    value.includes("lycee")
  ) {
    return "secondary";
  }

  if (
    value.includes("middle school") ||
    value.includes("junior high") ||
    value.includes("college")
  ) {
    return "middle";
  }

  if (
    value.includes("elementary") ||
    value.includes("primary") ||
    value.includes("primaire")
  ) {
    return "primary";
  }

  return "university";
}

/* ======================================================
   اكتشاف المجال
====================================================== */

function detectField(text) {
  const value = normalize(text);

  const fields = [
    [
      "probability",
      [
        "probability",
        "probabilite",
        "probabilites"
      ]
    ],

    [
      "statistics",
      [
        "statistics",
        "statistique",
        "statistiques"
      ]
    ],

    [
      "algebra",
      [
        "algebra",
        "algebre"
      ]
    ],

    [
      "geometry",
      [
        "geometry",
        "geometrie"
      ]
    ],

    [
      "calculus",
      [
        "calculus",
        "calculation",
        "calcul differentiel"
      ]
    ],

    [
      "analysis",
      [
        "analysis",
        "analyse"
      ]
    ],

    [
      "linear_algebra",
      [
        "linear algebra",
        "algebre lineaire"
      ]
    ],

    [
      "number_theory",
      [
        "number theory",
        "theorie des nombres"
      ]
    ],

    [
      "differential_equations",
      [
        "differential equations",
        "equations differentielles"
      ]
    ],

    [
      "optimization",
      [
        "optimization",
        "optimisation"
      ]
    ],

    [
      "logic",
      [
        "logic",
        "logique"
      ]
    ],

    [
      "discrete_mathematics",
      [
        "discrete mathematics",
        "mathematiques discretes"
      ]
    ]
  ];

  for (const [field, keywords] of fields) {
    if (
      keywords.some((keyword) =>
        value.includes(keyword)
      )
    ) {
      return field;
    }
  }

  return "mathematics";
}

/* ======================================================
   اكتشاف نوع المورد
====================================================== */

function detectType(text) {
  const value = normalize(text);

  if (
    value.includes("exercise") ||
    value.includes("exercises") ||
    value.includes("problem set") ||
    value.includes("problem sets") ||
    value.includes("problems")
  ) {
    return "تمرين";
  }

  if (
    value.includes("exam") ||
    value.includes("examination") ||
    value.includes("test") ||
    value.includes("quiz")
  ) {
    return "امتحان";
  }

  if (
    value.includes("solution") ||
    value.includes("solutions") ||
    value.includes("answer key")
  ) {
    return "حلول";
  }

  if (
    value.includes("summary") ||
    value.includes("summaries") ||
    value.includes("review")
  ) {
    return "ملخص";
  }

  if (
    value.includes("book") ||
    value.includes("textbook") ||
    value.includes("text book")
  ) {
    return "كتاب";
  }

  if (
    value.includes("video") ||
    value.includes("lecture video")
  ) {
    return "فيديو";
  }

  return "درس";
}

/* ======================================================
   جلب المصادر من Supabase
====================================================== */

async function getSources() {
  console.log(
    "📚 قراءة المصادر من resource_sources..."
  );

  const {
    data,
    error
  } = await supabase
    .from("resource_sources")
    .select(`
      id,
      name,
      base_url,
      source_type,
      language,
      description,
      license,
      license_url,
      is_active,
      last_indexed_at,
      total_discovered,
      total_imported
    `)
    .eq("is_active", true)
    .order("id", {
      ascending: true
    });

  if (error) {
    throw new Error(
      `تعذر قراءة resource_sources: ${error.message}`
    );
  }

  return data || [];
}

/* ======================================================
   تسجيل بداية عملية الفهرسة
====================================================== */

async function createImportRun(sourceId) {
  const {
    data,
    error
  } = await supabase
    .from("resource_import_runs")
    .insert({
      source_id: sourceId,
      status: "running",
      started_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(
      `تعذر إنشاء سجل الاستيراد: ${error.message}`
    );
  }

  return data.id;
}

/* ======================================================
   تحديث عملية الفهرسة
====================================================== */

async function finishImportRun(
  runId,
  stats,
  status = "completed",
  errorMessage = null
) {
  const {
    error
  } = await supabase
    .from("resource_import_runs")
    .update({
      status,

      finished_at:
        new Date().toISOString(),

      discovered_count:
        stats.discovered,

      inserted_count:
        stats.inserted,

      skipped_count:
        stats.skipped,

      failed_count:
        stats.failed,

      error_message:
        errorMessage
    })
    .eq("id", runId);

  if (error) {
    console.warn(
      "⚠️ تعذر تحديث سجل الاستيراد:",
      error.message
    );
  }
}

/* ======================================================
   تحديث إحصائيات المصدر
====================================================== */

async function updateSourceStats(
  sourceId,
  discovered,
  imported
) {
  const {
    error
  } = await supabase
    .from("resource_sources")
    .update({
      last_indexed_at:
        new Date().toISOString(),

      total_discovered:
        discovered,

      total_imported:
        imported,

      updated_at:
        new Date().toISOString()
    })
    .eq("id", sourceId);

  if (error) {
    console.warn(
      "⚠️ تعذر تحديث إحصائيات المصدر:",
      error.message
    );
  }
}

/* ======================================================
   جلب صفحة المصدر
====================================================== */

async function fetchPage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "HAMOU-MATH-GLOBAL-RESOURCE-INDEXER/1.0",
        "Accept":
          "text/html,application/xhtml+xml"
      },

      signal:
        AbortSignal.timeout(20000)
    });

    if (!response.ok) {
      console.warn(
        `⚠️ HTTP ${response.status}: ${url}`
      );

      return "";
    }

    return await response.text();
  } catch (error) {
    console.warn(
      `⚠️ فشل جلب ${url}: ${error.message}`
    );

    return "";
  }
}

/* ======================================================
   استخراج الروابط
====================================================== */

function extractLinks(
  html,
  baseUrl
) {
  const results = [];

  if (!html) {
    return results;
  }

  const regex =
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;

  while (
    (match = regex.exec(html))
  ) {
    const href =
      match[1];

    const rawTitle =
      match[2];

    const title =
      clean(
        rawTitle
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/gi, " ")
      );

    if (
      !title ||
      title.length < 3
    ) {
      continue;
    }

    try {
      const url =
        new URL(
          href,
          baseUrl
        ).toString();

      if (
        !/^https?:\/\//i.test(url)
      ) {
        continue;
      }

      results.push({
        title,
        description: title,
        url
      });
    } catch {
      // رابط غير صالح
    }

    if (
      results.length >=
      MAX_LINKS_PER_SOURCE
    ) {
      break;
    }
  }

  return results;
}

/* ======================================================
   تحويل الرابط إلى مورد
====================================================== */

function makeResource(
  item,
  source
) {
  const cleanUrl =
    normalizeUrl(item.url);

  if (!cleanUrl) {
    return null;
  }

  const text = [
    item.title,
    item.description,
    source.name,
    source.description,
    cleanUrl
  ].join(" ");

  const language =
    source.language ||
    detectLanguage(text);

  const level =
    detectLevel(text);

  const field =
    detectField(text);

  const resourceType =
    detectType(text);

  return {
    title:
      clean(item.title, 500),

    title_ar:
      language === "ar"
        ? clean(item.title, 500)
        : null,

    title_fr:
      language === "fr"
        ? clean(item.title, 500)
        : null,

    title_en:
      language === "en"
        ? clean(item.title, 500)
        : null,

    description:
      clean(
        item.description ||
        source.description ||
        item.title,
        2000
      ),

    resource_type:
      resourceType,

    level,

    subject:
      "mathematics",

    field,

    language,

    author:
      null,

    publisher:
      source.name,

    source_name:
      source.name,

    source_url:
      normalizeUrl(source.base_url),

    resource_url:
      cleanUrl,

    thumbnail_url:
      null,

    license:
      source.license ||
      null,

    license_url:
      source.license_url ||
      null,

    year:
      null,

    keywords: [
      "mathematics",
      field,
      level,
      language,
      source.name
    ],

    is_free:
      true,

    is_featured:
      false,

    is_verified:
      false,

    is_active:
      true,

    views:
      0
  };
}

/* ======================================================
   إزالة التكرار
====================================================== */

function deduplicate(resources) {
  const map =
    new Map();

  for (const resource of resources) {
    const url =
      normalizeUrl(
        resource.resource_url
      );

    if (!url) {
      continue;
    }

    if (!map.has(url)) {
      map.set(
        url,
        resource
      );
    }
  }

  return [
    ...map.values()
  ];
}

/* ======================================================
   معرفة الموارد الموجودة
====================================================== */

async function getExistingUrls(
  urls
) {
  const existing =
    new Set();

  for (
    let i = 0;
    i < urls.length;
    i += 100
  ) {
    const chunk =
      urls.slice(
        i,
        i + 100
      );

    const {
      data,
      error
    } = await supabase
      .from("resources")
      .select("resource_url")
      .in(
        "resource_url",
        chunk
      );

    if (error) {
      throw error;
    }

    for (
      const row of data || []
    ) {
      if (
        row.resource_url
      ) {
        existing.add(
          normalizeUrl(
            row.resource_url
          )
        );
      }
    }
  }

  return existing;
}

/* ======================================================
   إدخال الموارد
====================================================== */

async function insertInBatches(
  resources
) {
  let inserted = 0;
  let failed = 0;

  for (
    let i = 0;
    i < resources.length;
    i += BATCH_SIZE
  ) {
    const batch =
      resources.slice(
        i,
        i + BATCH_SIZE
      );

    const {
      error
    } = await supabase
      .from("resources")
      .insert(batch);

    if (error) {
      console.error(
        `❌ فشل إدخال دفعة ${i} - ${i + batch.length}:`,
        error.message
      );

      failed +=
        batch.length;

      continue;
    }

    inserted +=
      batch.length;

    console.log(
      `   ✅ ${inserted}/${resources.length}`
    );
  }

  return {
    inserted,
    failed
  };
}

/* ======================================================
   فهرسة مصدر واحد
====================================================== */

async function indexSource(
  source
) {
  console.log("");
  console.log(
    "------------------------------------------------"
  );

  console.log(
    `🌐 المصدر: ${source.name}`
  );

  console.log(
    `🔗 ${source.base_url}`
  );

  console.log(
    "------------------------------------------------"
  );

  const stats = {
    discovered: 0,
    inserted: 0,
    skipped: 0,
    failed: 0
  };

  let runId = null;

  try {
    runId =
      await createImportRun(
        source.id
      );

    const html =
      await fetchPage(
        source.base_url
      );

    const links =
      extractLinks(
        html,
        source.base_url
      );

    stats.discovered =
      links.length;

    console.log(
      `🔎 الروابط المكتشفة: ${links.length}`
    );

    const prepared =
      links
        .map((item) =>
          makeResource(
            item,
            source
          )
        )
        .filter(Boolean);

    const unique =
      deduplicate(
        prepared
      );

    stats.skipped =
      Math.max(
        0,
        prepared.length -
          unique.length
      );

    console.log(
      `🧹 بعد إزالة التكرار: ${unique.length}`
    );

    if (!unique.length) {
      await finishImportRun(
        runId,
        stats
      );

      return stats;
    }

    const urls =
      unique.map(
        (resource) =>
          resource.resource_url
      );

    const existing =
      await getExistingUrls(
        urls
      );

    const newResources =
      unique.filter(
        (resource) =>
          !existing.has(
            normalizeUrl(
              resource.resource_url
            )
          )
      );

    stats.skipped +=
      unique.length -
      newResources.length;

    console.log(
      `🆕 موارد جديدة: ${newResources.length}`
    );

    if (
      !newResources.length
    ) {
      await updateSourceStats(
        source.id,
        stats.discovered,
        0
      );

      await finishImportRun(
        runId,
        stats
      );

      return stats;
    }

    const result =
      await insertInBatches(
        newResources
      );

    stats.inserted =
      result.inserted;

    stats.failed =
      result.failed;

    await updateSourceStats(
      source.id,
      stats.discovered,
      stats.inserted
    );

    await finishImportRun(
      runId,
      stats
    );

    return stats;
  } catch (error) {
    console.error(
      `❌ خطأ في المصدر ${source.name}:`,
      error.message
    );

    stats.failed =
      Math.max(
        stats.failed,
        1
      );

    if (runId) {
      await finishImportRun(
        runId,
        stats,
        "failed",
        error.message
      );
    }

    return stats;
  }
}

/* ======================================================
   البرنامج الرئيسي
====================================================== */

async function main() {
  console.log("");
  console.log(
    "================================================"
  );
  console.log(
    " HAMOU MATH GLOBAL"
  );
  console.log(
    " Dynamic Resource Indexer"
  );
  console.log(
    "================================================"
  );
  console.log("");

  const sources =
    await getSources();

  if (!sources.length) {
    console.log(
      "⚠️ لا توجد مصادر نشطة في resource_sources."
    );

    return;
  }

  console.log(
    `📚 عدد المصادر النشطة: ${sources.length}`
  );

  console.log("");

  const total = {
    sources: 0,
    discovered: 0,
    inserted: 0,
    skipped: 0,
    failed: 0
  };

  for (
    const source of sources
  ) {
    total.sources++;

    const stats =
      await indexSource(
        source
      );

    total.discovered +=
      stats.discovered;

    total.inserted +=
      stats.inserted;

    total.skipped +=
      stats.skipped;

    total.failed +=
      stats.failed;
  }

  console.log("");
  console.log(
    "================================================"
  );

  console.log(
    "📊 النتيجة النهائية"
  );

  console.log(
    "================================================"
  );

  console.log(
    `🌐 المصادر: ${total.sources}`
  );

  console.log(
    `🔎 المكتشف: ${total.discovered}`
  );

  console.log(
    `✅ المضاف: ${total.inserted}`
  );

  console.log(
    `⏭️ المتجاوز/المكرر: ${total.skipped}`
  );

  console.log(
    `❌ الفاشل: ${total.failed}`
  );

  console.log("");
  console.log(
    "🏁 انتهت عملية الفهرسة."
  );
}

main().catch(
  (error) => {
    console.error("");
    console.error(
      "❌ FATAL ERROR:"
    );
    console.error(
      error
    );

    process.exit(1);
  }
);
