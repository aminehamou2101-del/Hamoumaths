export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const full_name = String(body.full_name || "").trim();

    if (!email || !password) {
      return Response.json(
        { success: false, error: "البريد الإلكتروني وكلمة المرور مطلوبان" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { success: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
        { status: 400 }
      );
    }

    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return Response.json(
        { success: false, error: "إعدادات Supabase غير موجودة" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${env.SUPABASE_URL}/auth/v1/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: env.SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          email,
          password,
          data: {
            full_name
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          error: data.msg || data.message || data.error_description || "فشل إنشاء الحساب"
        },
        { status: response.status }
      );
    }

    return Response.json({
      success: true,
      message: data.session
        ? "تم إنشاء الحساب وتسجيل الدخول"
        : "تم إنشاء الحساب. تحقق من بريدك الإلكتروني إذا كان تأكيد البريد مفعلاً.",
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || ""
          }
        : null,
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at
          }
        : null
    });
  } catch {
    return Response.json(
      { success: false, error: "طلب غير صالح" },
      { status: 400 }
    );
  }
}
