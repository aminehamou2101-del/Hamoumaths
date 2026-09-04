import { getAdminClient, getBearerToken } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      ok: false,
      error: "Method Not Allowed"
    });
  }

  const token = getBearerToken(req);

  if (!token) {
    return res.status(200).json({
      ok: true
    });
  }

  try {
    const supabase = getAdminClient();

    await supabase.auth.admin.signOut(token);

    return res.status(200).json({
      ok: true,
      message: "تم تسجيل الخروج"
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(200).json({
      ok: true
    });
  }
}
