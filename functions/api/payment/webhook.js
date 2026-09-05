async function verifySignature(payload, signature, secret) {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expected.length !== signature.length) return false;

  let diff = 0;

  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }

  return diff === 0;
}

async function supabaseRequest(env, path, options = {}) {
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (
    !env.CHARGILY_SECRET_KEY ||
    !env.SUPABASE_URL ||
    !env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return new Response("Server configuration error", {
      status: 500
    });
  }

  const signature = request.headers.get("signature");

  if (!signature) {
    return new Response("Missing signature", {
      status: 400
    });
  }

  const payload = await request.text();

  const valid = await verifySignature(
    payload,
    signature,
    env.CHARGILY_SECRET_KEY
  );

  if (!valid) {
    return new Response("Invalid signature", {
      status: 403
    });
  }

  let event;

  try {
    event = JSON.parse(payload);
  } catch {
    return new Response("Invalid JSON", {
      status: 400
    });
  }

  const checkout = event?.data;

  if (!checkout?.id) {
    return new Response("Invalid checkout", {
      status: 400
    });
  }

  const checkoutId = checkout.id;

  /*
   * مهم:
   * لا نثق في user_id القادم من المتصفح.
   * نقرأ العملية الموجودة في قاعدة البيانات بواسطة
   * provider_payment_id.
   */

  const transactionResponse = await supabaseRequest(
    env,
    `payment_transactions?provider=eq.chargily&provider_payment_id=eq.${encodeURIComponent(
      checkoutId
    )}&select=*`
  );

  if (!transactionResponse.ok) {
    return new Response("Database lookup failed", {
      status: 500
    });
  }

  const transactions = await transactionResponse.json();

  /*
   * إذا لم توجد العملية المحلية، لا ننشئ اشتراكًا
   * من Webhook مجهول.
   */
  if (!transactions.length) {
    return new Response("Payment not found", {
      status: 200
    });
  }

  const transaction = transactions[0];

  if (event.type === "checkout.paid") {
    /*
     * Idempotency:
     * إذا وصل Webhook مرتين لا ننشئ اشتراكين.
     */
    if (transaction.status === "paid") {
      return Response.json({
        received: true,
        already_processed: true
      });
    }

    /*
     * تأكيد الدفع.
     */
    const updatePayment = await supabaseRequest(
      env,
      `payment_transactions?id=eq.${encodeURIComponent(transaction.id)}`,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          status: "paid",
          metadata: {
            ...(transaction.metadata || {}),
            chargily_event_id: event.id || null,
            checkout_status: checkout.status || "paid",
            processed_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
      }
    );

    if (!updatePayment.ok) {
      return new Response("Payment update failed", {
        status: 500
      });
    }

    /*
     * تحديد نوع الاشتراك.
     */
    const plan =
      transaction.product === "teacher_pro"
        ? "teacher_pro"
        : "premium";

    /*
     * مدة الاشتراك:
     * 30 يومًا من لحظة التأكيد.
     */
    const start = new Date();

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 30);

    /*
     * إنشاء/تحديث اشتراك المستخدم.
     */
    const subscriptionResponse = await supabaseRequest(
      env,
      "subscriptions?on_conflict=user_id,plan",
      {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify({
          user_id: transaction.user_id,
          plan,
          provider: "chargily",
          status: "active",
          current_period_start: start.toISOString(),
          current_period_end: end.toISOString(),
          provider_customer_id:
            checkout.customer_id || null,
          provider_subscription_id:
            checkoutId,
          updated_at: new Date().toISOString()
        })
      }
    );

    if (!subscriptionResponse.ok) {
      return new Response("Subscription activation failed", {
        status: 500
      });
    }
  }

  if (
    event.type === "checkout.failed" ||
    event.type === "checkout.canceled"
  ) {
    await supabaseRequest(
      env,
      `payment_transactions?id=eq.${encodeURIComponent(transaction.id)}`,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          status:
            event.type === "checkout.canceled"
              ? "cancelled"
              : "failed",
          updated_at: new Date().toISOString()
        })
      }
    );
  }

  return Response.json({
    received: true
  });
}
