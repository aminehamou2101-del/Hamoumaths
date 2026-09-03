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
        error: "يجب تسجيل الدخول أولاً"
      });
    }

    const accessToken = authHeader.replace("Bearer ", "").trim();

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
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

    const resourceId = req.query.resourceId;

    if (!resourceId) {
      return res.status(400).json({
        error: "resourceId مطلوب"
      });
    }

    /* البحث عن عملية الدفع الخاصة بهذا المستخدم */
    const {
      data: payment,
      error: paymentError
    } = await supabaseAdmin
      .from("payments")
      .select(`
        id,
        checkout_id,
        resource_id,
        amount,
        currency,
        status,
        payment_method,
        paid_at,
        created_at
      `)
      .eq("user_id", user.id)
      .eq("resource_id", resourceId)
      .order("created_at", {
        ascending: false
      })
      .limit(1)
      .maybeSingle();

    if (paymentError) {
      console.error(
        "Payment status error:",
        paymentError
      );

      return res.status(500).json({
        error: "تعذر التحقق من حالة الدفع"
      });
    }

    if (!payment) {
      return res.status(200).json({
        paid: false,
        status: "not_found"
      });
    }

    return res.status(200).json({
      paid: payment.status === "paid",
      status: payment.status,
      checkoutId: payment.checkout_id,
      resourceId: payment.resource_id,
      amount: payment.amount,
      currency: payment.currency,
      paidAt: payment.paid_at
    });

  } catch (error) {

    console.error(
      "payment-status error:",
      error
    );

    return res.status(500).json({
      error: "حدث خطأ داخلي في الخادم"
    });
  }
}
