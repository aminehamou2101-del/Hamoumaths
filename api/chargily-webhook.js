import crypto from "crypto";
import {
  createClient
} from "@supabase/supabase-js";

export const config = {
  api:{
    bodyParser:false
  }
};


function requiredEnv(name){

  const value =
    process.env[name];

  if(
    !value ||
    typeof value !== "string"
  ){
    throw new Error(
      `Missing ${name}`
    );
  }

  return value.trim();
}


function readRawBody(req){

  return new Promise(
    (resolve,reject)=>{

      const chunks = [];

      req.on(
        "data",
        chunk=>{
          chunks.push(
            Buffer.isBuffer(chunk)
              ? chunk
              : Buffer.from(chunk)
          );
        }
      );

      req.on(
        "end",
        ()=>{
          resolve(
            Buffer.concat(chunks)
          );
        }
      );

      req.on(
        "error",
        reject
      );

    }
  );
}


function verifySignature(
  rawBody,
  signature,
  secret
){

  if(
    typeof signature !==
    "string" ||
    !signature
  ){
    return false;
  }


  const expected =
    crypto
      .createHmac(
        "sha256",
        secret
      )
      .update(rawBody)
      .digest("hex");


  const receivedBuffer =
    Buffer.from(
      signature.trim(),
      "utf8"
    );

  const expectedBuffer =
    Buffer.from(
      expected,
      "utf8"
    );


  if(
    receivedBuffer.length !==
    expectedBuffer.length
  ){
    return false;
  }


  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  );
}


function getAdmin(){

  return createClient(
    requiredEnv(
      "SUPABASE_URL"
    ),
    requiredEnv(
      "SUPABASE_SERVICE_ROLE_KEY"
    ),
    {
      auth:{
        autoRefreshToken:false,
        persistSession:false
      }
    }
  );

}


export default async function handler(
  req,
  res
){

  if(req.method !== "POST"){

    res.setHeader(
      "Allow",
      "POST"
    );

    return res.status(405).json({
      error:
        "Method not allowed"
    });

  }


  try{

    const rawBody =
      await readRawBody(req);


    const signature =
      req.headers.signature ||
      req.headers["x-signature"];


    const secret =
      requiredEnv(
        "CHARGILY_SECRET_KEY"
      );


    if(
      !verifySignature(
        rawBody,
        signature,
        secret
      )
    ){

      return res.status(401).json({
        error:
          "Invalid signature"
      });

    }


    let event;

    try{

      event =
        JSON.parse(
          rawBody.toString(
            "utf8"
          )
        );

    }catch{

      return res.status(400).json({
        error:
          "Invalid JSON"
      });

    }


    const supabase =
      getAdmin();


    /*
     * Chargily event data.
     */

    const checkout =
      event?.data ||
      event?.checkout ||
      event;


    const checkoutId =
      checkout?.id;


    if(
      !checkoutId
    ){

      return res.status(400).json({
        error:
          "Checkout ID غير موجود"
      });

    }


    const eventType =
      event?.type ||
      event?.event ||
      "";


    /*
     * Failed payment.
     */

    if(
      eventType ===
      "checkout.failed"
    ){

      const {
        error
      } =
        await supabase
          .from("payments")
          .update({
            status:
              "failed",

            updated_at:
              new Date()
                .toISOString()
          })
          .eq(
            "checkout_id",
            String(checkoutId)
          );


      if(error){

        console.error(
          error
        );

        return res.status(500).json({
          error:
            "تعذر تحديث حالة الدفع"
        });

      }


      return res.status(200).json({
        received:true,
        status:"failed"
      });

    }


    /*
     * We only activate subscriptions
     * for paid checkout events.
     */

    if(
      eventType !==
      "checkout.paid"
    ){

      return res.status(200).json({
        received:true,
        ignored:true
      });

    }


    /*
     * Find internal payment.
     */

    const {
      data:payment,
      error:paymentError
    } =
      await supabase
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
          String(checkoutId)
        )
        .maybeSingle();


    if(paymentError){

      console.error(
        paymentError
      );

      return res.status(500).json({
        error:
          "خطأ في قاعدة البيانات"
      });

    }


    if(!payment){

      /*
       * Returning 404 makes the webhook
       * retry in some providers.
       *
       * We return 200 only when the event
       * is structurally valid but unknown.
       */

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
     * Validate amount against the resource.
     * This protects against trusting webhook
     * metadata blindly.
     */

    const {
      data:resource,
      error:resourceError
    } =
      await supabase
        .from("math_resources")
        .select(`
          id,
          is_paid,
          price,
          active
        `)
        .eq(
          "id",
          payment.resource_id
        )
        .maybeSingle();


    if(
      resourceError ||
      !resource
    ){

      console.error(
        "Webhook resource error:",
        resourceError
      );

      return res.status(500).json({
        error:
          "تعذر التحقق من المورد"
      });

    }


    const expectedAmount =
      Math.round(
        Number(
          resource.price
        )
      );


    const paymentAmount =
      Math.round(
        Number(
          payment.amount
        )
      );


    if(
      !Number.isFinite(
        expectedAmount
      ) ||
      expectedAmount <= 0 ||
      paymentAmount !==
        expectedAmount
    ){

      console.error(
        "Payment amount mismatch:",
        {
          paymentAmount,
          expectedAmount,
          resourceId:
            payment.resource_id
        }
      );


      await supabase
        .from("payments")
        .update({
          status:
            "failed",

          updated_at:
            new Date()
              .toISOString()
        })
        .eq(
          "id",
          payment.id
        );


      return res.status(400).json({
        error:
          "مبلغ الدفع غير مطابق"
      });

    }


    /*
     * Idempotency:
     * if already paid, do not create
     * another subscription.
     */

    if(
      payment.status ===
      "paid"
    ){

      const {
        data:existing
      } =
        await supabase
          .from("subscriptions")
          .select("id")
          .eq(
            "payment_id",
            payment.id
          )
          .maybeSingle();


      return res.status(200).json({
        received:true,
        paid:true,
        alreadyProcessed:true,
        subscriptionActivated:
          Boolean(existing),
        subscriptionId:
          existing?.id || null
      });

    }


    const now =
      new Date();


    const nowISO =
      now.toISOString();


    /*
     * Mark payment paid.
     */

    const {
      error:updateError
    } =
      await supabase
        .from("payments")
        .update({
          status:
            "paid",

          paid_at:
            nowISO,

          updated_at:
            nowISO
        })
        .eq(
          "id",
          payment.id
        )
        .eq(
          "status",
          "pending"
        );


    if(updateError){

      console.error(
        updateError
      );

      return res.status(500).json({
        error:
          "تعذر تحديث الدفع"
      });

    }


    /*
     * Subscription duration.
     */

    const configuredDays =
      Number(
        process.env.SUBSCRIPTION_DAYS ||
        30
      );


    const days =
      Number.isFinite(
        configuredDays
      ) &&
      configuredDays > 0
        ? Math.floor(
            configuredDays
          )
        : 30;


    const startsAt =
      now;


    const expiresAt =
      new Date(
        now.getTime() +
        days *
        24 *
        60 *
        60 *
        1000
      );


    /*
     * If an active subscription already
     * exists for this resource, do not
     * duplicate it.
     */

    const {
      data:activeSubscription,
      error:activeError
    } =
      await supabase
        .from("subscriptions")
        .select(`
          id,
          expires_at
        `)
        .eq(
          "user_id",
          payment.user_id
        )
        .eq(
          "resource_id",
          payment.resource_id
        )
        .eq(
          "status",
          "active"
        )
        .lte(
          "starts_at",
          nowISO
        )
        .or(
          `expires_at.is.null,expires_at.gt.${nowISO}`
        )
        .order(
          "expires_at",
          {
            ascending:false
          }
        )
        .limit(1)
        .maybeSingle();


    if(activeError){

      console.error(
        activeError
      );

      return res.status(500).json({
        error:
          "تعذر فحص الاشتراك"
      });

    }


    if(activeSubscription){

      /*
       * Payment is paid, but access already
       * exists. Link the payment to the
       * existing entitlement without creating
       * duplicate access.
       */

      return res.status(200).json({
        received:true,
        paid:true,
        subscriptionActivated:false,
        alreadyHadAccess:true,
        subscriptionId:
          activeSubscription.id
      });

    }


    /*
     * Create subscription.
     */

    const {
      data:subscription,
      error:subscriptionError
    } =
      await supabase
        .from("subscriptions")
        .insert({
          user_id:
            payment.user_id,

          resource_id:
            payment.resource_id,

          status:
            "active",

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


    if(subscriptionError){

      /*
       * Unique constraint means the webhook
       * was duplicated.
       */

      if(
        subscriptionError.code ===
        "23505"
      ){

        return res.status(200).json({
          received:true,
          paid:true,
          alreadyProcessed:true
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

      received:true,

      paid:true,

      subscriptionActivated:true,

      subscriptionId:
        subscription.id,

      expiresAt:
        expiresAt.toISOString()

    });


  }catch(error){

    console.error(
      "Chargily webhook:",
      error
    );

    return res.status(500).json({
      error:
        "Webhook server error"
    });

  }

}
