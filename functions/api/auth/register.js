import { json } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullName = String(body.full_name || "").trim();

    if (!email || !password) {
      return json({
        success: false,
        error: "البريد الإلكتروني وكلمة المرور مطلوبان"
      }, 400);
    }

    if (password.length < 8) {
      return json({
        success: false,
        error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
      }, 400);
    }

    const response = await fetch(
      `${env.SUPABASE_URL}/auth/v1/signup`,
      {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          data: {
            full_name: fullName
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return json({
        success: false,
        error: data.msg || data.message || "فشل التسجيل"
      }, response.status);
    }

    return json({
      success: true,
      user: data.user || null,
      session: data.session || null,
      message: data.session
        ? "تم إنشاء الحساب"
        : "تم إنشاء الحساب. تحقق من بريدك الإلكتروني."
    });
  } catch {
    return json({
      success: false,
      error: "طلب غير صالح"
    }, 400);
  }
}
