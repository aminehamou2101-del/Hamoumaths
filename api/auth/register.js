import { createClient } from "@supabase/supabase-js";

function env(name) {
  const value = process.env[name];

  if (!value || !String(value).trim()) {
    throw new Error(`Missing ${name}`);
  }

  return String(value).trim();
}

function client() {
  return createClient(
    env("SUPABASE_URL"),
    env("SUPABASE_ANON_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      ok: false,
      error: "Method Not Allowed"
    });
  }

  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body?.password || "");

    const fullName = String(
      req.body?.full_name ||
      req.body?.name ||
      ""
    ).trim().slice(0, 100);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        ok: false,
        error: "البريد الإلكتروني غير صالح"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        ok: false,
        error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
      });
    }

    const supabase = client();

    const {
      data,
      error
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) {
      return res.status(400).json({
        ok: false,
        error: error.message
      });
    }

    return res.status(201).json({
      ok: true,
      message:
        data.session
          ? "تم إنشاء الحساب وتسجيل الدخول"
          : "تم إنشاء الحساب. تحقق من بريدك الإلكتروني إذا كان تأكيد البريد مفعلاً.",

      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at
          }
        : null,

      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email
          }
        : null
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      ok: false,
      error: "حدث خطأ أثناء إنشاء الحساب"
    });
  }
}
