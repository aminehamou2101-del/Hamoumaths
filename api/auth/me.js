import { getProfile } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");

    return res.status(405).json({
      ok: false,
      error: "Method Not Allowed"
    });
  }

  const result = await getProfile(req);

  if (!result.ok) {
    return res.status(result.status).json({
      ok: false,
      error: result.error
    });
  }

  const { user, profile } = result;

  return res.status(200).json({
    ok: true,

    user: {
      id: user.id,
      email: user.email,
      name:
        profile.full_name ||
        user.user_metadata?.full_name ||
        user.email,

      avatar_url:
        profile.avatar_url ||
        user.user_metadata?.avatar_url ||
        null,

      role: profile.role,
      xp: Number(profile.xp || 0),
      level: Number(profile.level || 1)
    }
  });
}
