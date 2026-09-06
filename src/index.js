const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info",
  "Access-Control-Max-Age": "86400",
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders,
      ...extraHeaders,
    },
  });
}

function getSupabaseConfig(env) {
  const url = env.SUPABASE_URL;

  const key =
    env.SUPABASE_SECRET_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY;

  return {
    url: url ? url.replace(/\/+$/, "") : "",
    key: key || "",
  };
}

async function supabaseFetch(env, path, options = {}) {
  const { url, key } = getSupabaseConfig(env);

  if (!url) {
    throw new Error("SUPABASE_URL is not configured");
  }

  if (!key) {
    throw new Error("Supabase secret/key is not configured");
  }

  const response = await fetch(`${url}${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
    body: options.body,
  });

  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message ||
          data?.error_description ||
          data?.error ||
          `Supabase returned HTTP ${response.status}`;

    throw new Error(message);
  }

  return {
    data,
    response,
  };
}

/* =========================================================
   HEALTH
========================================================= */

async function handleHealth(env) {
  const { url, key } = getSupabaseConfig(env);

  return json({
    success: true,
    service: "HAMOU MATH API",
    status: "online",
    cloudflare: true,
    supabase_configured: Boolean(url && key),
    timestamp: new Date().toISOString(),
  });
}

/* =========================================================
   RESOURCES
========================================================= */

async function handleResources(request, env) {
  const requestUrl = new URL(request.url);

  const limitRaw = Number(requestUrl.searchParams.get("limit") || 24);
  const offsetRaw = Number(requestUrl.searchParams.get("offset") || 0);

  const limit = Math.min(
    Math.max(Number.isFinite(limitRaw) ? limitRaw : 24, 1),
    240
  );

  const offset = Math.max(
    Number.isFinite(offsetRaw) ? offsetRaw : 0,
    0
  );

  const category = requestUrl.searchParams.get("category");
  const level = requestUrl.searchParams.get("level");
  const language = requestUrl.searchParams.get("language");
  const type = requestUrl.searchParams.get("type");

  const params = new URLSearchParams();

  params.set(
    "select",
    [
      "id",
      "title",
      "description",
      "content",
      "type",
      "category",
      "level",
      "language",
      "file_url",
      "thumbnail_url",
      "author_id",
      "is_published",
      "created_at",
      "updated_at",
    ].join(",")
  );

  params.set("is_published", "eq.true");
  params.set("order", "created_at.desc");
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  if (category) {
    params.set("category", `eq.${category}`);
  }

  if (level) {
    params.set("level", `eq.${level}`);
  }

  if (language) {
    params.set("language", `eq.${language}`);
  }

  if (type) {
    params.set("type", `eq.${type}`);
  }

  const result = await supabaseFetch(
    env,
    `/rest/v1/resources?${params.toString()}`,
    {
      headers: {
        Prefer: "count=exact",
      },
    }
  );

  const resources = Array.isArray(result.data)
    ? result.data
    : [];

  const contentRange =
    result.response.headers.get("content-range") || "";

  let total = resources.length;

  const match = contentRange.match(/\/(\d+)$/);

  if (match) {
    total = Number(match[1]);
  }

  return json({
    success: true,
    resources,
    data: resources,
    total,
    count: resources.length,
    limit,
    offset,
  });
}

/* =========================================================
   SEARCH
========================================================= */

function escapeIlike(value) {
  return value
    .replace(/\\/g, "")
    .replace(/%/g, "")
    .replace(/_/g, "")
    .replace(/,/g, " ")
    .trim();
}

async function handleSearch(request, env) {
  const requestUrl = new URL(request.url);

  const query =
    requestUrl.searchParams.get("q") ||
    requestUrl.searchParams.get("query") ||
    requestUrl.searchParams.get("search") ||
    "";

  const limitRaw = Number(
    requestUrl.searchParams.get("limit") || 24
  );

  const limit = Math.min(
    Math.max(Number.isFinite(limitRaw) ? limitRaw : 24, 1),
    100
  );

  if (!query.trim()) {
    return json({
      success: true,
      query: "",
      resources: [],
      data: [],
      total: 0,
      count: 0,
    });
  }

  const safeQuery = escapeIlike(query);

  const params = new URLSearchParams();

  params.set(
    "select",
    [
      "id",
      "title",
      "description",
      "content",
      "type",
      "category",
      "level",
      "language",
      "file_url",
      "thumbnail_url",
      "author_id",
      "is_published",
      "created_at",
      "updated_at",
    ].join(",")
  );

  params.set("is_published", "eq.true");

  params.set(
    "or",
    [
      `title.ilike.*${safeQuery}*`,
      `description.ilike.*${safeQuery}*`,
      `content.ilike.*${safeQuery}*`,
    ].join(",")
  );

  params.set("order", "created_at.desc");
  params.set("limit", String(limit));

  const result = await supabaseFetch(
    env,
    `/rest/v1/resources?${params.toString()}`
  );

  const resources = Array.isArray(result.data)
    ? result.data
    : [];

  return json({
    success: true,
    query,
    resources,
    data: resources,
    total: resources.length,
    count: resources.length,
  });
}

/* =========================================================
   AUTH CHECK
========================================================= */

async function handleAuthMe(request, env) {
  const authorization =
    request.headers.get("Authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return json({
      success: true,
      authenticated: false,
      user: null,
      profile: null,
    });
  }

  const token = authorization.substring(7).trim();

  if (!token) {
    return json({
      success: true,
      authenticated: false,
      user: null,
      profile: null,
    });
  }

  const { url, key } = getSupabaseConfig(env);

  if (!url || !key) {
    return json({
      success: false,
      authenticated: false,
      error: "SUPABASE_NOT_CONFIGURED",
    }, 503);
  }

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return json({
      success: true,
      authenticated: false,
      user: null,
      profile: null,
    });
  }

  const user = await response.json();

  let profile = null;

  try {
    const profileResult = await supabaseFetch(
      env,
      `/rest/v1/profiles?select=*&id=eq.${encodeURIComponent(user.id)}&limit=1`
    );

    if (
      Array.isArray(profileResult.data) &&
      profileResult.data.length
    ) {
      profile = profileResult.data[0];
    }
  } catch (error) {
    console.warn("Profile lookup failed:", error.message);
  }

  return json({
    success: true,
    authenticated: true,
    user,
    profile,
  });
}

/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(request, env) {
  const body = await request.json().catch(() => ({}));

  const email = String(body.email || "").trim();
  const password = String(body.password || "");

  if (!email || !password) {
    return json({
      success: false,
      error: "EMAIL_PASSWORD_REQUIRED",
      message: "البريد الإلكتروني وكلمة المرور مطلوبان",
    }, 400);
  }

  const { url, key } = getSupabaseConfig(env);

  if (!url || !key) {
    return json({
      success: false,
      error: "SUPABASE_NOT_CONFIGURED",
    }, 503);
  }

  const response = await fetch(
    `${url}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return json({
      success: false,
      error: data.error || "LOGIN_FAILED",
      message:
        data.error_description ||
        data.msg ||
        "فشل تسجيل الدخول",
    }, response.status);
  }

  return json({
    success: true,
    authenticated: true,
    user: data.user || null,
    session: data,
    access_token: data.access_token || null,
    refresh_token: data.refresh_token || null,
  });
}

/* =========================================================
   REGISTER
========================================================= */

async function handleRegister(request, env) {
  const body = await request.json().catch(() => ({}));

  const email = String(body.email || "").trim();
  const password = String(body.password || "");
  const fullName = String(
    body.full_name ||
    body.fullName ||
    body.name ||
    ""
  ).trim();

  if (!email || !password) {
    return json({
      success: false,
      error: "EMAIL_PASSWORD_REQUIRED",
      message: "البريد الإلكتروني وكلمة المرور مطلوبان",
    }, 400);
  }

  const { url, key } = getSupabaseConfig(env);

  if (!url || !key) {
    return json({
      success: false,
      error: "SUPABASE_NOT_CONFIGURED",
    }, 503);
  }

  const response = await fetch(
    `${url}/auth/v1/signup`,
    {
      method: "POST",
      headers: {
        apikey: key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        data: {
          full_name: fullName,
        },
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return json({
      success: false,
      error: data.error || "REGISTER_FAILED",
      message:
        data.error_description ||
        data.msg ||
        "فشل إنشاء الحساب",
    }, response.status);
  }

  return json({
    success: true,
    authenticated: Boolean(data.access_token),
    user: data.user || null,
    session: data.access_token ? data : null,
    access_token: data.access_token || null,
    refresh_token: data.refresh_token || null,
  });
}

/* =========================================================
   LOGOUT
========================================================= */

async function handleLogout(request, env) {
  const authorization =
    request.headers.get("Authorization") || "";

  const token = authorization.startsWith("Bearer ")
    ? authorization.substring(7).trim()
    : "";

  const { url, key } = getSupabaseConfig(env);

  if (url && key && token) {
    await fetch(`${url}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => {});
  }

  return json({
    success: true,
    logged_out: true,
  });
}

/* =========================================================
   STATIC ASSETS
========================================================= */

async function handleStatic(request, env) {
  return env.ASSETS.fetch(request);
}

/* =========================================================
   MAIN WORKER
========================================================= */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      // -----------------------------
      // API
      // -----------------------------

      if (
        url.pathname === "/api/health" ||
        url.pathname === "/api/health/"
      ) {
        return await handleHealth(env);
      }

      if (
        url.pathname === "/api/resources" ||
        url.pathname === "/api/resources/"
      ) {
        if (request.method !== "GET") {
          return json({
            success: false,
            error: "METHOD_NOT_ALLOWED",
          }, 405);
        }

        return await handleResources(request, env);
      }

      if (
        url.pathname === "/api/search" ||
        url.pathname === "/api/search/"
      ) {
        if (request.method !== "GET") {
          return json({
            success: false,
            error: "METHOD_NOT_ALLOWED",
          }, 405);
        }

        return await handleSearch(request, env);
      }

      if (
        url.pathname === "/api/auth/me" ||
        url.pathname === "/api/auth/me/"
      ) {
        return await handleAuthMe(request, env);
      }

      if (
        url.pathname === "/api/auth/login" ||
        url.pathname === "/api/auth/login/"
      ) {
        if (request.method !== "POST") {
          return json({
            success: false,
            error: "METHOD_NOT_ALLOWED",
          }, 405);
        }

        return await handleLogin(request, env);
      }

      if (
        url.pathname === "/api/auth/register" ||
        url.pathname === "/api/auth/register/"
      ) {
        if (request.method !== "POST") {
          return json({
            success: false,
            error: "METHOD_NOT_ALLOWED",
          }, 405);
        }

        return await handleRegister(request, env);
      }

      if (
        url.pathname === "/api/auth/logout" ||
        url.pathname === "/api/auth/logout/"
      ) {
        return await handleLogout(request, env);
      }

      // -----------------------------
      // Static website
      // -----------------------------

      return await handleStatic(request, env);

    } catch (error) {
      console.error("HAMOU MATH Worker error:", error);

      return json({
        success: false,
        error: "INTERNAL_SERVER_ERROR",
        message: error?.message || "Unknown error",
      }, 500);
    }
  },
};
