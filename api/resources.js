// HAMOU MATH GLOBAL V18.2
// API: /api/resources
// البحث + التصفية + pagination
// يعمل حاليًا مع Google Drive metadata إذا تم توفيرها
// ويحتوي على fallback آمن حتى لا تتعطل المكتبة.

const LOCAL_RESOURCES = [
  {
    id: "hm-001",
    title: "HAMOU MATH — مكتبة الرياضيات العربية",
    description: "موارد تعليمية في الرياضيات باللغة العربية.",
    language: "ar",
    type: "library",
    level: "secondary",
    author: "HAMOU MATH",
    url: "/",
    source: "HAMOU MATH"
  },
  {
    id: "hm-002",
    title: "HAMOU MATH — Mathématiques en français",
    description: "Ressources de mathématiques en français.",
    language: "fr",
    type: "library",
    level: "secondary",
    author: "HAMOU MATH",
    url: "/",
    source: "HAMOU MATH"
  },
  {
    id: "hm-003",
    title: "HAMOU MATH — Mathematics Resources",
    description: "Mathematics resources in English.",
    language: "en",
    type: "library",
    level: "advanced",
    author: "HAMOU MATH",
    url: "/",
    source: "HAMOU MATH"
  }
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=300"
    }
  });
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function matches(resource, query, language, type, level) {
  const q = normalize(query);

  const text = normalize([
    resource.title,
    resource.description,
    resource.author,
    resource.category,
    resource.keywords,
    resource.source
  ].join(" "));

  if (q && !text.includes(q)) {
    return false;
  }

  if (language && language !== "all") {
    if (normalize(resource.language) !== normalize(language)) {
      return false;
    }
  }

  if (type && type !== "all") {
    if (normalize(resource.type) !== normalize(type)) {
      return false;
    }
  }

  if (level && level !== "all") {
    if (normalize(resource.level) !== normalize(level)) {
      return false;
    }
  }

  return true;
}

function mapDriveFile(file) {
  const appProperties = file.appProperties || {};

  return {
    id: file.id,
    title: file.name || "بدون عنوان",
    description:
      appProperties.description ||
      file.description ||
      "مورد رياضي من مكتبة HAMOU MATH.",
    language: appProperties.language || "ar",
    type: appProperties.type || detectType(file),
    level: appProperties.level || "all",
    category: appProperties.category || "Mathematics",
    author: appProperties.author || "غير محدد",
    year: appProperties.year || "",
    keywords: appProperties.keywords || "",
    mimeType: file.mimeType || "",
    modifiedTime: file.modifiedTime || "",
    createdTime: file.createdTime || "",
    url:
      file.webViewLink ||
      (file.id
        ? `https://drive.google.com/open?id=${encodeURIComponent(file.id)}`
        : "#"),
    source: "Google Drive"
  };
}

function detectType(file) {
  const name = normalize(file.name);
  const mime = normalize(file.mimeType);

  if (name.includes("exam") || name.includes("اختبار") || name.includes("امتحان")) {
    return "exam";
  }

  if (name.includes("exercise") || name.includes("تمرين") || name.includes("exercice")) {
    return "exercise";
  }

  if (name.includes("summary") || name.includes("ملخص") || name.includes("resume")) {
    return "summary";
  }

  if (
    name.includes("lesson") ||
    name.includes("درس") ||
    name.includes("cours")
  ) {
    return "lesson";
  }

  if (mime.includes("pdf")) {
    return "book";
  }

  return "reference";
}

async function loadDriveResources() {
  /*
   * هذا الجزء سيُربط لاحقًا بقاعدة الفهرسة/Google Drive.
   *
   * لا نضع GOOGLE_CLIENT_SECRET أو Refresh Token هنا.
   * الأسرار يجب أن تبقى في Vercel Environment Variables.
   */

  return [];
}

export async function GET(request) {
  try {
    const url = new URL(request.url);

    const query =
      url.searchParams.get("q") ||
      url.searchParams.get("search") ||
      "";

    const language =
      url.searchParams.get("language") ||
      url.searchParams.get("lang") ||
      "";

    const type = url.searchParams.get("type") || "";

    const level = url.searchParams.get("level") || "";

    let page = Number(url.searchParams.get("page") || 1);
    let pageSize = Number(url.searchParams.get("pageSize") || 12);

    if (!Number.isFinite(page) || page < 1) {
      page = 1;
    }

    if (!Number.isFinite(pageSize) || pageSize < 1) {
      pageSize = 12;
    }

    page = Math.floor(page);
    pageSize = Math.min(Math.floor(pageSize), 100);

    let resources = [];

    // محاولة تحميل موارد Drive المفهرسة
    try {
      const driveResources = await loadDriveResources();

      if (Array.isArray(driveResources)) {
        resources = driveResources;
      }
    } catch (error) {
      console.error("Drive resources unavailable:", error);
    }

    // fallback
    if (!resources.length) {
      resources = LOCAL_RESOURCES;
    }

    const filtered = resources.filter(resource =>
      matches(resource, query, language, type, level)
    );

    // ترتيب:
    // 1. العنوان
    // 2. الأحدث
    filtered.sort((a, b) => {
      const titleA = normalize(a.title);
      const titleB = normalize(b.title);

      return titleA.localeCompare(titleB);
    });

    const total = filtered.length;

    const totalPages =
      total === 0 ? 0 : Math.ceil(total / pageSize);

    const safePage =
      totalPages === 0
        ? 1
        : Math.min(page, totalPages);

    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;

    const items = filtered.slice(start, end);

    return json({
      success: true,

      data: items,

      resources: items,

      total,

      page: safePage,

      pageSize,

      totalPages,

      hasNextPage:
        totalPages > 0 && safePage < totalPages,

      hasPreviousPage:
        safePage > 1,

      filters: {
        q: query,
        language,
        type,
        level
      },

      source:
        resources === LOCAL_RESOURCES
          ? "local-fallback"
          : "google-drive"
    });
  } catch (error) {
    console.error("resources API error:", error);

    return json(
      {
        success: false,
        error: "حدث خطأ أثناء تحميل مكتبة HAMOU MATH.",
        data: [],
        resources: [],
        total: 0,
        page: 1,
        pageSize: 12,
        totalPages: 0
      },
      500
    );
  }
}

export default {
  async fetch(request) {
    return GET(request);
  }
};
