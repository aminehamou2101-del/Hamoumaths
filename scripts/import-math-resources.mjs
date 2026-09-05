// ============================================================
// HAMOU MATH GLOBAL
// scripts/import-math-resources.mjs
// Google Drive → Supabase Resource Importer
// ============================================================

import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

// ------------------------------------------------------------
// Environment
// ------------------------------------------------------------

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,

  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  DRIVE_ROOT_FOLDER_ID,
  GOOGLE_REDIRECT_URI
} = process.env;

// ------------------------------------------------------------
// Validation
// ------------------------------------------------------------

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`${name} غير موجود في Environment Variables.`);
  }
}

requireEnv("SUPABASE_URL", SUPABASE_URL);
requireEnv(
  "SUPABASE_SERVICE_ROLE_KEY",
  SUPABASE_SERVICE_ROLE_KEY
);

requireEnv("GOOGLE_CLIENT_ID", GOOGLE_CLIENT_ID);
requireEnv("GOOGLE_CLIENT_SECRET", GOOGLE_CLIENT_SECRET);
requireEnv("GOOGLE_REFRESH_TOKEN", GOOGLE_REFRESH_TOKEN);
requireEnv("DRIVE_ROOT_FOLDER_ID", DRIVE_ROOT_FOLDER_ID);

// ------------------------------------------------------------
// Supabase
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// Google Drive
// ------------------------------------------------------------

function createDriveClient() {
  const auth = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI || ""
  );

  auth.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN
  });

  return google.drive({
    version: "v3",
    auth
  });
}

// ------------------------------------------------------------
// Constants
// ------------------------------------------------------------

const FOLDER_MIME =
  "application/vnd.google-apps.folder";

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

const IGNORED_NAMES = new Set([
  ".DS_Store",
  "Thumbs.db",
  "desktop.ini"
]);

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

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
    value.includes("french")
  ) {
    return "fr";
  }

  if (
    value.includes("english") ||
    value.includes("anglais")
  ) {
    return "en";
  }

  return "other";
}

function detectLevel(path) {
  const value = normalize(path);

  if (
    value.includes("primaire") ||
    value.includes("primary") ||
    value.includes("ابتدائي")
  ) {
    return "primary";
  }

  if (
    value.includes("college") ||
    value.includes("middle") ||
    value.includes("متوسط")
  ) {
    return "middle";
  }

  if (
    value.includes("lycee") ||
    value.includes("lycée") ||
    value.includes("high school") ||
    value.includes("secondary") ||
    value.includes("ثانوي")
  ) {
    return "secondary";
  }

  if (
    value.includes("bac") ||
    value.includes("baccalaureat") ||
    value.includes("بكالوريا")
  ) {
    return "bac";
  }

  if (
    value.includes("universite") ||
    value.includes("université") ||
    value.includes("university") ||
    value.includes("جامعة")
  ) {
    return "university";
  }

  if (
    value.includes("advanced") ||
    value.includes("متقدم") ||
    value.includes("متقدمة")
  ) {
    return "advanced";
  }

  return "all";
}

function detectType(name, path) {
  const value = normalize(`${name} ${path}`);

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
    value.includes("exercice") ||
    value.includes("تمرين") ||
    value.includes("تمارين")
  ) {
    return "exercise";
  }

  if (
    value.includes("exam") ||
    value.includes("examen") ||
    value.includes("اختبار") ||
    value.includes("امتحان") ||
    value.includes("امتحانات")
  ) {
    return "exam";
  }

  if (
    value.includes("summary") ||
    value.includes("resume") ||
    value.includes("résumé") ||
    value.includes("ملخص")
  ) {
    return "summary";
  }

  if (
    value.includes("olympiad") ||
    value.includes("olympiade") ||
    value.includes("اولمبياد") ||
    value.includes("أولمبياد")
  ) {
    return "olympiad";
  }

  if (
    value.includes("reference") ||
    value.includes("مرجع") ||
    value.includes("مراجع")
  ) {
    return "reference";
  }

  if (
    value.includes("teacher") ||
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

function detectSubject(path) {
  const value = normalize(path);

  const subjects = [
    ["algebra", ["algebra", "algèbre", "جبر"]],
    ["geometry", ["geometry", "géométrie", "هندسة"]],
    ["analysis", ["analysis", "analyse", "تحليل"]],
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

  for (const [subject, keywords] of subjects) {
    for (const keyword of keywords) {
      if (value.includes(normalize(keyword))) {
        return subject;
      }
    }
  }

  return "mathematics";
}

// ------------------------------------------------------------
// List folder
// ------------------------------------------------------------

async function listFolderFiles(drive, folderId) {
  const files = [];
  let pageToken = null;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      spaces: "drive",
      pageSize: 1000,
      pageToken,
      orderBy: "folder,name_natural",

      fields: [
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
        "starred,",
        "owners(displayName,emailAddress),",
        "appProperties",
        ")"
      ].join(""),

      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });

    files.push(...(response.data.files || []));

    pageToken =
      response.data.nextPageToken || null;

  } while (pageToken);

  return files;
}

// ------------------------------------------------------------
// Scan Drive recursively
// ------------------------------------------------------------

async function scanFolder(
  drive,
  folderId,
  currentPath = "",
  visited = new Set(),
  results = []
) {
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
    if (!file?.id) continue;

    const name =
      file.name || "بدون عنوان";

    if (IGNORED_NAMES.has(name)) {
      continue;
    }

    const path =
      currentPath
        ? `${currentPath}/${name}`
        : name;

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

    if (
      file.mimeType &&
      !SUPPORTED_FILE_TYPES.has(file.mimeType)
    ) {
      continue;
    }

    const language =
      file.appProperties?.language ||
      detectLanguage(path);

    const level =
      file.appProperties?.level ||
      detectLevel(path);

    const resourceType =
      file.appProperties?.type ||
      detectType(name, path);

    const subject =
      file.appProperties?.subject ||
      detectSubject(path);

    const author =
      file.appProperties?.author ||
      file.owners?.[0]?.displayName ||
      "غير محدد";

    const description =
      file.appProperties?.description ||
      file.description ||
      `مورد رياضي من Google Drive — ${subject}`;

    const keywords = [
      name,
      path,
      subject,
      language,
      level,
      resourceType
    ]
      .filter(Boolean)
      .join(" ");

    results.push({
      external_id: file.id,
      title: name,
      description,
      resource_type: resourceType,
      language,
      level,
      subject,
      topic: subject,
      author,
      publisher: "HAMOU MATH",
      url:
        file.webViewLink ||
        `https://drive.google.com/open?id=${encodeURIComponent(file.id)}`,
      file_url: file.webContentLink || "",
      license:
        file.appProperties?.license || "",
      content_hash:
        file.appProperties?.content_hash || "",
      is_public: true,
      is_active: true,

      metadata: {
        source: "Google Drive",
        drive_file_id: file.id,
        mime_type: file.mimeType || "",
        size: file.size
          ? Number(file.size)
          : null,
        path,
        keywords,
        created_time:
          file.createdTime || "",
        modified_time:
          file.modifiedTime || "",
        starred:
          Boolean(file.starred)
      }
    });
  }

  return results;
}

// ------------------------------------------------------------
// Source
// ------------------------------------------------------------

async function getOrCreateSource() {
  const sourceUrl =
    `google-drive://${DRIVE_ROOT_FOLDER_ID}`;

  const { data: existing, error: findError } =
    await supabase
      .from("hm_resource_sources")
      .select("id")
      .eq("base_url", sourceUrl)
      .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existing?.id) {
    return existing.id;
  }

  const { data, error } =
    await supabase
      .from("hm_resource_sources")
      .insert({
        name: "HAMOU MATH Google Drive",
        base_url: sourceUrl,
        source_type: "google_drive",
        language: "multi",
        enabled: true,
        auto_import: true
      })
      .select("id")
      .single();

  if (error) {
    throw error;
  }

  return data.id;
}

// ------------------------------------------------------------
// Upsert resources
// ------------------------------------------------------------

async function importResources(
  resources,
  sourceId
) {
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const resource of resources) {
    try {
      const { data: existing, error: findError } =
        await supabase
          .from("hm_resources")
          .select("id")
          .eq("source_id", sourceId)
          .eq("external_id", resource.external_id)
          .maybeSingle();

      if (findError) {
        throw findError;
      }

      if (existing?.id) {
        const { error } =
          await supabase
            .from("hm_resources")
            .update({
              title: resource.title,
              description: resource.description,
              resource_type: resource.resource_type,
              language: resource.language,
              level: resource.level,
              subject: resource.subject,
              topic: resource.topic,
              author: resource.author,
              publisher: resource.publisher,
              url: resource.url,
              file_url: resource.file_url,
              license: resource.license,
              content_hash: resource.content_hash,
              is_public: resource.is_public,
              is_active: resource.is_active,
              metadata: resource.metadata
            })
            .eq("id", existing.id);

        if (error) {
          throw error;
        }

        updated++;
      } else {
        const { error } =
          await supabase
            .from("hm_resources")
            .insert({
              source_id: sourceId,
              ...resource
            });

        if (error) {
          throw error;
        }

        imported++;
      }

    } catch (error) {
      errors++;

      console.error(
        `خطأ في المورد ${resource.external_id}:`,
        error?.message || error
      );
    }
  }

  if (
    imported === 0 &&
    updated === 0 &&
    errors === 0
  ) {
    skipped = resources.length;
  }

  return {
    imported,
    updated,
    skipped,
    errors
  };
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------

async function main() {
  const startedAt =
    new Date().toISOString();

  let importRunId = null;
  let sourceId = null;

  try {
    sourceId =
      await getOrCreateSource();

    const { data: run, error: runError } =
      await supabase
        .from("hm_resource_imports")
        .insert({
          source_id: sourceId,
          status: "running",
          metadata: {
            engine: "google-drive",
            version: "1.0.0"
          }
        })
        .select("id")
        .single();

    if (runError) {
      throw runError;
    }

    importRunId = run.id;

    console.log(
      "HAMOU MATH resource import started..."
    );

    const drive =
      createDriveClient();

    const resources =
      await scanFolder(
        drive,
        DRIVE_ROOT_FOLDER_ID
      );

    console.log(
      `Found ${resources.length} resources.`
    );

    const stats =
      await importResources(
        resources,
        sourceId
      );

    const finishedAt =
      new Date().toISOString();

    await supabase
      .from("hm_resource_imports")
      .update({
        finished_at: finishedAt,
        status: "completed",
        found_count: resources.length,
        imported_count: stats.imported,
        updated_count: stats.updated,
        skipped_count: stats.skipped,
        error_count: stats.errors,
        metadata: {
          started_at: startedAt,
          finished_at: finishedAt
        }
      })
      .eq("id", importRunId);

    await supabase
      .from("hm_resource_sources")
      .update({
        last_scan_at: finishedAt,
        last_success_at: finishedAt,
        last_error_at: null,
        last_error: null,
        resources_found: resources.length,
        resources_imported: stats.imported
      })
      .eq("id", sourceId);

    console.log("=================================");
    console.log("HAMOU MATH IMPORT COMPLETED");
    console.log("Found:", resources.length);
    console.log("Imported:", stats.imported);
    console.log("Updated:", stats.updated);
    console.log("Errors:", stats.errors);
    console.log("=================================");

  } catch (error) {
    console.error(
      "HAMOU MATH IMPORT FAILED:",
      error?.message || error
    );

    if (importRunId) {
      await supabase
        .from("hm_resource_imports")
        .update({
          finished_at: new Date().toISOString(),
          status: "failed",
          error_count: 1,
          error_message:
            error?.message ||
            "Unknown error"
        })
        .eq("id", importRunId);
    }

    if (sourceId) {
      await supabase
        .from("hm_resource_sources")
        .update({
          last_error_at:
            new Date().toISOString(),
          last_error:
            error?.message ||
            "Unknown error"
        })
        .eq("id", sourceId);
    }

    process.exitCode = 1;
  }
}

main();
