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

    if (!email || !email.includes("@")) {
      return res.status(400).json({
        ok: false,
        error: "البريد الإلكتروني غير صالح"
      });
    }

    if (!password) {
      return res.status(400).json({
        ok: false,
        error: "كلمة المرور مطلوبة"
      });
    }

    const supabase = client();

    const {
      data,
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.session || !data.user) {
      return res.status(401).json({
        ok: false,
        error: "البريد الإلكتروني أو كلمة المرور غير صحيحة"
      });
    }

    return res.status(200).json({
      ok: true,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      ok: false,
      error: "حدث خطأ أثناء تسجيل الدخول"
    });
  }
}
