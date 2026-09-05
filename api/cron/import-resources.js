import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

function createDriveClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || ""
  );

  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  return google.drive({
    version: "v3",
    auth
  });
}

function authorized(request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) return false;

  const authorization =
    request.headers.get("authorization");

  return authorization === `Bearer ${secret}`;
}

async function getSource() {
  const baseUrl =
    `google-drive://${process.env.DRIVE_ROOT_FOLDER_ID}`;

  const { data, error } =
    await supabase
      .from("hm_resource_sources")
      .select("id")
      .eq("base_url", baseUrl)
      .maybeSingle();

  if (error) throw error;

  if (data) return data.id;

  const { data: created, error: createError } =
    await supabase
      .from("hm_resource_sources")
      .insert({
        name: "HAMOU MATH Google Drive",
        base_url: baseUrl,
        source_type: "google_drive",
        language: "multi",
        enabled: true,
        auto_import: true
      })
      .select("id")
      .single();

  if (createError) throw createError;

  return created.id;
}

async function listFiles(drive, folderId) {
  const files = [];
  let pageToken = null;

  do {
    const response =
      await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        spaces: "drive",
        pageSize: 1000,
        pageToken,
        fields:
          "nextPageToken,files(id,name,mimeType,description,webViewLink,webContentLink,createdTime,modifiedTime,size,owners(displayName),appProperties)",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
      });

    files.push(
      ...(response.data.files || [])
    );

    pageToken =
      response.data.nextPageToken || null;

  } while (pageToken);

  return files;
}

async function scan(
  drive,
  folderId,
  path = "",
  visited = new Set()
) {
  if (visited.has(folderId)) {
    return [];
  }

  visited.add(folderId);

  const files =
    await listFiles(
      drive,
      folderId
    );

  const results = [];

  for (const file of files) {
    if (!file?.id) continue;

    const name =
      file.name || "بدون عنوان";

    const currentPath =
      path
        ? `${path}/${name}`
        : name;

    if (
      file.mimeType ===
      "application/vnd.google-apps.folder"
    ) {
      const nested =
        await scan(
          drive,
          file.id,
          currentPath,
          visited
        );

      results.push(...nested);

      continue;
    }

    results.push({
      external_id: file.id,

      title: name,

      description:
        file.description ||
        "مورد رياضي من مكتبة HAMOU MATH",

      resource_type:
        file.appProperties?.type ||
        "resource",

      language:
        file.appProperties?.language ||
        "other",

      level:
        file.appProperties?.level ||
        "all",

      subject:
        file.appProperties?.subject ||
        "mathematics",

      topic:
        file.appProperties?.topic ||
        "mathematics",

      author:
        file.appProperties?.author ||
        file.owners?.[0]?.displayName ||
        "غير محدد",

      publisher:
        "HAMOU MATH",

      url:
        file.webViewLink ||
        `https://drive.google.com/open?id=${file.id}`,

      file_url:
        file.webContentLink || "",

      license:
        file.appProperties?.license || "",

      is_public: true,

      is_active: true,

      metadata: {
        source: "Google Drive",
        drive_file_id: file.id,
        path: currentPath,
        mime_type: file.mimeType || "",
        size:
          file.size
            ? Number(file.size)
            : null,
        created_time:
          file.createdTime || "",
        modified_time:
          file.modifiedTime || ""
      }
    });
  }

  return results;
}

async function importResources(
  resources,
  sourceId
) {
  let imported = 0;
  let updated = 0;
  let errors = 0;

  for (const resource of resources) {
    try {
      const { data: existing, error } =
        await supabase
          .from("hm_resources")
          .select("id")
          .eq("source_id", sourceId)
          .eq("external_id", resource.external_id)
          .maybeSingle();

      if (error) throw error;

      if (existing) {
        const { error: updateError } =
          await supabase
            .from("hm_resources")
            .update(resource)
            .eq("id", existing.id);

        if (updateError) throw updateError;

        updated++;

      } else {
        const { error: insertError } =
          await supabase
            .from("hm_resources")
            .insert({
              source_id: sourceId,
              ...resource
            });

        if (insertError) throw insertError;

        imported++;
      }

    } catch (error) {
      errors++;

      console.error(
        "Resource import error:",
        error?.message || error
      );
    }
  }

  return {
    imported,
    updated,
    errors
  };
}

export async function GET(request) {
  try {
    if (!authorized(request)) {
      return json(
        {
          success: false,
          error: "Unauthorized"
        },
        401
      );
    }

    const drive =
      createDriveClient();

    const sourceId =
      await getSource();

    const resources =
      await scan(
        drive,
        process.env.DRIVE_ROOT_FOLDER_ID
      );

    const stats =
      await importResources(
        resources,
        sourceId
      );

    const now =
      new Date().toISOString();

    await supabase
      .from("hm_resource_sources")
      .update({
        last_scan_at: now,
        last_success_at: now,
        resources_found:
          resources.length,
        resources_imported:
          stats.imported,
        last_error: null
      })
      .eq("id", sourceId);

    return json({
      success: true,
      automatic: true,
      found: resources.length,
      imported: stats.imported,
      updated: stats.updated,
      errors: stats.errors,
      completed_at: now
    });

  } catch (error) {
    console.error(
      "Automatic resource import failed:",
      error
    );

    return json(
      {
        success: false,
        automatic: true,
        error:
          error?.message ||
          "Import failed"
      },
      500
    );
  }
}
