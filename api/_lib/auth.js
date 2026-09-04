import { createClient } from "@supabase/supabase-js";

function getEnv(name) {
  const value = process.env[name];

  if (!value || typeof value !== "string") {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value.trim();
}

export function getAdminClient() {
  return createClient(
    getEnv("SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export function getBearerToken(req) {
  const header =
    req.headers.authorization || "";

  if (
    typeof header !== "string" ||
    !header.startsWith("Bearer ")
  ) {
    return null;
  }

  const token =
    header.slice("Bearer ".length).trim();

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
  } =
    await supabase.auth.getUser(token);

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

export async function requireRole(
  req,
  allowedRoles
) {
  const auth =
    await requireUser(req);

  if (!auth.ok) {
    return auth;
  }

  const {
    data: profile,
    error
  } =
    await auth.supabase
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
    console.error(
      "Profile lookup:",
      error
    );

    return {
      ok: false,
      status: 500,
      error: "تعذر التحقق من صلاحيات الحساب"
    };
  }

  if (!profile) {
    return {
      ok: false,
      status: 403,
      error: "ملف المستخدم غير موجود"
    };
  }

  const role =
    String(
      profile.role || "student"
    ).toLowerCase();

  if (!allowedRoles.includes(role)) {
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

export function jsonError(
  res,
  status,
  error
) {
  return res
    .status(status)
    .json({
      error
    });
}
