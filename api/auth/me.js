import {
  requireUser
} from "../_lib/auth.js";

export default async function handler(
  req,
  res
) {
  if (req.method !== "GET") {
    res.setHeader(
      "Allow",
      "GET"
    );

    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const auth =
      await requireUser(req);

    if (!auth.ok) {
      return res.status(
        auth.status
      ).json({
        user: null,
        error: auth.error
      });
    }

    const {
      data: profile,
      error
    } =
      await auth.supabase
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
        .eq(
          "id",
          auth.user.id
        )
        .maybeSingle();

    if (error) {
      console.error(
        "Profile error:",
        error
      );

      return res.status(500).json({
        user: null,
        error:
          "تعذر تحميل ملف المستخدم"
      });
    }

    return res.status(200).json({
      user: {
        id: auth.user.id,

        email:
          profile?.email ||
          auth.user.email ||
          "",

        name:
          profile?.full_name ||
          auth.user.user_metadata
            ?.full_name ||
          auth.user.user_metadata
            ?.name ||
          "",

        avatar_url:
          profile?.avatar_url ||
          null,

        role:
          profile?.role ||
          "student",

        xp:
          Number(
            profile?.xp || 0
          ),

        level:
          Number(
            profile?.level || 1
          )
      }
    });

  } catch (error) {
    console.error(
      "auth/me:",
      error
    );

    return res.status(500).json({
      user: null,
      error:
        "حدث خطأ داخلي في الخادم"
    });
  }
}
