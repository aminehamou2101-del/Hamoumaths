export async function onRequestGet(context) {
  const { request, env } = context;

  const auth = request.headers.get("Authorization");

  if (!auth || !auth.startsWith("Bearer ")) {
    return Response.json(
      { success: false, error: "غير مسجل الدخول" },
      { status: 401 }
    );
  }

  const token = auth.slice(7);

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return Response.json(
      { success: false, error: "Supabase غير مهيأ" },
      { status: 500 }
    );
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
    return Response.json(
      { success: false, error: "جلسة الدخول غير صالحة" },
      { status: 401 }
    );
  }

  const user = await response.json();

  return Response.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || "",
      role: user.user_metadata?.role || "student"
    }
  });
}
