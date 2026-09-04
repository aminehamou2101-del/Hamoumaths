import { createClient } from "@supabase/supabase-js";

function env(name) {
  const value = process.env[name];

  if (!value || !String(value).trim()) {
    throw new Error(`Missing ${name}`);
  }

  return String(value).trim();
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

    if (!email || !email.includes("@")) {
      return res.status(400).json({
        ok: false,
        error: "أدخل بريدًا إلكترونيًا صحيحًا"
      });
    }

    const supabase = createClient(
      env("SUPABASE_URL"),
      env("SUPABASE_ANON_KEY")
    );

    const redirectTo =
      `${env("PUBLIC_SITE_URL")}/`;

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo
        }
      );

    if (error) {
      console.error("Password reset:", error);

      return res.status(400).json({
        ok: false,
        error: error.message
      });
    }

    return res.status(200).json({
      ok: true,
      message:
        "إذا كان البريد مسجلاً، فسيتم إرسال تعليمات استعادة كلمة المرور."
    });
  } catch (error) {
    console.error("Reset error:", error);

    return res.status(500).json({
      ok: false,
      error: "تعذر تنفيذ طلب استعادة كلمة المرور"
    });
  }
}
