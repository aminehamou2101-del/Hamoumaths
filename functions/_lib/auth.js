export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}

export function getBearerToken(request) {
  const header = request.headers.get("Authorization") || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7).trim() || null;
}

export async function getUser(request, env) {
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      user: null,
      response: json({
        success: false,
        error: "غير مسجل الدخول"
      }, 401)
    };
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return {
      ok: false,
      user: null,
      response: json({
        success: false,
        error: "Supabase غير مهيأ"
      }, 500)
    };
  }

  const response = await fetch(
    `${env.SUPABASE_URL}/auth/v1/user`,
    {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    return {
      ok: false,
      user: null,
      response: json({
        success: false,
        error: "جلسة الدخول غير صالحة"
      }, 401)
    };
  }

  const user = await response.json();

  return {
    ok: true,
    user,
    token
  };
}

export async function requireUser(request, env) {
  return getUser(request, env);
}

export async function requireOwner(request, env) {
  const auth = await getUser(request, env);

  if (!auth.ok) return auth;

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      response: json({
        success: false,
        error: "مفتاح الإدارة غير مهيأ"
      }, 500)
    };
  }

  const url =
    `${env.SUPABASE_URL}/rest/v1/profiles` +
    `?id=eq.${encodeURIComponent(auth.user.id)}` +
    `&select=id,role,email,full_name`;

  const response = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization:
        `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  if (!response.ok) {
    return {
      ok: false,
      response: json({
        success: false,
        error: "تعذر التحقق من صلاحيات المستخدم"
      }, 500)
    };
  }

  const rows = await response.json();
  const profile = rows[0];

  if (!profile || profile.role !== "owner") {
    return {
      ok: false,
      response: json({
        success: false,
        error: "غير مصرح"
      }, 403)
    };
  }

  return {
    ok: true,
    user: auth.user,
    profile
  };
}
