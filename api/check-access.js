import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        allowed: false,
        error: "يجب تسجيل الدخول أولاً"
      });
    }

    const token = authHeader
      .replace("Bearer ", "")
      .trim();

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        allowed: false,
        error: "جلسة المستخدم غير صالحة"
      });
    }

    const resourceId =
      req.query.resourceId;

    if (!resourceId) {
      return res.status(400).json({
        allowed: false,
        error: "resourceId مطلوب"
      });
    }

    const now =
      new Date().toISOString();

    const {
      data: subscription,
      error
    } = await supabase
      .from("subscriptions")
      .select(`
        id,
        status,
        starts_at,
        expires_at,
        resource_id
      `)
      .eq("user_id", user.id)
      .eq("resource_id", resourceId)
      .eq("status", "active")
      .lte("starts_at", now)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order("created_at", {
        ascending: false
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "Access check error:",
        error
      );

      return res.status(500).json({
        allowed: false,
        error: "تعذر التحقق من الاشتراك"
      });
    }

    if (!subscription) {
      return res.status(200).json({
        allowed: false,
        status: "not_subscribed"
      });
    }

    return res.status(200).json({
      allowed: true,
      status: "active",
      subscriptionId:
        subscription.id,
      expiresAt:
        subscription.expires_at
    });

  } catch (error) {
    console.error(
      "check-access error:",
      error
    );

    return res.status(500).json({
      allowed: false,
      error: "حدث خطأ داخلي"
    });
  }
}
