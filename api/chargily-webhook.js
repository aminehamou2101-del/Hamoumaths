import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false
  }
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", chunk => {
      chunks.push(
        Buffer.isBuffer(chunk)
          ? chunk
          : Buffer.from(chunk)
      );
    });

    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const secret =
      process.env.CHARGILY_SECRET_KEY;

    const supabaseUrl =
      process.env.SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !secret ||
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return res.status(500).json({
        error: "إعدادات الخادم غير مكتملة"
      });
    }

    const signature =
      req.headers.signature;

    if (
      !signature ||
      typeof signature !== "string"
    ) {
      return res.status(401).json({
        error: "Missing signature"
      });
    }

    const rawBody =
      await readRawBody(req);

    const expectedSignature =
      crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

    const received =
      Buffer.from(signature, "utf8");

    const expected =
      Buffer.from(
        expectedSignature,
        "utf8"
      );

    if (
      received.length !==
      expected.length
    ) {
      return res.status(401).json({
        error: "Invalid signature"
      });
    }

    if (
      !crypto.timingSafeEqual(
        received,
        expected
      )
    ) {
      return res.status(401).json({
        error: "Invalid signature"
      });
    }

    let event;

    try {
      event = JSON.parse(
        rawBody.toString("utf8")
      );
    } catch {
      return res.status(400).json({
        error: "Invalid JSON"
      });
    }

    const supabase =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

    const checkout =
      event?.data ||
      event?.checkout ||
      event;

    const checkoutId =
      checkout?.id;

    if (!checkoutId) {
      return res.status(400).json({
        error: "Checkout ID غير موجود"
      });
    }

    const eventType =
      event?.type ||
      event?.event;

    /* الدفع فشل */
    if (
      eventType ===
      "checkout.failed"
    ) {
      await supabase
        .from("payments")
        .update({
          status: "failed",
          updated_at:
            new Date().toISOString()
        })
        .eq(
          "checkout_id",
          checkoutId
        );

      return res.status(200).json({
        received: true,
        status: "failed"
      });
    }

    /* تجاهل الأحداث غير المطلوبة */
    if (
      eventType !==
      "checkout.paid"
    ) {
      return res.status(200).json({
        received: true,
        ignored: true
      });
    }

    /* العثور على الدفع */
    const {
      data: payment,
      error: paymentError
    } = await supabase
      .from("payments")
      .select(`
        id,
        user_id,
        resource_id,
        checkout_id,
        amount,
        currency,
        status
      `)
      .eq(
        "checkout_id",
        checkoutId
      )
      .maybeSingle();

    if (paymentError) {
      console.error(paymentError);

      return res.status(500).json({
        error: "خطأ في قاعدة البيانات"
      });
    }

    if (!payment) {
      return res.status(404).json({
        error:
          "عملية الدفع غير موجودة"
      });
    }

    /* تحديث الدفع */
    if (payment.status !== "paid") {
      const now =
        new Date().toISOString();

      const {
        error
      } = await supabase
        .from("payments")
        .update({
          status: "paid",
          paid_at: now,
          updated_at: now
        })
        .eq(
          "id",
          payment.id
        );

      if (error) {
        console.error(error);

        return res.status(500).json({
          error:
            "تعذر تحديث الدفع"
        });
      }
    }

    /*
     * التأكد من عدم وجود اشتراك
     */
    const {
      data: existing,
      error: existingError
    } = await supabase
      .from("subscriptions")
      .select("id")
      .eq(
        "payment_id",
        payment.id
      )
      .maybeSingle();

    if (existingError) {
      console.error(existingError);

      return res.status(500).json({
        error:
          "تعذر التحقق من الاشتراك"
      });
    }

    if (existing) {
      return res.status(200).json({
        received: true,
        paid: true,
        subscriptionActivated: true,
        alreadyProcessed: true,
        subscriptionId:
          existing.id
      });
    }

    /*
     * مدة الاشتراك
     */
    const days =
      Number(
        process.env.SUBSCRIPTION_DAYS ||
        30
      );

    const subscriptionDays =
      Number.isFinite(days) &&
      days > 0
        ? Math.floor(days)
        : 30;

    const startsAt =
      new Date();

    const expiresAt =
      new Date(
        startsAt.getTime() +
        subscriptionDays *
          86400000
      );

    /*
     * إنشاء الاشتراك
     */
    const {
      data: subscription,
      error:
        subscriptionError
    } = await supabase
      .from("subscriptions")
      .insert({
        user_id:
          payment.user_id,

        resource_id:
          payment.resource_id,

        status: "active",

        starts_at:
          startsAt.toISOString(),

        expires_at:
          expiresAt.toISOString(),

        checkout_id:
          payment.checkout_id,

        payment_id:
          payment.id
      })
      .select()
      .single();

    if (subscriptionError) {
      /*
       * إذا كان Webhook مكررًا
       */
      if (
        subscriptionError.code ===
        "23505"
      ) {
        return res.status(200).json({
          received: true,
          paid: true,
          alreadyProcessed: true
        });
      }

      console.error(
        subscriptionError
      );

      return res.status(500).json({
        error:
          "تم الدفع ولكن تعذر تفعيل الاشتراك"
      });
    }

    return res.status(200).json({
      received: true,
      paid: true,
      subscriptionActivated: true,
      subscriptionId:
        subscription.id
    });

  } catch (error) {
    console.error(
      "Webhook error:",
      error
    );

    return res.status(500).json({
      error: "Webhook server error"
    });
  }
}
