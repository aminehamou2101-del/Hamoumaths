// ============================================================
// HAMOU MATH GLOBAL V18.2
// api/sync-library.js
// Google Drive Library Synchronization Engine
// ============================================================

import { google } from "googleapis";

// ------------------------------------------------------------
// Configuration
// ------------------------------------------------------------

const ROOT_FOLDER_ID = process.env.DRIVE_ROOT_FOLDER_ID;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

// ------------------------------------------------------------
// Constants
// ------------------------------------------------------------

const FOLDER_MIME =
  "application/vnd.google-apps.folder";

const IGNORED_NAMES = new Set([
  ".DS_Store",
  "Thumbs.db",
  "desktop.ini"
]);

const SUPPORTED_FILE_TYPES = new Set([
  "application/pdf",

  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  "text/plain",
  "text/csv",

  "application/epub+zip",

  "application/vnd.google-apps.document",
  "application/vnd.google-apps.spreadsheet",
  "application/vnd.google-apps.presentation"
]);

// ------------------------------------------------------------
// JSON helper
// ------------------------------------------------------------

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    }
  );
}

// ------------------------------------------------------------
// Google authentication
// ------------------------------------------------------------

function createDriveClient() {

  if (!CLIENT_ID) {
    throw new Error(
      "GOOGLE_CLIENT_ID غير موجود في Environment Variables."
    );
  }

  if (!CLIENT_SECRET) {
    throw new Error(
      "GOOGLE_CLIENT_SECRET غير موجود في Environment Variables."
    );
  }

  if (!REFRESH_TOKEN) {
    throw new Error(
      "GOOGLE_REFRESH_TOKEN غير موجود في Environment Variables."
    );
  }

  if (!ROOT_FOLDER_ID) {
    throw new Error(
      "DRIVE_ROOT_FOLDER_ID غير موجود في Environment Variables."
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || ""
  );

  oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN
  });

  return google.drive({
    version: "v3",
    auth: oauth2Client
  });
}

// ------------------------------------------------------------
// Normalize text
// ------------------------------------------------------------

function normalize(text) {

  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// ------------------------------------------------------------
// Detect language
// ------------------------------------------------------------

function detectLanguage(path) {

  const value = normalize(path);

  if (
    value.includes("arab") ||
    value.includes("العربية") ||
    value.includes("عربي") ||
    value.includes("arabic")
  ) {
    return "ar";
  }

  if (
    value.includes("francais") ||
    value.includes("français") ||
    value.includes("french") ||
    value.includes("fr")
  ) {
    return "fr";
  }

  if (
    value.includes("english") ||
    value.includes("anglais") ||
    value.includes("en")
  ) {
    return "en";
  }

  return "other";
}

// ------------------------------------------------------------
// Detect educational level
// ------------------------------------------------------------

function detectLevel(path) {

  const value = normalize(path);

  if (
    value.includes("primaire") ||
    value.includes("primary") ||
    value.includes("ابتدائي") ||
    value.includes("الابتدائي")
  ) {
    return "primary";
  }

  if (
    value.includes("college") ||
    value.includes("middle") ||
    value.includes("middle school") ||
    value.includes("متوسط") ||
    value.includes("المتوسط")
  ) {
    return "middle";
  }

  if (
    value.includes("lycee") ||
    value.includes("lycée") ||
    value.includes("high school") ||
    value.includes("secondary") ||
    value.includes("ثانوي") ||
    value.includes("الثانوي")
  ) {
    return "secondary";
  }

  if (
    value.includes("bac") ||
    value.includes("baccalaureat") ||
    value.includes("baccalauréat") ||
    value.includes("بكالوريا") ||
    value.includes("البكالوريا")
  ) {
    return "bac";
  }

  if (
    value.includes("universite") ||
    value.includes("université") ||
    value.includes("university") ||
    value.includes("universitaire") ||
    value.includes("جامعة") ||
    value.includes("جامعي")
  ) {
    return "university";
  }

  if (
    value.includes("advanced") ||
    value.includes("advanced mathematics") ||
    value.includes("متقدم") ||
    value.includes("متقدمة")
  ) {
    return "advanced";
  }

  return "all";
}

// ------------------------------------------------------------
// Detect resource type
// ------------------------------------------------------------

function detectType(fileName, path) {

  const value =
    normalize(`${fileName} ${path}`);

  if (
    value.includes("book") ||
    value.includes("livre") ||
    value.includes("manuel") ||
    value.includes("كتاب") ||
    value.includes("كتب")
  ) {
    return "book";
  }

  if (
    value.includes("lesson") ||
    value.includes("course") ||
    value.includes("cours") ||
    value.includes("درس") ||
    value.includes("دروس")
  ) {
    return "lesson";
  }

  if (
    value.includes("exercise") ||
    value.includes("exercises") ||
    value.includes("exercice") ||
    value.includes("exercices") ||
    value.includes("تمرين") ||
    value.includes("تمارين")
  ) {
    return "exercise";
  }

  if (
    value.includes("exam") ||
    value.includes("exams") ||
    value.includes("examen") ||
    value.includes("examens") ||
    value.includes("اختبار") ||
    value.includes("امتحان") ||
    value.includes("امتحانات")
  ) {
    return "exam";
  }

  if (
    value.includes("summary") ||
    value.includes("summaries") ||
    value.includes("resume") ||
    value.includes("résumé") ||
    value.includes("ملخص") ||
    value.includes("ملخصات")
  ) {
    return "summary";
  }

  if (
    value.includes("olympiad") ||
    value.includes("olympiade") ||
    value.includes("olympiades") ||
    value.includes("اولمبياد") ||
    value.includes("أولمبياد")
  ) {
    return "olympiad";
  }

  if (
    value.includes("reference") ||
    value.includes("references") ||
    value.includes("مرجع") ||
    value.includes("مراجع")
  ) {
    return "reference";
  }

  if (
    value.includes("teacher") ||
    value.includes("teachers") ||
    value.includes("enseignant") ||
    value.includes("professeur") ||
    value.includes("استاذ") ||
    value.includes("أستاذ") ||
    value.includes("مذكرات")
  ) {
    return "teacher";
  }

  return "resource";
}

// ------------------------------------------------------------
// Get all files in one folder
// ------------------------------------------------------------

async function listFolderFiles(
  drive,
  folderId
) {

  const files = [];

  let pageToken = null;

  do {

    const response =
      await drive.files.list({

        q:
          `'${folderId}' in parents and trashed = false`,

        spaces: "drive",

        pageSize: 1000,

        pageToken,

        orderBy:
          "folder,name_natural",

        fields:
          [
            "nextPageToken",
            "files(",
            "id,",
            "name,",
            "mimeType,",
            "description,",
            "webViewLink,",
            "createdTime,",
            "modifiedTime,",
            "size,",
            "parents,",
            "webContentLink,",
            "starred,",
            "owners(displayName,emailAddress),",
            "appProperties",
            ")"
          ].join(""),

        supportsAllDrives: true,

        includeItemsFromAllDrives: true
      });

    const current =
      response.data.files || [];

    files.push(...current);

    pageToken =
      response.data.nextPageToken || null;

  } while (pageToken);

  return files;
}

// ------------------------------------------------------------
// Recursive Drive scanner
// ------------------------------------------------------------

async function scanFolder(
  drive,
  folderId,
  currentPath = "",
  visited = new Set(),
  results = []
) {

  // حماية من الحلقات غير المتوقعة
  if (visited.has(folderId)) {
    return results;
  }

  visited.add(folderId);

  const files =
    await listFolderFiles(
      drive,
      folderId
    );

  for (const file of files) {

    if (!file?.id) {
      continue;
    }

    const name =
      file.name || "بدون عنوان";

    if (IGNORED_NAMES.has(name)) {
      continue;
    }

    const path =
      currentPath
        ? `${currentPath}/${name}`
        : name;

    // --------------------------------------------------------
    // Folder
    // --------------------------------------------------------

    if (file.mimeType === FOLDER_MIME) {

      await scanFolder(
        drive,
        file.id,
        path,
        visited,
        results
      );

      continue;
    }

    // --------------------------------------------------------
    // Unsupported file
    // --------------------------------------------------------

    if (
      file.mimeType &&
      !SUPPORTED_FILE_TYPES.has(file.mimeType)
    ) {

      // لا نحذف الملف بالضرورة.
      // لكن لا ندخله إلى المكتبة التعليمية.
      continue;
    }

    // --------------------------------------------------------
    // Metadata
    // --------------------------------------------------------

    const language =
      file.appProperties?.language ||
      detectLanguage(path);

    const level =
      file.appProperties?.level ||
      detectLevel(path);

    const type =
      file.appProperties?.type ||
      detectType(name, path);

    const category =
      file.appProperties?.category ||
      detectCategory(path);

    const author =
      file.appProperties?.author ||
      file.owners?.[0]?.displayName ||
      "غير محدد";

    const description =
      file.appProperties?.description ||
      file.description ||
      `مورد رياضي من مكتبة HAMOU MATH — ${category}`;

    const keywords =
      file.appProperties?.keywords ||
      buildKeywords(
        name,
        path,
        category,
        language,
        level,
        type
      );

    // --------------------------------------------------------
    // Resource object
    // --------------------------------------------------------

    results.push({

      id: file.id,

      title: name,

      description,

      language,

      level,

      type,

      category,

      author,

      keywords,

      year:
        file.appProperties?.year || "",

      mimeType:
        file.mimeType || "",

      size:
        file.size
          ? Number(file.size)
          : null,

      path,

      createdTime:
        file.createdTime || "",

      modifiedTime:
        file.modifiedTime || "",

      starred:
        Boolean(file.starred),

      url:
        file.webViewLink ||
        `https://drive.google.com/open?id=${encodeURIComponent(file.id)}`,

      downloadUrl:
        file.webContentLink || "",

      source: "Google Drive"
    });
  }

  return results;
}

// ------------------------------------------------------------
// Detect category
// ------------------------------------------------------------

function detectCategory(path) {

  const value =
    normalize(path);

  const categories = [

    ["algebra", [
      "algebra",
      "جبر",
      "algebre"
    ]],

    ["geometry", [
      "geometry",
      "géométrie",
      "geometrie",
      "هندسة"
    ]],

    ["analysis", [
      "analysis",
      "analyse",
      "تحليل"
    ]],

    ["probability", [
      "probability",
      "probabilite",
      "probabilité",
      "احتمالات"
    ]],

    ["statistics", [
      "statistics",
      "statistique",
      "statistiques",
      "إحصاء"
    ]],

    ["calculus", [
      "calculus",
      "تفاضل",
      "تكامل"
    ]],

    ["number-theory", [
      "number theory",
      "theorie des nombres",
      "نظرية الاعداد",
      "نظرية الأعداد"
    ]],

    ["linear-algebra", [
      "linear algebra",
      "algebre lineaire",
      "الجبر الخطي"
    ]],

    ["discrete-math", [
      "discrete mathematics",
      "mathématiques discrètes",
      "رياضيات متقطعة"
    ]],

    ["logic", [
      "logic",
      "logique",
      "منطق"
    ]],

    ["olympiad", [
      "olympiad",
      "olympiade",
      "اولمبياد",
      "أولمبياد"
    ]]

  ];

  for (const [
    category,
    keywords
  ] of categories) {

    for (const keyword of keywords) {

      if (
        value.includes(
          normalize(keyword)
        )
      ) {
        return category;
      }
    }
  }

  return "mathematics";
}

// ------------------------------------------------------------
// Build search keywords
// ------------------------------------------------------------

function buildKeywords(
  name,
  path,
  category,
  language,
  level,
  type
) {

  return [
    name,
    path,
    category,
    language,
    level,
    type
  ]
    .filter(Boolean)
    .join(" ");
}

// ------------------------------------------------------------
// Remove duplicate resources
// ------------------------------------------------------------

function removeDuplicates(resources) {

  const map =
    new Map();

  for (const resource of resources) {

    if (!resource?.id) {
      continue;
    }

    map.set(
      resource.id,
      resource
    );
  }

  return Array.from(
    map.values()
  );
}

// ------------------------------------------------------------
// Sort resources
// ------------------------------------------------------------

function sortResources(resources) {

  return resources.sort(
    (a, b) => {

      const dateA =
        new Date(
          a.modifiedTime || 0
        ).getTime();

      const dateB =
        new Date(
          b.modifiedTime || 0
        ).getTime();

      if (dateB !== dateA) {
        return dateB - dateA;
      }

      return String(a.title)
        .localeCompare(
          String(b.title),
          "ar",
          {
            numeric: true,
            sensitivity: "base"
          }
        );
    }
  );
}

// ------------------------------------------------------------
// Main synchronization
// ------------------------------------------------------------

async function synchronizeLibrary() {

  const startedAt =
    Date.now();

  const drive =
    createDriveClient();

  const resources =
    await scanFolder(
      drive,
      ROOT_FOLDER_ID,
      "",
      new Set(),
      []
    );

  const unique =
    removeDuplicates(
      resources
    );

  sortResources(unique);

  const duration =
    Date.now() - startedAt;

  return {

    resources: unique,

    count: unique.length,

    duration,

    syncedAt:
      new Date().toISOString()
  };
}

// ------------------------------------------------------------
// GET
// ------------------------------------------------------------

export async function GET() {

  try {

    return json({
      success: true,
      message:
        "واجهة مزامنة مكتبة HAMOU MATH جاهزة.",
      configured:
        Boolean(
          ROOT_FOLDER_ID &&
          CLIENT_ID &&
          CLIENT_SECRET &&
          REFRESH_TOKEN
        )
    });

  } catch (error) {

    console.error(
      "GET sync error:",
      error
    );

    return json(
      {
        success: false,
        error:
          "تعذر فحص إعدادات المزامنة."
      },
      500
    );
  }
}

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

export async function POST() {

  try {

    const result =
      await synchronizeLibrary();

    /*
     * في هذه المرحلة نعيد البيانات إلى العميل.
     *
     * الخطوة التالية في V18.2 ستكون حفظ metadata
     * داخل قاعدة بيانات مثل Supabase/Postgres حتى
     * لا نضطر لفحص Google Drive عند كل طلب.
     */

    return json({

      success: true,

      synced: true,

      message:
        "تمت مزامنة مكتبة HAMOU MATH مع Google Drive بنجاح.",

      count:
        result.count,

      duration:
        result.duration,

      syncedAt:
        result.syncedAt,

      resources:
        result.resources

    });

  } catch (error) {

    console.error(
      "HAMOU MATH sync error:",
      error
    );

    return json(

      {
        success: false,

        synced: false,

        message:
          "فشلت مزامنة Google Drive.",

        error:
          error?.message ||
          "Unknown synchronization error."

      },

      500
    );
  }
}

// ------------------------------------------------------------
// Vercel compatibility
// ------------------------------------------------------------

export default {
  async fetch(request) {

    if (
      request.method === "POST"
    ) {
      return POST(request);
    }

    return GET(request);
  }
};
