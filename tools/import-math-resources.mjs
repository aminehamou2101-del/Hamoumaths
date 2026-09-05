import { createClient } from "@supabase/supabase-js";

/*
========================================================
 HAMOU MATH GLOBAL
 Massive Math Resource Importer
 Node 24 + ES Modules + Supabase
========================================================

الوظائف:
- استيراد موارد حقيقية من مصادر موثوقة
- إزالة التكرار حسب URL
- تصنيف تلقائي
- اكتشاف اللغة
- اكتشاف المستوى
- اكتشاف المجال
- الإدخال على دفعات
- عدم حذف الموارد الموجودة
- قابل للتوسع إلى مئات الآلاف والملايين

تشغيل:
SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node tools/import-math-resources.mjs
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

const SOURCES = [
  {
    name: "OpenStax",
    url: "https://openstax.org/subjects/math"
  },
  {
    name: "MIT OpenCourseWare",
    url: "https://ocw.mit.edu/search/?d=Mathematics"
  },
  {
    name: "LibreTexts Mathematics",
    url: "https://math.libretexts.org/"
  }
];

/* ======================================================
   أدوات مساعدة
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

function detectLanguage(text) {
  const value = normalize(text);

  const arabic =
    /[\u0600-\u06ff]/.test(text);

  if (arabic) return "ar";

  const frenchWords = [
    "mathematiques",
    "cours",
    "exercices",
    "algebre",
    "geometrie",
    "probabilites",
    "statistiques",
    "analyse"
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

function detectLevel(text) {
  const value = normalize(text);

  if (
    value.includes("phd") ||
    value.includes("doctoral") ||
    value.includes("doctorate")
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
    value.includes("bac")
  ) {
    return "baccalaureate";
  }

  if (
    value.includes("secondary") ||
    value.includes("high school")
  ) {
    return "secondary";
  }

  if (
    value.includes("middle school") ||
    value.includes("junior high")
  ) {
    return "middle";
  }

  if (
    value.includes("elementary") ||
    value.includes("primary")
  ) {
    return "primary";
  }

  return "university";
}

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
        "calcule",
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

function detectType(text) {
  const value = normalize(text);

  if (
    value.includes("exercise") ||
    value.includes("exercises") ||
    value.includes("problem set") ||
    value.includes("problems")
  ) {
    return "تمرين";
  }

  if (
    value.includes("exam") ||
    value.includes("examination") ||
    value.includes("test")
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
    value.includes("review")
  ) {
    return "ملخص";
  }

  if (
    value.includes("book") ||
    value.includes("textbook")
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
   إزالة التكرار
====================================================== */

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);

    parsed.hash = "";

    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content"
    ].forEach((key) => {
      parsed.searchParams.delete(key);
    });

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

/* ======================================================
   تحويل المورد إلى شكل قاعدة البيانات
====================================================== */

function makeResource({
  title,
  description,
  url,
  source
}) {
  const cleanUrl = normalizeUrl(url);

  if (!cleanUrl) return null;

  const fullText = [
    title,
    description,
    source,
    cleanUrl
  ].join(" ");

  const language =
    detectLanguage(fullText);

  const level =
    detectLevel(fullText);

  const field =
    detectField(fullText);

  const resourceType =
    detectType(fullText);

  return {
    title: clean(title, 500),

    title_ar:
      language === "ar"
        ? clean(title, 500)
        : null,

    title_fr:
      language === "fr"
        ? clean(title, 500)
        : null,

    title_en:
      language === "en"
        ? clean(title, 500)
        : null,

    description:
      clean(description, 2000),

    resource_type:
      resourceType,

    level,

    subject: "mathematics",

    field,

    language,

    author: null,

    publisher: source,

    source_name: source,

    source_url: cleanUrl,

    resource_url: cleanUrl,

    thumbnail_url: null,

    license: null,

    license_url: null,

    year: null,

    keywords: [
      "mathematics",
      field,
      level,
      language
    ],

    is_free: true,

    is_featured: false,

    is_verified: false,

    is_active: true,

    views: 0
  };
}

/* ======================================================
   جلب HTML
====================================================== */

async function fetchPage(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "HAMOU-MATH-RESOURCE-INDEXER/1.0"
      },
      signal:
        AbortSignal.timeout(20000)
    });

    if (!response.ok) {
      console.warn(
        `⚠️ ${response.status}: ${url}`
      );

      return "";
    }

    return await response.text();
  } catch (error) {
    console.warn(
      `⚠️ تعذر جلب ${url}:`,
      error.message
    );

    return "";
  }
}

/* ======================================================
   استخراج الروابط
====================================================== */

function extractLinks(html, baseUrl) {
  const results = [];

  if (!html) return results;

  const regex =
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;

  while (
    (match = regex.exec(html))
  ) {
    const href = match[1];
    const rawTitle = match[2];

    const title = clean(
      rawTitle.replace(/<[^>]+>/g, " ")
    );

    if (!title || title.length < 3) {
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
        url,
        source: new URL(baseUrl).hostname
      });
    } catch {
      // تجاهل الرابط غير الصحيح
    }
  }

  return results;
}

/* ======================================================
   فحص المصادر
====================================================== */

async function discoverResources() {
  const discovered = [];

  for (const source of SOURCES) {
    console.log(
      `🔎 فحص: ${source.name}`
    );

    const html =
      await fetchPage(source.url);

    const links =
      extractLinks(
        html,
        source.url
      );

    for (const item of links) {
      discovered.push({
        ...item,
        source: source.name
      });
    }

    console.log(
      `   → ${links.length} رابط`
    );
  }

  return discovered;
}

/* ======================================================
   إزالة التكرار محليًا
====================================================== */

function deduplicate(resources) {
  const map = new Map();

  for (const resource of resources) {
    const url =
      normalizeUrl(
        resource.resource_url
      );

    if (!url) continue;

    if (!map.has(url)) {
      map.set(
        url,
        resource
      );
    }
  }

  return [...map.values()];
}

/* ======================================================
   معرفة الروابط الموجودة
====================================================== */

async function getExistingUrls(urls) {
  const existing =
    new Set();

  const chunks = [];

  for (
    let i = 0;
    i < urls.length;
    i += 100
  ) {
    chunks.push(
      urls.slice(
        i,
        i + 100
      )
    );
  }

  for (const chunk of chunks) {
    const { data, error } =
      await supabase
        .from("resources")
        .select("resource_url")
        .in(
          "resource_url",
          chunk
        );

    if (error) {
      throw error;
    }

    for (const row of data || []) {
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
   الإدخال على دفعات
====================================================== */

async function insertInBatches(resources) {
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
    } =
      await supabase
        .from("resources")
        .insert(batch);

    if (error) {
      console.error(
        "❌ خطأ في الدفعة:",
        error.message
      );

      failed += batch.length;
      continue;
    }

    inserted += batch.length;

    console.log(
      `✅ ${inserted}/${resources.length}`
    );
  }

  return {
    inserted,
    failed
  };
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
    " HAMOU MATH GLOBAL RESOURCE INDEXER"
  );
  console.log(
    "================================================"
  );
  console.log("");

  console.log(
    "📚 بدء اكتشاف الموارد..."
  );

  const discovered =
    await discoverResources();

  console.log(
    `📦 تم اكتشاف ${discovered.length} رابط`
  );

  const prepared =
    discovered
      .map((item) =>
        makeResource(item)
      )
      .filter(Boolean);

  const unique =
    deduplicate(prepared);

  console.log(
    `🧹 بعد إزالة التكرار: ${unique.length}`
  );

  if (!unique.length) {
    console.log(
      "ℹ️ لا توجد موارد جديدة."
    );

    return;
  }

  const urls =
    unique.map(
      (resource) =>
        resource.resource_url
    );

  console.log(
    "🔍 فحص الموارد الموجودة..."
  );

  const existing =
    await getExistingUrls(urls);

  const newResources =
    unique.filter(
      (resource) =>
        !existing.has(
          normalizeUrl(
            resource.resource_url
          )
        )
    );

  console.log(
    `🆕 موارد جديدة: ${newResources.length}`
  );

  if (!newResources.length) {
    console.log(
      "✅ لا توجد موارد جديدة للإضافة."
    );

    return;
  }

  console.log(
    "🚀 بدء الإدخال إلى Supabase..."
  );

  const result =
    await insertInBatches(
      newResources
    );

  console.log("");
  console.log(
    "================================================"
  );
  console.log(
    " النتيجة"
  );
  console.log(
    "================================================"
  );

  console.log(
    `✅ تمت إضافة: ${result.inserted}`
  );

  console.log(
    `❌ فشل: ${result.failed}`
  );

  console.log("");
}

main().catch((error) => {
  console.error("");
  console.error(
    "❌ IMPORTER ERROR:"
  );
  console.error(
    error
  );

  process.exit(1);
});
