import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false
  }
};

async function getRawBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(
      Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk)
    );
  }

  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const secret = process.env.CHARGILY_SECRET_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!secret || !supabaseUrl || !serviceRoleKey) {
      console.error("Missing environment variables");

      return res.status(500).json({
        error: "إعدادات الخادم غير مكتملة"
      });
    }

    const signature = req.headers.signature;

    if (!signature || typeof signature !== "string") {
      return res.status(401).json({
        error: "Missing signature"
      });
    }

    const rawBody = await getRawBody(req);

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const receivedBuffer =
      Buffer.from(signature, "utf8");

    const expectedBuffer =
      Buffer.from(expectedSignature, "utf8");

    if (
      receivedBuffer.length !==
      expectedBuffer.length
    ) {
      return res.status(401).json({
        error: "Invalid signature"
      });
    }

    if (
      !crypto.timingSafeEqual(
        receivedBuffer,
        expectedBuffer
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

    const checkout =
      event?.data ||
      event?.checkout ||
      event;

    const checkoutId = checkout?.id;

    if (!checkoutId) {
      return res.status(400).json({
        error: "Checkout ID غير موجود"
      });
    }

    const eventType =
      event?.type ||
      event?.event;

    /*
     * الدفع فشل
     */
    if (eventType === "checkout.failed") {
      const { error } =
        await supabaseAdmin
          .from("payments")
          .update({
            status: "failed",
            updated_at:
              new Date().toISOString()
          })
          .eq("checkout_id", checkoutId);

      if (error) {
        console.error(
          "Failed payment update:",
          error
        );

        return res.status(500).json({
          error:
            "تعذر تحديث حالة الدفع"
        });
      }

      return res.status(200).json({
        received: true,
        status: "failed"
      });
    }

    /*
     * تجاهل أي حدث آخر
     */
    if (eventType !== "checkout.paid") {
      return res.status(200).json({
        received: true,
        ignored: true,
        event: eventType || null
      });
    }

    /*
     * البحث عن عملية الدفع
     */
    const {
      data: payment,
      error: paymentFindError
    } = await supabaseAdmin
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
      .eq("checkout_id", checkoutId)
      .maybeSingle();

    if (paymentFindError) {
      console.error(
        "Payment lookup error:",
        paymentFindError
      );

      return res.status(500).json({
        error:
          "تعذر العثور على عملية الدفع"
      });
    }

    if (!payment) {
      console.error(
        "Unknown checkout:",
        checkoutId
      );

      return res.status(404).json({
        error:
          "عملية الدفع غير موجودة"
      });
    }

    /*
     * تحديث الدفع إلى paid
     *
     * حتى لو كان paid مسبقًا،
     * نستمر بالتحقق من الاشتراك.
     */
    if (payment.status !== "paid") {
      const paidAt =
        new Date().toISOString();

      const {
        error: paymentUpdateError
      } = await supabaseAdmin
        .from("payments")
        .update({
          status: "paid",
          paid_at: paidAt,
          updated_at: paidAt
        })
        .eq("id", payment.id);

      if (paymentUpdateError) {
        console.error(
          "Payment update error:",
          paymentUpdateError
        );

        return res.status(500).json({
          error:
            "تعذر تحديث حالة الدفع"
        });
      }
    }

    /*
     * التحقق من وجود الاشتراك
     *
     * هذا الجزء مهم جدًا لمنع إنشاء
     * اشتراكين إذا أرسل Chargily
     * نفس الحدث أكثر من مرة.
     */
    const {
      data: existingSubscription,
      error: subscriptionCheckError
    } = await supabaseAdmin
      .from("subscriptions")
      .select(`
        id,
        status,
        expires_at
      `)
      .eq("payment_id", payment.id)
      .maybeSingle();

    if (subscriptionCheckError) {
      console.error(
        "Subscription lookup error:",
        subscriptionCheckError
      );

      return res.status(500).json({
        error:
          "تعذر التحقق من الاشتراك"
      });
    }

    /*
     * الاشتراك موجود مسبقًا
     */
    if (existingSubscription) {
      return res.status(200).json({
        received: true,
        paid: true,
        alreadyProcessed: true,
        subscriptionId:
          existingSubscription.id
      });
    }

    /*
     * مدة الاشتراك
     */
    const configuredDays =
      Number(
        process.env.SUBSCRIPTION_DAYS || 30
      );

    const subscriptionDays =
      Number.isFinite(configuredDays) &&
      configuredDays > 0
        ? Math.floor(configuredDays)
        : 30;

    const startsAt = new Date();

    const expiresAt = new Date(
      startsAt.getTime() +
      subscriptionDays *
        24 *
        60 *
        60 *
        1000
    );

    /*
     * إنشاء الاشتراك
     */
    const {
      data: subscription,
      error:
        subscriptionInsertError
    } = await supabaseAdmin
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

    if (subscriptionInsertError) {
      /*
       * في حالة وصول Webhook مرتين
       * في نفس اللحظة، قد يمنع unique index
       * إنشاء نسخة ثانية.
       */
      if (
        subscriptionInsertError.code ===
        "23505"
      ) {
        const {
          data: existingAfterConflict
        } = await supabaseAdmin
          .from("subscriptions")
          .select("id")
          .eq("payment_id", payment.id)
          .maybeSingle();

        return res.status(200).json({
          received: true,
          paid: true,
          alreadyProcessed: true,
          subscriptionId:
            existingAfterConflict?.id || null
        });
      }

      console.error(
        "Subscription creation error:",
        subscriptionInsertError
      );

      return res.status(500).json({
        error:
          "تم الدفع ولكن تعذر تفعيل الاشتراك"
      });
    }

    console.log(
      "HAMOU MATH subscription activated:",
      {
        userId:
          payment.user_id,

        resourceId:
          payment.resource_id,

        paymentId:
          payment.id,

        subscriptionId:
          subscription.id
      }
    );

    return res.status(200).json({
      received: true,
      paid: true,
      subscriptionActivated: true,
      subscriptionId:
        subscription.id
    });

  } catch (error) {
    console.error(
      "Chargily webhook error:",
      error
    );

    return res.status(500).json({
      error:
        "Webhook server error"
    });
  }
}
