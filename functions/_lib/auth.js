export async function getUser(request, env) {
  const auth = request.headers.get("Authorization");

  if (!auth?.startsWith("Bearer ")) {
    return null;
  }

  const token = auth.slice(7);

  const response = await fetch(
    `${env.SUPABASE_URL}/auth/v1/user`,
    {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) return null;

  return await response.json();
}

export async function requireUser(request, env) {
  const user = await getUser(request, env);

  if (!user) {
    return {
      ok: false,
      response: Response.json(
        { success: false, error: "يجب تسجيل الدخول" },
        { status: 401 }
      )
    };
  }

  return { ok: true, user };
}

export async function requireOwner(request, env) {
  const result = await requireUser(request, env);

  if (!result.ok) return result;

  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(result.user.id)}&select=role`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );

  if (!response.ok) {
    return {
      ok: false,
      response: Response.json(
        { success: false, error: "تعذر التحقق من الصلاحيات" },
        { status: 500 }
      )
    };
  }

  const rows = await response.json();

  if (rows[0]?.role !== "owner") {
    return {
      ok: false,
      response: Response.json(
        { success: false, error: "غير مصرح" },
        { status: 403 }
      )
    };
  }

  return {
    ok: true,
    user: result.user
  };
}
