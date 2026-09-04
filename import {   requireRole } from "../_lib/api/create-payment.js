import {
  requireUser
} from "./_lib/auth.js";

function getRequiredEnv(name) {
  const value = process.env[name];

  if (
    !value ||
    typeof value !== "string"
  ) {
    throw new Error(
      `Missing environment variable: ${name}`
    );
  }

  return value.trim();
}

function cleanId(value) {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const id =
    value.trim();

  if (
    !id ||
    id.length > 200
  ) {
    return null;
  }

  return id;
}

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

  try {
    const auth =
      await requireUser(req);

    if (!auth.ok) {
      return res.status(
        auth.status
      ).json({
        error: auth.error
      });
    }

    let body = req.body || {};

    if (
      typeof body === "string"
    ) {
      try {
        body =
          JSON.parse(body);
      } catch {
        return res.status(400).json({
          error:
            "بيانات الطلب غير صالحة"
        });
      }
    }

    const resourceId =
      cleanId(
        body.resourceId
      );

    if (!resourceId) {
      return res.status(400).json({
        error:
          "resourceId مطلوب"
      });
    }

    /*
     * السعر والمبلغ لا يأتيان من المتصفح.
     */

    const {
      data: resource,
      error: resourceError
    } =
      await auth.supabase
        .from("math_resources")
        .select(`
          id,
          title,
          name,
          is_paid,
          price,
          currency,
          active
        `)
        .eq(
          "id",
          resourceId
        )
        .maybeSingle();

    if (resourceError) {
      console.error(
        "Resource error:",
        resourceError
      );

      return res.status(500).json({
        error:
          "تعذر قراءة المورد"
      });
    }

    if (!resource) {
      return res.status(404).json({
        error:
          "المورد غير موجود"
      });
    }

    if (
      resource.active === false
    ) {
      return res.status(400).json({
        error:
          "المورد غير متاح حاليًا"
      });
    }

    if (
      resource.is_paid !== true
    ) {
      return res.status(400).json({
        error:
          "هذا المورد مجاني"
      });
    }

    const price =
      Number(resource.price);

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return res.status(400).json({
        error:
          "سعر المورد غير صالح"
      });
    }

    /*
     * Chargily الجزائرية:
     * المبلغ النهائي يجب أن يكون DZD.
     *
     * إذا كانت قاعدة البيانات تسجل
     * السعر بالدينار، نستعمله مباشرة.
     */

    const chargilyAmount =
      Math.round(price);

    if (
      !Number.isSafeInteger(
        chargilyAmount
      ) ||
      chargilyAmount <= 0
    ) {
      return res.status(400).json({
        error:
          "مبلغ الدفع غير صالح"
      });
    }

    const secretKey =
      getRequiredEnv(
        "CHARGILY_SECRET_KEY"
      );

    const siteURL =
      (
        process.env.SITE_URL ||
        "https://hamoumaths.vercel.app"
      )
      .replace(
        /\/+$/,
        ""
      );

    const successURL =
      `${siteURL}/?payment=success&resource=${encodeURIComponent(resourceId)}`;

    const failureURL =
      `${siteURL}/?payment=failed&resource=${encodeURIComponent(resourceId)}`;

    const webhookURL =
      `${siteURL}/api/chargily-webhook`;

    const paymentMethod =
      (
        process.env.CHARGILY_PAYMENT_METHOD ||
        "edahabia"
      ).trim();


    /*
     * منع إنشاء اشتراك مكرر إذا كان
     * المستخدم يملك وصولًا فعالًا بالفعل.
     */

    const now =
      new Date().toISOString();

    const {
      data: existingSubscription,
      error:
        existingSubscriptionError
    } =
      await auth.supabase
        .from("subscriptions")
        .select(`
          id,
          status,
          expires_at
        `)
        .eq(
          "user_id",
          auth.user.id
        )
        .eq(
          "resource_id",
          resourceId
        )
        .eq(
          "status",
          "active"
        )
        .lte(
          "starts_at",
          now
        )
        .or(
          `expires_at.is.null,expires_at.gt.${now}`
        )
        .order(
          "created_at",
          {
            ascending:false
          }
        )
        .limit(1)
        .maybeSingle();

    if (
      existingSubscriptionError
    ) {
      console.error(
        existingSubscriptionError
      );

      return res.status(500).json({
        error:
          "تعذر التحقق من الاشتراك الحالي"
      });
    }

    if (existingSubscription) {
      return res.status(409).json({
        error:
          "لديك اشتراك فعال لهذا المورد",
        alreadySubscribed:true,
        expiresAt:
          existingSubscription.expires_at
      });
    }


    const checkoutPayload = {
      amount:
        chargilyAmount,

      currency:
        "dzd",

      payment_method:
        paymentMethod,

      success_url:
        successURL,

      failure_url:
        failureURL,

      webhook_endpoint:
        webhookURL,

      description:
        String(
          resource.title ||
          resource.name ||
          "HAMOU MATH"
        ).slice(
          0,
          250
        ),

      locale:
        "ar",

      metadata:{
        user_id:
          auth.user.id,

        resource_id:
          resourceId
      }
    };


    const response =
      await fetch(
        "https://pay.chargily.net/api/v2/checkouts",
        {
          method:"POST",

          headers:{
            Authorization:
              `Bearer ${secretKey}`,

            "Content-Type":
              "application/json",

            Accept:
              "application/json"
          },

          body:
            JSON.stringify(
              checkoutPayload
            )
        }
      );


    let data = null;

    try {
      data =
        await response.json();
    } catch {
      data = null;
    }


    if (!response.ok) {

      console.error(
        "Chargily error:",
        {
          status:
            response.status,

          data
        }
      );

      return res.status(502).json({
        error:
          "تعذر إنشاء عملية الدفع عبر Chargily"
      });
    }


    const checkoutId =
      data?.id;

    const checkoutURL =
      data?.checkout_url;


    if (
      !checkoutId ||
      !checkoutURL
    ) {

      console.error(
        "Invalid Chargily response:",
        data
      );

      return res.status(502).json({
        error:
          "Chargily لم يرجع رابط الدفع"
      });
    }


    /*
     * نسجل العملية قبل إعادة
     * المستخدم إلى Chargily.
     */

    const {
      data: payment,
      error: paymentError
    } =
      await auth.supabase
        .from("payments")
        .insert({
          user_id:
            auth.user.id,

          resource_id:
            resourceId,

          checkout_id:
            String(checkoutId),

          amount:
            chargilyAmount,

          currency:
            "dzd",

          status:
            "pending",

          payment_method:
            paymentMethod
        })
        .select()
        .single();


    if (paymentError) {

      console.error(
        "Payment insert:",
        paymentError
      );

      /*
       * لا نترك checkout صالحًا
       * بدون سجل داخلي.
       */
      return res.status(500).json({
        error:
          "تعذر تسجيل عملية الدفع"
      });
    }


    return res.status(200).json({

      success:true,

      checkoutId:
        String(checkoutId),

      checkoutUrl:
        checkoutURL,

      paymentId:
        payment.id,

      amount:
        chargilyAmount,

      currency:
        "dzd",

      resourceId

    });

  } catch (error) {

    console.error(
      "create-payment:",
      error
    );

    return res.status(500).json({
      error:
        "حدث خطأ داخلي في الخادم"
    });
  }
}
