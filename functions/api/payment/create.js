import { requireUser, json } from "../../_lib/auth.js";

const PRICES = {
  premium: 1000,
  teacher_pro: 2000
};

export async function onRequestPost({ request, env }) {
  const auth = await requireUser(request, env);

  if (!auth.ok) return auth.response;

  if (!env.CHARGILY_SECRET_KEY) {
    return json({
      success: false,
      error: "الدفع غير مهيأ"
    }, 500);
  }

  try {
    const body = await request.json();

    const product = String(body.product || "");

    if (!Object.prototype.hasOwnProperty.call(PRICES, product)) {
      return json({
        success: false,
        error: "منتج غير صالح"
      }, 400);
    }

    const amount = PRICES[product];

    const base =
      env.CHARGILY_MODE === "test"
        ? "https://pay.chargily.net/test/api/v2"
        : "https://pay.chargily.net/api/v2";

    const checkout = await fetch(
      `${base}/checkouts`,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${env.CHARGILY_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount,
          currency: "dzd",
          locale: "ar",
          success_url:
            "https://hamoumaths.pages.dev/?payment=success",
          failure_url:
            "https://hamoumaths.pages.dev/?payment=failure",
          webhook_endpoint:
            "https://hamoumaths.pages.dev/api/payment/webhook",
          metadata: {
            user_id: auth.user.id,
            product
          }
        })
      }
    );

    const data = await checkout.json();

    if (!checkout.ok) {
      return json({
        success: false,
        error: "تعذر إنشاء عملية الدفع"
      }, 502);
    }

    await fetch(
      `${env.SUPABASE_URL}/rest/v1/payment_transactions`,
      {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization:
            `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          user_id: auth.user.id,
          provider: "chargily",
          provider_payment_id: data.id || null,
          product,
          amount,
          currency: "DZD",
          status: "pending",
          metadata: data
        })
      }
    );

    return json({
      success: true,
      checkout_url: data.checkout_url,
      checkout_id: data.id
    });
  } catch {
    return json({
      success: false,
      error: "حدث خطأ أثناء إنشاء الدفع"
    }, 500);
  }
}
