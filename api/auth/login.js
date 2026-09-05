export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return Response.json(
        { success: false, error: "البريد وكلمة المرور مطلوبان" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${env.SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: env.SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          email,
          password
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          error: "البريد الإلكتروني أو كلمة المرور غير صحيحة"
        },
        { status: 401 }
      );
    }

    return Response.json({
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || ""
          }
        : null
    });
  } catch {
    return Response.json(
      { success: false, error: "حدث خطأ أثناء تسجيل الدخول" },
      { status: 400 }
    );
  }
}
