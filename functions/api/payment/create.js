import { requireUser } from "../../_lib/auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  const auth = await requireUser(request, env);
  if (!auth.ok) return auth.response;

  if (!env.CHARGILY_SECRET_KEY) {
    return Response.json(
      { success: false, error: "Chargily غير مهيأ" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();

    const product =
      body.product === "teacher_pro" ? "teacher_pro" : "premium";

    const amount = Number(body.amount);

    if (!Number.isInteger(amount) || amount <= 0) {
      return Response.json(
        { success: false, error: "مبلغ غير صالح" },
        { status: 400 }
      );
    }

    const base =
      env.CHARGILY_MODE === "live"
        ? "https://pay.chargily.net/api/v2"
        : "https://pay.chargily.net/test/api/v2";

    const origin = new URL(request.url).origin;

    const checkoutResponse = await fetch(
      `${base}/checkouts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.CHARGILY_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount,
          currency: "dzd",
          payment_method: "edahabia",
          success_url: `${origin}/?payment=success`,
          failure_url: `${origin}/?payment=failed`,
          webhook_endpoint: `${origin}/api/payment/webhook`,
          description:
            product === "teacher_pro"
              ? "HAMOU MATH Teacher Pro"
              : "HAMOU MATH Premium",
          locale: "ar",
          metadata: {
            user_id: auth.user.id,
            product
          }
        })
      }
    );

    const checkout = await checkoutResponse.json();

    if (!checkoutResponse.ok) {
      return Response.json(
        {
          success: false,
          error: "فشل إنشاء عملية الدفع",
          details: checkout
        },
        { status: 502 }
      );
    }

    return Response.json({
      success: true,
      checkout_id: checkout.id,
      checkout_url: checkout.checkout_url
    });
  } catch {
    return Response.json(
      { success: false, error: "خطأ في إنشاء الدفع" },
      { status: 500 }
    );
  }
}
