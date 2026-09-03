import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const secret = process.env.CHARGILY_SECRET_KEY;

    if (!secret) {
      return res.status(500).json({
        error: "CHARGILY_SECRET_KEY غير موجود"
      });
    }

    const signature = req.headers.signature;

    if (!signature) {
      return res.status(401).json({
        error: "Missing signature"
      });
    }

    /*
      الحصول على جسم الطلب الخام
      مهم جدًا للتحقق من توقيع Chargily
    */
    const rawBody =
      typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body);

    const expectedSignature =
      crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

    const valid =
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

    if (!valid) {
      return res.status(401).json({
        error: "Invalid signature"
      });
    }

    const event =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

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

    const checkout =
      event?.data || event?.checkout || event;

    const checkoutId =
      checkout?.id;

    if (!checkoutId) {
      return res.status(400).json({
        error: "Checkout ID غير موجود"
      });
    }

    /*
      الدفع الناجح
    */
    if (event?.type === "checkout.paid") {

      const { error } =
        await supabaseAdmin
          .from("payments")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("checkout_id", checkoutId);

      if (error) {
        console.error(
          "Supabase payment update error:",
          error
        );

        return res.status(500).json({
          error: "تعذر تحديث حالة الدفع"
        });
      }
    }

    /*
      الدفع الفاشل
    */
    if (event?.type === "checkout.failed") {

      const { error } =
        await supabaseAdmin
          .from("payments")
          .update({
            status: "failed",
            updated_at: new Date().toISOString()
          })
          .eq("checkout_id", checkoutId);

      if (error) {
        console.error(
          "Supabase failed payment update:",
          error
        );

        return res.status(500).json({
          error: "تعذر تحديث حالة الدفع"
        });
      }
    }

    return res.status(200).json({
      received: true
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
