import {
  requireUser
} from "./_lib/auth.js";

export default async function handler(
  req,
  res
) {
  if (req.method !== "GET") {
    res.setHeader(
      "Allow",
      "GET"
    );

    return res.status(405).json({
      error:"Method not allowed"
    });
  }

  try {

    const auth =
      await requireUser(req);

    if (!auth.ok) {
      return res.status(
        auth.status
      ).json({
        paid:false,
        error:auth.error
      });
    }


    const checkoutId =
      typeof req.query.checkoutId ===
      "string"
        ? req.query.checkoutId.trim()
        : "";


    const paymentId =
      typeof req.query.paymentId ===
      "string"
        ? req.query.paymentId.trim()
        : "";


    if(
      !checkoutId &&
      !paymentId
    ){
      return res.status(400).json({
        paid:false,
        error:
          "checkoutId أو paymentId مطلوب"
      });
    }


    let query =
      auth.supabase
        .from("payments")
        .select(`
          id,
          user_id,
          resource_id,
          checkout_id,
          amount,
          currency,
          status,
          paid_at,
          updated_at
        `)
        .eq(
          "user_id",
          auth.user.id
        );


    if(checkoutId){
      query =
        query.eq(
          "checkout_id",
          checkoutId
        );
    }else{
      query =
        query.eq(
          "id",
          paymentId
        );
    }


    const {
      data:payment,
      error
    } =
      await query
        .maybeSingle();


    if(error){

      console.error(
        "payment-status:",
        error
      );

      return res.status(500).json({
        paid:false,
        error:
          "تعذر قراءة حالة الدفع"
      });
    }


    if(!payment){

      return res.status(404).json({
        paid:false,
        status:"not_found"
      });
    }


    return res.status(200).json({

      paid:
        payment.status === "paid",

      status:
        payment.status,

      paymentId:
        payment.id,

      checkoutId:
        payment.checkout_id,

      resourceId:
        payment.resource_id,

      amount:
        payment.amount,

      currency:
        payment.currency,

      paidAt:
        payment.paid_at

    });

  }catch(error){

    console.error(
      error
    );

    return res.status(500).json({
      paid:false,
      error:
        "حدث خطأ داخلي"
    });
  }
}
