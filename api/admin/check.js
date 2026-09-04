import {
  requireRole
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
      authorized: false,
      error: "Method not allowed"
    });
  }

  try {
    const auth =
      await requireRole(
        req,
        ["owner"]
      );

    if (!auth.ok) {
      return res.status(
        auth.status
      ).json({
        authorized: false,
        error: auth.error
      });
    }

    return res.status(200).json({
      authorized: true,
      role: "owner",
      user: {
        id: auth.user.id,
        email:
          auth.profile.email,
        name:
          auth.profile.full_name
      }
    });

  } catch (error) {
    console.error(
      "admin/check:",
      error
    );

    return res.status(500).json({
      authorized: false,
      error:
        "تعذر التحقق من صلاحيات Owner"
    });
  }
}
