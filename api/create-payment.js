import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "يجب تسجيل الدخول أولاً"
      });
    }

    const accessToken = authHeader.replace("Bearer ", "").trim();

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const chargilySecretKey = process.env.CHARGILY_SECRET_KEY;

    if (!supabaseUrl || !serviceRoleKey || !chargilySecretKey) {
      return res.status(500).json({
        error: "إعدادات الخادم غير مكتملة"
      });
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    /* التحقق من المستخدم */
    const {
      data: { user },
      error: userError
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return res.status(401).json({
        error: "جلسة المستخدم غير صالحة"
      });
    }

    const { resourceId } = req.body || {};

    if (!resourceId) {
      return res.status(400).json({
        error: "resourceId مطلوب"
      });
    }

    /* جلب المورد */
    const {
      data: resource,
      error: resourceError
    } = await supabaseAdmin
      .from("math_resources")
      .select("*")
      .eq("id", resourceId)
      .single();

    if (resourceError || !resource) {
      return res.status(404).json({
        error: "المورد غير موجود"
      });
    }

    if (!resource.is_paid) {
      return res.status(400).json({
        error: "هذا المورد مجاني"
      });
    }

    const amount = Number(resource.price);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        error: "سعر المورد غير صالح"
      });
    }

    /* إنشاء عملية الدفع في Chargily */
    const origin =
      process.env.SITE_URL ||
      "https://hamoumaths.vercel.app";

    const successUrl =
      `${origin}/?payment=success&resource=${encodeURIComponent(resourceId)}`;

    const failureUrl =
      `${origin}/?payment=failed&resource=${encodeURIComponent(resourceId)}`;

    const webhookUrl =
      `${origin}/api/chargily-webhook`;

    const chargilyResponse = await fetch(
      "https://pay.chargily.net/api/v2/checkouts",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${chargilySecretKey}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          amount: Math.round(amount),
          currency: "dzd",

          payment_method: "edahabia",

          success_url: successUrl,
          failure_url: failureUrl,
          webhook_endpoint: webhookUrl,

          description:
            resource.title ||
            resource.name ||
            "HAMOU MATH Resource",

          locale: "ar",

          metadata: {
            user_id: user.id,
            resource_id: resourceId
          }
        })
      }
    );

    const chargilyData = await chargilyResponse.json();

    if (!chargilyResponse.ok) {
      console.error(
        "Chargily error:",
        chargilyData
      );

      return res.status(502).json({
        error: "فشل إنشاء عملية الدفع",
        details: chargilyData
      });
    }

    if (!chargilyData.checkout_url) {
      return res.status(502).json({
        error: "لم يتم الحصول على رابط الدفع"
      });
    }

    /* تسجيل عملية الدفع */
    const { error: paymentError } =
      await supabaseAdmin
        .from("payments")
        .insert({
          user_id: user.id,
          resource_id: resourceId,
          checkout_id: chargilyData.id,
          amount: Math.round(amount),
          currency: "dzd",
          status: "pending",
          payment_method: "edahabia"
        });

    if (paymentError) {
      console.error(
        "Payment database error:",
        paymentError
      );

      return res.status(500).json({
        error: "تعذر تسجيل عملية الدفع"
      });
    }

    return res.status(200).json({
      success: true,
      checkoutId: chargilyData.id,
      checkoutUrl: chargilyData.checkout_url
    });

  } catch (error) {

    console.error(
      "create-payment error:",
      error
    );

    return res.status(500).json({
      error: "حدث خطأ داخلي في الخادم"
    });
  }
}
