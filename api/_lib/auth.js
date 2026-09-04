import { createClient } from "@supabase/supabase-js";

function env(name) {
  const value = process.env[name];

  if (!value || !String(value).trim()) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return String(value).trim();
}

/**
 * Server-only Supabase client.
 * NEVER expose this client or its key to the browser.
 */
export function getAdminClient() {
  return createClient(
    env("SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

/**
 * Extract Bearer access token.
 */
export function getBearerToken(req) {
  const header = req.headers?.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice(7).trim();

  return token || null;
}

/**
 * Authenticate current user.
 */
export async function requireUser(req) {
  const token = getBearerToken(req);

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "يجب تسجيل الدخول أولاً"
    };
  }

  let supabase;

  try {
    supabase = getAdminClient();
  } catch (error) {
    console.error("Supabase configuration error:", error);

    return {
      ok: false,
      status: 500,
      error: "إعدادات Supabase غير مكتملة"
    };
  }

  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        ok: false,
        status: 401,
        error: "جلسة المستخدم غير صالحة"
      };
    }

    return {
      ok: true,
      user,
      token,
      supabase
    };
  } catch (error) {
    console.error("Authentication error:", error);

    return {
      ok: false,
      status: 401,
      error: "تعذر التحقق من الجلسة"
    };
  }
}

/**
 * Get authenticated user's profile.
 */
export async function getProfile(req) {
  const auth = await requireUser(req);

  if (!auth.ok) {
    return auth;
  }

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      avatar_url,
      role,
      xp,
      level
    `)
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) {
    console.error("Profile query error:", error);

    return {
      ok: false,
      status: 500,
      error: "تعذر تحميل صلاحيات الحساب"
    };
  }

  if (!profile) {
    return {
      ok: false,
      status: 403,
      error: "لا يوجد ملف صلاحيات لهذا الحساب"
    };
  }

  return {
    ...auth,
    profile
  };
}

/**
 * Require one of the specified roles.
 *
 * Example:
 * await requireRole(req, ["owner"])
 */
export async function requireRole(req, roles = []) {
  const result = await getProfile(req);

  if (!result.ok) {
    return result;
  }

  const allowedRoles = Array.isArray(roles)
    ? roles.map(x => String(x).toLowerCase())
    : [];

  const role = String(result.profile.role || "")
    .toLowerCase();

  if (!allowedRoles.includes(role)) {
    return {
      ok: false,
      status: 403,
      error: "ليس لديك صلاحية للوصول إلى هذا القسم"
    };
  }

  return {
    ...result,
    role
  };
}

/**
 * Require Owner specifically.
 */
export async function requireOwner(req) {
  return requireRole(req, ["owner"]);
}
