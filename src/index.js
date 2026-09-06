/* =========================================================
   HAMOU MATH — CLOUDFLARE WORKER
   API + SUPABASE + AUTH + OWNER DASHBOARD
========================================================= */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods":
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info",
  "Access-Control-Max-Age": "86400",
};


/* =========================================================
   JSON RESPONSE
========================================================= */

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


/* =========================================================
   SUPABASE CONFIG
========================================================= */

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


/* =========================================================
   SUPABASE FETCH
========================================================= */

async function supabaseFetch(env, path, options = {}) {
  const { url, key } = getSupabaseConfig(env);

  if (!url) {
    throw new Error(
      "SUPABASE_URL is not configured"
    );
  }

  if (!key) {
    throw new Error(
      "Supabase secret/key is not configured"
    );
  }

  const response = await fetch(
    `${url}${path}`,
    {
      method: options.method || "GET",

      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers || {}),
      },

      body: options.body,
    }
  );

  const text = await response.text();

  let data;

  try {
    data = text
      ? JSON.parse(text)
      : null;
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
   SAFE ILIKE SEARCH
========================================================= */

function escapeIlike(value) {
  return String(value || "")
    .replace(/\\/g, "")
    .replace(/%/g, "")
    .replace(/_/g, "")
    .replace(/,/g, " ")
    .trim();
}


/* =========================================================
   HEALTH
========================================================= */

async function handleHealth(env) {
  const { url, key } =
    getSupabaseConfig(env);

  return json({
    success: true,

    service:
      "HAMOU MATH API",

    status:
      "online",

    cloudflare:
      true,

    supabase_configured:
      Boolean(url && key),

    timestamp:
      new Date().toISOString(),
  });
}


/* =========================================================
   PUBLIC RESOURCES
========================================================= */

async function handleResources(
  request,
  env
) {
  const requestUrl =
    new URL(request.url);

  const limitRaw =
    Number(
      requestUrl.searchParams.get(
        "limit"
      ) || 24
    );

  const offsetRaw =
    Number(
      requestUrl.searchParams.get(
        "offset"
      ) || 0
    );

  const limit =
    Math.min(
      Math.max(
        Number.isFinite(limitRaw)
          ? limitRaw
          : 24,
        1
      ),
      240
    );

  const offset =
    Math.max(
      Number.isFinite(offsetRaw)
        ? offsetRaw
        : 0,
      0
    );

  const category =
    requestUrl.searchParams.get(
      "category"
    );

  const level =
    requestUrl.searchParams.get(
      "level"
    );

  const language =
    requestUrl.searchParams.get(
      "language"
    );

  const type =
    requestUrl.searchParams.get(
      "type"
    );

  const params =
    new URLSearchParams();

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

  params.set(
    "is_published",
    "eq.true"
  );

  params.set(
    "order",
    "created_at.desc"
  );

  params.set(
    "limit",
    String(limit)
  );

  params.set(
    "offset",
    String(offset)
  );

  if (category) {
    params.set(
      "category",
      `eq.${category}`
    );
  }

  if (level) {
    params.set(
      "level",
      `eq.${level}`
    );
  }

  if (language) {
    params.set(
      "language",
      `eq.${language}`
    );
  }

  if (type) {
    params.set(
      "type",
      `eq.${type}`
    );
  }

  const result =
    await supabaseFetch(
      env,
      `/rest/v1/resources?${params.toString()}`,
      {
        headers: {
          Prefer:
            "count=exact",
        },
      }
    );

  const resources =
    Array.isArray(
      result.data
    )
      ? result.data
      : [];

  const contentRange =
    result.response.headers.get(
      "content-range"
    ) || "";

  let total =
    resources.length;

  const match =
    contentRange.match(
      /\/(\d+)$/
    );

  if (match) {
    total =
      Number(match[1]);
  }

  return json({
    success: true,

    resources,

    data:
      resources,

    total,

    count:
      resources.length,

    limit,

    offset,
  });
}


/* =========================================================
   SEARCH
========================================================= */

async function handleSearch(
  request,
  env
) {
  const requestUrl =
    new URL(request.url);

  const query =
    requestUrl.searchParams.get(
      "q"
    ) ||
    requestUrl.searchParams.get(
      "query"
    ) ||
    requestUrl.searchParams.get(
      "search"
    ) ||
    "";

  const limitRaw =
    Number(
      requestUrl.searchParams.get(
        "limit"
      ) || 24
    );

  const limit =
    Math.min(
      Math.max(
        Number.isFinite(limitRaw)
          ? limitRaw
          : 24,
        1
      ),
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

  const safeQuery =
    escapeIlike(query);

  const params =
    new URLSearchParams();

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

  params.set(
    "is_published",
    "eq.true"
  );

  params.set(
    "or",
    [
      `title.ilike.*${safeQuery}*`,
      `description.ilike.*${safeQuery}*`,
      `content.ilike.*${safeQuery}*`,
    ].join(",")
  );

  params.set(
    "order",
    "created_at.desc"
  );

  params.set(
    "limit",
    String(limit)
  );

  const result =
    await supabaseFetch(
      env,
      `/rest/v1/resources?${params.toString()}`
    );

  const resources =
    Array.isArray(result.data)
      ? result.data
      : [];

  return json({
    success: true,

    query,

    resources,

    data:
      resources,

    total:
      resources.length,

    count:
      resources.length,
  });
}


/* =========================================================
   AUTH — CURRENT USER
========================================================= */

async function handleAuthMe(
  request,
  env
) {
  const authorization =
    request.headers.get(
      "Authorization"
    ) || "";

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return json({
      success: true,
      authenticated: false,
      user: null,
      profile: null,
    });
  }

  const token =
    authorization
      .substring(7)
      .trim();

  if (!token) {
    return json({
      success: true,
      authenticated: false,
      user: null,
      profile: null,
    });
  }

  const { url, key } =
    getSupabaseConfig(env);

  if (!url || !key) {
    return json(
      {
        success: false,
        authenticated: false,
        error:
          "SUPABASE_NOT_CONFIGURED",
      },
      503
    );
  }

  const response =
    await fetch(
      `${url}/auth/v1/user`,
      {
        headers: {
          apikey: key,
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  if (!response.ok) {
    return json({
      success: true,
      authenticated: false,
      user: null,
      profile: null,
    });
  }

  const user =
    await response.json();

  let profile =
    null;

  try {
    const profileResult =
      await supabaseFetch(
        env,
        `/rest/v1/profiles?select=*&id=eq.${encodeURIComponent(
          user.id
        )}&limit=1`
      );

    if (
      Array.isArray(
        profileResult.data
      ) &&
      profileResult.data.length
    ) {
      profile =
        profileResult.data[0];
    }
  } catch (error) {
    console.warn(
      "Profile lookup failed:",
      error.message
    );
  }

  return json({
    success: true,

    authenticated: true,

    user,

    profile,
  });
}


/* =========================================================
   AUTH — LOGIN
========================================================= */

async function handleLogin(
  request,
  env
) {
  const body =
    await request
      .json()
      .catch(() => ({}));

  const email =
    String(
      body.email || ""
    ).trim();

  const password =
    String(
      body.password || ""
    );

  if (
    !email ||
    !password
  ) {
    return json(
      {
        success: false,

        error:
          "EMAIL_PASSWORD_REQUIRED",

        message:
          "البريد الإلكتروني وكلمة المرور مطلوبان",
      },
      400
    );
  }

  const { url, key } =
    getSupabaseConfig(env);

  if (!url || !key) {
    return json(
      {
        success: false,

        error:
          "SUPABASE_NOT_CONFIGURED",
      },
      503
    );
  }

  const response =
    await fetch(
      `${url}/auth/v1/token?grant_type=password`,
      {
        method: "POST",

        headers: {
          apikey: key,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            email,
            password,
          }),
      }
    );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    return json(
      {
        success: false,

        error:
          data.error ||
          "LOGIN_FAILED",

        message:
          data.error_description ||
          data.msg ||
          "فشل تسجيل الدخول",
      },
      response.status
    );
  }

  return json({
    success: true,

    authenticated: true,

    user:
      data.user || null,

    session:
      data,

    access_token:
      data.access_token || null,

    refresh_token:
      data.refresh_token || null,
  });
}


/* =========================================================
   AUTH — REGISTER
========================================================= */

async function handleRegister(
  request,
  env
) {
  const body =
    await request
      .json()
      .catch(() => ({}));

  const email =
    String(
      body.email || ""
    ).trim();

  const password =
    String(
      body.password || ""
    );

  const fullName =
    String(
      body.full_name ||
      body.fullName ||
      body.name ||
      ""
    ).trim();

  if (
    !email ||
    !password
  ) {
    return json(
      {
        success: false,

        error:
          "EMAIL_PASSWORD_REQUIRED",

        message:
          "البريد الإلكتروني وكلمة المرور مطلوبان",
      },
      400
    );
  }

  const { url, key } =
    getSupabaseConfig(env);

  if (!url || !key) {
    return json(
      {
        success: false,

        error:
          "SUPABASE_NOT_CONFIGURED",
      },
      503
    );
  }

  const response =
    await fetch(
      `${url}/auth/v1/signup`,
      {
        method: "POST",

        headers: {
          apikey: key,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            email,

            password,

            data: {
              full_name:
                fullName,
            },
          }),
      }
    );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    return json(
      {
        success: false,

        error:
          data.error ||
          "REGISTER_FAILED",

        message:
          data.error_description ||
          data.msg ||
          "فشل إنشاء الحساب",
      },
      response.status
    );
  }

  return json({
    success: true,

    authenticated:
      Boolean(
        data.access_token
      ),

    user:
      data.user || null,

    session:
      data.access_token
        ? data
        : null,

    access_token:
      data.access_token || null,

    refresh_token:
      data.refresh_token || null,
  });
}


/* =========================================================
   AUTH — LOGOUT
========================================================= */

async function handleLogout(
  request,
  env
) {
  const authorization =
    request.headers.get(
      "Authorization"
    ) || "";

  const token =
    authorization.startsWith(
      "Bearer "
    )
      ? authorization
          .substring(7)
          .trim()
      : "";

  const { url, key } =
    getSupabaseConfig(env);

  if (
    url &&
    key &&
    token
  ) {
    await fetch(
      `${url}/auth/v1/logout`,
      {
        method: "POST",

        headers: {
          apikey: key,

          Authorization:
            `Bearer ${token}`,
        },
      }
    ).catch(() => {});
  }

  return json({
    success: true,

    logged_out: true,
  });
}


/* =========================================================
   AUTHENTICATED CONTEXT
========================================================= */

async function getAuthenticatedContext(
  request,
  env
) {
  const authorization =
    request.headers.get(
      "Authorization"
    ) || "";

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return {
      authenticated: false,

      user: null,

      profile: null,

      token: "",
    };
  }

  const token =
    authorization
      .substring(7)
      .trim();

  if (!token) {
    return {
      authenticated: false,

      user: null,

      profile: null,

      token: "",
    };
  }

  const { url, key } =
    getSupabaseConfig(env);

  if (!url || !key) {
    throw new Error(
      "SUPABASE_NOT_CONFIGURED"
    );
  }

  /*
    نتحقق من التوكن الحقيقي
    مع Supabase Auth.
  */

  const response =
    await fetch(
      `${url}/auth/v1/user`,
      {
        headers: {
          apikey: key,

          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  if (!response.ok) {
    return {
      authenticated: false,

      user: null,

      profile: null,

      token,
    };
  }

  const user =
    await response.json();

  let profile =
    null;

  try {
    const result =
      await supabaseFetch(
        env,
        `/rest/v1/profiles?select=*&id=eq.${encodeURIComponent(
          user.id
        )}&limit=1`
      );

    if (
      Array.isArray(result.data) &&
      result.data.length
    ) {
      profile =
        result.data[0];
    }
  } catch (error) {
    console.warn(
      "Owner profile lookup failed:",
      error.message
    );
  }

  return {
    authenticated: true,

    user,

    profile,

    token,
  };
}


/* =========================================================
   OWNER SECURITY
========================================================= */

async function requireOwner(
  request,
  env
) {
  const context =
    await getAuthenticatedContext(
      request,
      env
    );

  if (
    !context.authenticated ||
    !context.user
  ) {
    return {
      ok: false,

      response: json(
        {
          success: false,

          error:
            "UNAUTHORIZED",

          message:
            "يجب تسجيل الدخول.",
        },
        401
      ),
    };
  }

  const role =
    String(
      context.profile?.role ||
      context.user
        ?.user_metadata
        ?.role ||
      context.user
        ?.app_metadata
        ?.role ||
      ""
    ).toLowerCase();

  if (role !== "owner") {
    return {
      ok: false,

      response: json(
        {
          success: false,

          error:
            "OWNER_ONLY",

          message:
            "هذه العملية متاحة لحساب Owner فقط.",
        },
        403
      ),
    };
  }

  return {
    ok: true,

    ...context,
  };
}


/* =========================================================
   OWNER — STATS
========================================================= */

async function handleAdminStats(
  request,
  env
) {
  const auth =
    await requireOwner(
      request,
      env
    );

  if (!auth.ok) {
    return auth.response;
  }

  const [
    usersResult,

    resourcesResult,

    publishedResult,

    teachersResult,

    studentsResult,

    adminsResult,

    ownersResult,
  ] =
    await Promise.all([
      supabaseFetch(
        env,
        "/rest/v1/profiles?select=id&limit=1",
        {
          headers: {
            Prefer:
              "count=exact",
          },
        }
      ),

      supabaseFetch(
        env,
        "/rest/v1/resources?select=id&limit=1",
        {
          headers: {
            Prefer:
              "count=exact",
          },
        }
      ),

      supabaseFetch(
        env,
        "/rest/v1/resources?select=id&is_published=eq.true&limit=1",
        {
          headers: {
            Prefer:
              "count=exact",
          },
        }
      ),

      supabaseFetch(
        env,
        "/rest/v1/profiles?select=id&role=eq.teacher&limit=1",
        {
          headers: {
            Prefer:
              "count=exact",
          },
        }
      ),

      supabaseFetch(
        env,
        "/rest/v1/profiles?select=id&role=eq.student&limit=1",
        {
          headers: {
            Prefer:
              "count=exact",
          },
        }
      ),

      supabaseFetch(
        env,
        "/rest/v1/profiles?select=id&role=eq.admin&limit=1",
        {
          headers: {
            Prefer:
              "count=exact",
          },
        }
      ),

      supabaseFetch(
        env,
        "/rest/v1/profiles?select=id&role=eq.owner&limit=1",
        {
          headers: {
            Prefer:
              "count=exact",
          },
        }
      ),
    ]);

  function getCount(result) {
    const range =
      result?.response
        ?.headers
        ?.get(
          "content-range"
        ) || "";

    const match =
      range.match(
        /\/(\d+)$/
      );

    return match
      ? Number(match[1])
      : 0;
  }

  return json({
    success: true,

    stats: {
      users:
        getCount(
          usersResult
        ),

      resources:
        getCount(
          resourcesResult
        ),

      published_resources:
        getCount(
          publishedResult
        ),

      teachers:
        getCount(
          teachersResult
        ),

      students:
        getCount(
          studentsResult
        ),

      admins:
        getCount(
          adminsResult
        ),

      owners:
        getCount(
          ownersResult
        ),
    },

    owner: {
      id:
        auth.user.id,

      email:
        auth.user.email,

      full_name:
        auth.profile?.full_name ||
        auth.user
          ?.user_metadata
          ?.full_name ||
        "",

      role:
        auth.profile?.role ||
        "owner",

      plan:
        auth.profile?.plan ||
        "free",
    },
  });
}


/* =========================================================
   OWNER — USERS
========================================================= */

async function handleAdminUsers(
  request,
  env
) {
  const auth =
    await requireOwner(
      request,
      env
    );

  if (!auth.ok) {
    return auth.response;
  }

  const requestUrl =
    new URL(request.url);

  const search =
    requestUrl
      .searchParams
      .get("search")
      ?.trim() || "";

  const limitRaw =
    Number(
      requestUrl
        .searchParams
        .get("limit") || 100
    );

  const limit =
    Math.min(
      Math.max(
        Number.isFinite(
          limitRaw
        )
          ? limitRaw
          : 100,
        1
      ),
      500
    );

  const params =
    new URLSearchParams();

  params.set(
    "select",
    [
      "id",
      "email",
      "full_name",
      "role",
      "plan",
      "xp",
      "is_active",
      "created_at",
      "updated_at",
    ].join(",")
  );

  params.set(
    "order",
    "created_at.desc"
  );

  params.set(
    "limit",
    String(limit)
  );

  if (search) {
    const safe =
      escapeIlike(
        search
      );

    params.set(
      "or",
      [
        `email.ilike.*${safe}*`,
        `full_name.ilike.*${safe}*`,
      ].join(",")
    );
  }

  const result =
    await supabaseFetch(
      env,
      `/rest/v1/profiles?${params.toString()}`
    );

  const users =
    Array.isArray(
      result.data
    )
      ? result.data
      : [];

  return json({
    success: true,

    users,

    total:
      users.length,
  });
}


/* =========================================================
   OWNER — UPDATE USER
========================================================= */

async function handleAdminUpdateUser(
  request,
  env,
  userId
) {
  const auth =
    await requireOwner(
      request,
      env
    );

  if (!auth.ok) {
    return auth.response;
  }

  if (!userId) {
    return json(
      {
        success: false,

        error:
          "USER_ID_REQUIRED",
      },
      400
    );
  }

  const body =
    await request
      .json()
      .catch(() => ({}));

  const allowed =
    {};

  /* ---------- ROLE ---------- */

  if (
    body.role !== undefined
  ) {
    const role =
      String(
        body.role
      ).toLowerCase();

    const validRoles = [
      "student",
      "teacher",
      "admin",
      "owner",
    ];

    if (
      !validRoles.includes(
        role
      )
    ) {
      return json(
        {
          success: false,

          error:
            "INVALID_ROLE",

          message:
            "الدور غير صالح.",
        },
        400
      );
    }

    /*
      حماية Owner الحالي
    */

    if (
      userId === auth.user.id &&
      role !== "owner"
    ) {
      return json(
        {
          success: false,

          error:
            "OWNER_PROTECTED",

          message:
            "لا يمكن لحساب Owner الحالي فقدان صلاحية Owner.",
        },
        403
      );
    }

    allowed.role =
      role;
  }


  /* ---------- PLAN ---------- */

  if (
    body.plan !== undefined
  ) {
    const plan =
      String(
        body.plan
      ).toLowerCase();

    const validPlans = [
      "free",
      "monthly",
      "quarterly",
      "yearly",
    ];

    if (
      !validPlans.includes(
        plan
      )
    ) {
      return json(
        {
          success: false,

          error:
            "INVALID_PLAN",

          message:
            "الخطة غير صالحة.",
        },
        400
      );
    }

    allowed.plan =
      plan;
  }


  /* ---------- ACTIVE ---------- */

  if (
    body.is_active !==
    undefined
  ) {
    allowed.is_active =
      Boolean(
        body.is_active
      );
  }


  /* ---------- XP ---------- */

  if (
    body.xp !== undefined
  ) {
    const xp =
      Number(
        body.xp
      );

    if (
      !Number.isFinite(
        xp
      ) ||
      xp < 0
    ) {
      return json(
        {
          success: false,

          error:
            "INVALID_XP",
        },
        400
      );
    }

    allowed.xp =
      Math.floor(xp);
  }


  if (
    !Object.keys(
      allowed
    ).length
  ) {
    return json(
      {
        success: false,

        error:
          "NO_CHANGES",
      },
      400
    );
  }

  allowed.updated_at =
    new Date()
      .toISOString();

  const result =
    await supabaseFetch(
      env,
      `/rest/v1/profiles?id=eq.${encodeURIComponent(
        userId
      )}`,
      {
        method:
          "PATCH",

        headers: {
          Prefer:
            "return=representation",
        },

        body:
          JSON.stringify(
            allowed
          ),
      }
    );

  const updated =
    Array.isArray(
      result.data
    ) &&
    result.data.length
      ? result.data[0]
      : null;

  return json({
    success: true,

    user:
      updated,
  });
}


/* =========================================================
   OWNER — RESOURCES
========================================================= */

async function handleAdminResources(
  request,
  env
) {
  const auth =
    await requireOwner(
      request,
      env
    );

  if (!auth.ok) {
    return auth.response;
  }

  const requestUrl =
    new URL(request.url);

  const search =
    requestUrl
      .searchParams
      .get("search")
      ?.trim() || "";

  const limitRaw =
    Number(
      requestUrl
        .searchParams
        .get("limit") || 100
    );

  const limit =
    Math.min(
      Math.max(
        Number.isFinite(
          limitRaw
        )
          ? limitRaw
          : 100,
        1
      ),
      500
    );

  const params =
    new URLSearchParams();

  params.set(
    "select",
    [
      "id",
      "title",
      "description",
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

  params.set(
    "order",
    "created_at.desc"
  );

  params.set(
    "limit",
    String(limit)
  );

  if (search) {
    const safe =
      escapeIlike(
        search
      );

    params.set(
      "or",
      [
        `title.ilike.*${safe}*`,
        `description.ilike.*${safe}*`,
      ].join(",")
    );
  }

  const result =
    await supabaseFetch(
      env,
      `/rest/v1/resources?${params.toString()}`
    );

  const resources =
    Array.isArray(
      result.data
    )
      ? result.data
      : [];

  return json({
    success: true,

    resources,

    total:
      resources.length,
  });
}


/* =========================================================
   OWNER — UPDATE RESOURCE
========================================================= */

async function handleAdminUpdateResource(
  request,
  env,
  resourceId
) {
  const auth =
    await requireOwner(
      request,
      env
    );

  if (!auth.ok) {
    return auth.response;
  }

  if (!resourceId) {
    return json(
      {
        success: false,

        error:
          "RESOURCE_ID_REQUIRED",
      },
      400
    );
  }

  const body =
    await request
      .json()
      .catch(() => ({}));

  const allowedFields = [
    "title",
    "description",
    "type",
    "category",
    "level",
    "language",
    "file_url",
    "thumbnail_url",
    "is_published",
  ];

  const update =
    {};

  for (
    const field
    of allowedFields
  ) {
    if (
      body[field] !==
      undefined
    ) {
      update[field] =
        body[field];
    }
  }

  if (
    !Object.keys(
      update
    ).length
  ) {
    return json(
      {
        success: false,

        error:
          "NO_CHANGES",
      },
      400
    );
  }

  update.updated_at =
    new Date()
      .toISOString();

  const result =
    await supabaseFetch(
      env,
      `/rest/v1/resources?id=eq.${encodeURIComponent(
        resourceId
      )}`,
      {
        method:
          "PATCH",

        headers: {
          Prefer:
            "return=representation",
        },

        body:
          JSON.stringify(
            update
          ),
      }
    );

  return json({
    success: true,

    resource:
      Array.isArray(
        result.data
      )
        ? result.data[0] ||
          null
        : null,
  });
}


/* =========================================================
   OWNER — DELETE RESOURCE
========================================================= */

async function handleAdminDeleteResource(
  request,
  env,
  resourceId
) {
  const auth =
    await requireOwner(
      request,
      env
    );

  if (!auth.ok) {
    return auth.response;
  }

  if (!resourceId) {
    return json(
      {
        success: false,

        error:
          "RESOURCE_ID_REQUIRED",
      },
      400
    );
  }

  await supabaseFetch(
    env,
    `/rest/v1/resources?id=eq.${encodeURIComponent(
      resourceId
    )}`,
    {
      method:
        "DELETE",
    }
  );

  return json({
    success: true,

    deleted: true,

    resource_id:
      resourceId,
  });
}


/* =========================================================
   STATIC ASSETS
========================================================= */

async function handleStatic(
  request,
  env
) {
  return env.ASSETS.fetch(
    request
  );
}


/* =========================================================
   MAIN WORKER
========================================================= */

export default {

  async fetch(
    request,
    env
  ) {

    const url =
      new URL(request.url);


    /* =====================================================
       CORS PREFLIGHT
    ===================================================== */

    if (
      request.method ===
      "OPTIONS"
    ) {
      return new Response(
        null,
        {
          status: 204,

          headers:
            corsHeaders,
        }
      );
    }


    try {


      /* ===================================================
         HEALTH
      =================================================== */

      if (
        url.pathname ===
          "/api/health" ||
        url.pathname ===
          "/api/health/"
      ) {

        return await
          handleHealth(
            env
          );
      }


      /* ===================================================
         PUBLIC RESOURCES
      =================================================== */

      if (
        url.pathname ===
          "/api/resources" ||
        url.pathname ===
          "/api/resources/"
      ) {

        if (
          request.method !==
          "GET"
        ) {
          return json(
            {
              success:
                false,

              error:
                "METHOD_NOT_ALLOWED",
            },
            405
          );
        }

        return await
          handleResources(
            request,
            env
          );
      }


      /* ===================================================
         SEARCH
      =================================================== */

      if (
        url.pathname ===
          "/api/search" ||
        url.pathname ===
          "/api/search/"
      ) {

        if (
          request.method !==
          "GET"
        ) {
          return json(
            {
              success:
                false,

              error:
                "METHOD_NOT_ALLOWED",
            },
            405
          );
        }

        return await
          handleSearch(
            request,
            env
          );
      }


      /* ===================================================
         AUTH — ME
      =================================================== */

      if (
        url.pathname ===
          "/api/auth/me" ||
        url.pathname ===
          "/api/auth/me/"
      ) {

        return await
          handleAuthMe(
            request,
            env
          );
      }


      /* ===================================================
         AUTH — LOGIN
      =================================================== */

      if (
        url.pathname ===
          "/api/auth/login" ||
        url.pathname ===
          "/api/auth/login/"
      ) {

        if (
          request.method !==
          "POST"
        ) {
          return json(
            {
              success:
                false,

              error:
                "METHOD_NOT_ALLOWED",
            },
            405
          );
        }

        return await
          handleLogin(
            request,
            env
          );
      }


      /* ===================================================
         AUTH — REGISTER
      =================================================== */

      if (
        url.pathname ===
          "/api/auth/register" ||
        url.pathname ===
          "/api/auth/register/"
      ) {

        if (
          request.method !==
          "POST"
        ) {
          return json(
            {
              success:
                false,

              error:
                "METHOD_NOT_ALLOWED",
            },
            405
          );
        }

        return await
          handleRegister(
            request,
            env
          );
      }


      /* ===================================================
         AUTH — LOGOUT
      =================================================== */

      if (
        url.pathname ===
          "/api/auth/logout" ||
        url.pathname ===
          "/api/auth/logout/"
      ) {

        return await
          handleLogout(
            request,
            env
          );
      }


      /* ===================================================
         OWNER — STATS
      =================================================== */

      if (
        url.pathname ===
          "/api/admin/stats" ||
        url.pathname ===
          "/api/admin/stats/"
      ) {

        if (
          request.method !==
          "GET"
        ) {
          return json(
            {
              success:
                false,

              error:
                "METHOD_NOT_ALLOWED",
            },
            405
          );
        }

        return await
          handleAdminStats(
            request,
            env
          );
      }


      /* ===================================================
         OWNER — USERS
      =================================================== */

      if (
        url.pathname ===
          "/api/admin/users" ||
        url.pathname ===
          "/api/admin/users/"
      ) {

        if (
          request.method !==
          "GET"
        ) {
          return json(
            {
              success:
                false,

              error:
                "METHOD_NOT_ALLOWED",
            },
            405
          );
        }

        return await
          handleAdminUsers(
            request,
            env
          );
      }


      /* ===================================================
         OWNER — UPDATE USER
      =================================================== */

      if (
        url.pathname.startsWith(
          "/api/admin/users/"
        )
      ) {

        const parts =
          url.pathname
            .split("/")
            .filter(
              Boolean
            );

        const userId =
          parts[
            parts.length - 1
          ];

        if (
          request.method ===
          "PATCH"
        ) {

          return await
            handleAdminUpdateUser(
              request,
              env,
              userId
            );
        }

        return json(
          {
            success:
              false,

            error:
              "METHOD_NOT_ALLOWED",
          },
          405
        );
      }


      /* ===================================================
         OWNER — RESOURCES
      =================================================== */

      if (
        url.pathname ===
          "/api/admin/resources" ||
        url.pathname ===
          "/api/admin/resources/"
      ) {

        if (
          request.method !==
          "GET"
        ) {
          return json(
            {
              success:
                false,

              error:
                "METHOD_NOT_ALLOWED",
            },
            405
          );
        }

        return await
          handleAdminResources(
            request,
            env
          );
      }


      /* ===================================================
         OWNER — RESOURCE ACTIONS
      =================================================== */

      if (
        url.pathname.startsWith(
          "/api/admin/resources/"
        )
      ) {

        const parts =
          url.pathname
            .split("/")
            .filter(
              Boolean
            );

        const resourceId =
          parts[
            parts.length - 1
          ];


        if (
          request.method ===
          "PATCH"
        ) {

          return await
            handleAdminUpdateResource(
              request,
              env,
              resourceId
            );
        }


        if (
          request.method ===
          "DELETE"
        ) {

          return await
            handleAdminDeleteResource(
              request,
              env,
              resourceId
            );
        }


        return json(
          {
            success:
              false,

            error:
              "METHOD_NOT_ALLOWED",
          },
          405
        );
      }


      /* ===================================================
         STATIC WEBSITE
      =================================================== */

      return await
        handleStatic(
          request,
          env
        );


    } catch (error) {

      console.error(
        "HAMOU MATH Worker error:",
        error
      );

      return json(
        {
          success:
            false,

          error:
            "INTERNAL_SERVER_ERROR",

          message:
            error?.message ||
            "Unknown error",
        },
        500
      );
    }
  },
};
