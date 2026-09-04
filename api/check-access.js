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
      allowed:false,
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
        allowed:false,
        error:auth.error
      });
    }


    const resourceId =
      typeof req.query.resourceId ===
      "string"
        ? req.query.resourceId.trim()
        : "";


    if(
      !resourceId ||
      resourceId.length > 200
    ){
      return res.status(400).json({
        allowed:false,
        error:
          "resourceId مطلوب"
      });
    }


    /*
     * المورد المجاني يسمح به مباشرة.
     */

    const {
      data:resource,
      error:resourceError
    } =
      await auth.supabase
        .from("math_resources")
        .select(`
          id,
          is_paid,
          active
        `)
        .eq(
          "id",
          resourceId
        )
        .maybeSingle();


    if(resourceError){

      console.error(
        resourceError
      );

      return res.status(500).json({
        allowed:false,
        error:
          "تعذر التحقق من المورد"
      });
    }


    if(!resource){

      return res.status(404).json({
        allowed:false,
        error:
          "المورد غير موجود"
      });
    }


    if(
      resource.active === false
    ){

      return res.status(403).json({
        allowed:false,
        error:
          "المورد غير متاح"
      });

    }


    if(
      resource.is_paid !== true
    ){

      return res.status(200).json({
        allowed:true,
        status:"free"
      });

    }


    const now =
      new Date().toISOString();


    const {
      data:subscription,
      error
    } =
      await auth.supabase
        .from("subscriptions")
        .select(`
          id,
          status,
          starts_at,
          expires_at,
          resource_id,
          payment_id
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


    if(error){

      console.error(
        "Access:",
        error
      );

      return res.status(500).json({
        allowed:false,
        error:
          "تعذر التحقق من الاشتراك"
      });
    }


    if(!subscription){

      return res.status(200).json({
        allowed:false,
        status:
          "not_subscribed"
      });

    }


    return res.status(200).json({

      allowed:true,

      status:"active",

      subscriptionId:
        subscription.id,

      resourceId:
        subscription.resource_id,

      paymentId:
        subscription.payment_id,

      expiresAt:
        subscription.expires_at

    });

  }catch(error){

    console.error(
      "check-access:",
      error
    );

    return res.status(500).json({
      allowed:false,
      error:
        "حدث خطأ داخلي في الخادم"
    });

  }
}
