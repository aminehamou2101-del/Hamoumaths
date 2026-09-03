import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const chargilySecretKey = process.env.CHARGILY_SECRET_KEY;

    if (!supabaseUrl || !serviceRoleKey || !chargilySecretKey) {
      console.error("Missing server environment variables");

      return res.status(500).json({
        error: "إعدادات الدفع غير مكتملة في الخادم"
      });
    }

    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "يجب تسجيل الدخول أولاً"
      });
    }

    const accessToken =
      authHeader.substring("Bearer ".length).trim();

    if (!accessToken) {
      return res.status(401).json({
        error: "جلسة المستخدم غير صالحة"
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

    const {
      data: { user },
      error: userError
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return res.status(401).json({
        error: "جلسة المستخدم غير صالحة"
      });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const resourceId = body.resourceId;

    if (!resourceId) {
      return res.status(400).json({
        error: "resourceId مطلوب"
      });
    }

    /*
     * جلب المورد من قاعدة البيانات
     * السعر لا يؤخذ من المتصفح لأسباب أمنية.
     */
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

    /*
     * Chargily Pay حاليًا:
     * نرسل مبلغ الدفع الحقيقي بالدينار الجزائري.
     *
     * ملاحظة:
     * EUR / USD يمكن استعمالهما لاحقًا لعرض السعر للمستخدم،
     * لكن لا نرسلهما إلى checkout إلا إذا كان حسابك/توثيق Chargily
     * يسمح بذلك.
     */
    const chargilyAmount = Math.round(amount);

    const origin =
      process.env.SITE_URL ||
      "https://hamoumaths.vercel.app";

    const successUrl =
      `${origin}/?payment=success&resource=${encodeURIComponent(resourceId)}`;

    const failureUrl =
      `${origin}/?payment=failed&resource=${encodeURIComponent(resourceId)}`;

    const webhookUrl =
      `${origin}/api/chargily-webhook`;

    /*
     * طريقة الدفع الافتراضية.
     * يمكن تغييرها لاحقًا إلى:
     * edahabia
     * cib
     * chargily_app
     */
    const paymentMethod =
      process.env.CHARGILY_PAYMENT_METHOD ||
      "edahabia";

    const checkoutPayload = {
      amount: chargilyAmount,

      currency: "dzd",

      payment_method: paymentMethod,

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
    };

    const chargilyResponse = await fetch(
      "https://pay.chargily.net/api/v2/checkouts",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${chargilySecretKey}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json"
        },

        body:
          JSON.stringify(checkoutPayload)
      }
    );

    let chargilyData = null;

    try {
      chargilyData =
        await chargilyResponse.json();
    } catch {
      chargilyData = null;
    }

    if (!chargilyResponse.ok) {
      console.error(
        "Chargily checkout error:",
        {
          status: chargilyResponse.status,
          response: chargilyData
        }
      );

      return res.status(502).json({
        error: "تعذر إنشاء عملية الدفع"
      });
    }

    const checkoutId =
      chargilyData?.id;

    const checkoutUrl =
      chargilyData?.checkout_url;

    if (!checkoutId || !checkoutUrl) {
      console.error(
        "Invalid Chargily response:",
        chargilyData
      );

      return res.status(502).json({
        error: "لم يتم الحصول على رابط الدفع"
      });
    }

    /*
     * تسجيل العملية في Supabase
     */
    const {
      data: payment,
      error: paymentError
    } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,

        resource_id: resourceId,

        checkout_id: checkoutId,

        amount: chargilyAmount,

        currency: "dzd",

        status: "pending",

        payment_method: paymentMethod
      })
      .select()
      .single();

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

      checkoutId,

      checkoutUrl,

      paymentId: payment.id,

      amount: chargilyAmount,

      currency: "dzd"
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
