import {
  requireUser
} from "../_lib/auth.js";

export default async function handler(
  req,
  res
) {
  if (req.method !== "POST") {
    res.setHeader(
      "Allow",
      "POST"
    );

    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  /*
   * Supabase access tokens are normally
   * managed by the client session.
   *
   * The server does not trust logout as
   * an authorization mechanism.
   */

  try {
    const auth =
      await requireUser(req);

    if (!auth.ok) {
      /*
       * Logout is idempotent.
       * Even an expired session can be
       * considered logged out.
       */
      return res.status(200).json({
        success: true
      });
    }

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    console.error(
      "auth/logout:",
      error
    );

    return res.status(200).json({
      success: true
    });
  }
}
