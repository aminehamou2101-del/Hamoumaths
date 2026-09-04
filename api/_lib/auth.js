import { createClient } from "@supabase/supabase-js";

function env(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value.trim();
}

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

export function getBearerToken(req) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice(7).trim();

  return token || null;
}

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
    console.error(error);

    return {
      ok: false,
      status: 500,
      error: "إعدادات Supabase غير مكتملة"
    };
  }

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
}

export async function requireRole(req, roles) {
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

  if (error || !profile) {
    return {
      ok: false,
      status: 403,
      error: "تعذر التحقق من صلاحيات الحساب"
    };
  }

  const role = String(profile.role || "student").toLowerCase();

  if (!roles.includes(role)) {
    return {
      ok: false,
      status: 403,
      error: "ليس لديك صلاحية للوصول"
    };
  }

  return {
    ...auth,
    profile,
    role
  };
}
