import { requireUser } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method Not Allowed"
    });
  }

  const auth = await requireUser(req);

  if (!auth.ok) {
    return res.status(auth.status).json({
      error: auth.error
    });
  }

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      avatar_url,
      role,
      xp,
      level
    `)
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) {
    console.error(error);

    return res.status(500).json({
      error: "تعذر تحميل ملف المستخدم"
    });
  }

  return res.status(200).json({
    user: {
      id: auth.user.id,
      email: auth.user.email,
      name:
        profile?.full_name ||
        auth.user.user_metadata?.full_name ||
        auth.user.email,
      avatar_url:
        profile?.avatar_url ||
        auth.user.user_metadata?.avatar_url ||
        null,
      role: profile?.role || "student",
      xp: profile?.xp || 0,
      level: profile?.level || 1
    }
  });
}
