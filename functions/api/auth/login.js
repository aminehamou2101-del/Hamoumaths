import { json } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return json({
        success: false,
        error: "البريد وكلمة المرور مطلوبان"
      }, 400);
    }

    const response = await fetch(
      `${env.SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return json({
        success: false,
        error: data.error_description ||
          data.msg ||
          "بيانات الدخول غير صحيحة"
      }, 401);
    }

    return json({
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      user: data.user
    });
  } catch {
    return json({
      success: false,
      error: "خطأ في تسجيل الدخول"
    }, 400);
  }
}
