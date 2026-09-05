import { json } from "../../_lib/supabase.js";
import { requireUser } from "../../_lib/auth.js";

const PRICES = {
  premium:1000,
  teacher_pro:2000
};

export async function onRequestPost(context) {
  const { request, env } = context;

  const auth=await requireUser(request,env);
  if(!auth.ok)return auth.response;

  if(!env.CHARGILY_SECRET_KEY){
    return json({
      success:false,
      error:"بوابة الدفع غير مهيأة"
    },503);
  }

  let body;

  try{
    body=await request.json();
  }catch{
    return json({success:false,error:"JSON غير صالح"},400);
  }

  const product=String(body.product||"");

  if(!Object.hasOwn(PRICES,product)){
    return json({
      success:false,
      error:"منتج غير صالح"
    },400);
  }

  const amount=PRICES[product];

  const origin=new URL(request.url).origin;

  const base=env.CHARGILY_MODE==="live"
    ? "https://pay.chargily.net/api/v2"
    : "https://pay.chargily.net/test/api/v2";

  const checkoutResponse=await fetch(`${base}/checkouts`,{
    method:"POST",
    headers:{
      Authorization:`Bearer ${env.CHARGILY_SECRET_KEY}`,
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      amount,
      currency:"dzd",
      payment_method:"edahabia",
      success_url:`${origin}/?payment=success&product=${encodeURIComponent(product)}`,
      failure_url:`${origin}/?payment=failed&product=${encodeURIComponent(product)}`,
      webhook_endpoint:`${origin}/api/payment/webhook`,
      locale:"ar",
      metadata:{
        user_id:auth.user.id,
        product
      }
    })
  });

  const checkout=await checkoutResponse.json();

  if(!checkoutResponse.ok){
    return json({
      success:false,
      error:checkout.message||checkout.error||"فشل إنشاء الدفع"
    },500);
  }

  if(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY){
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/payment_transactions`,
      {
        method:"POST",
        headers:{
          apikey:env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type":"application/json",
          Prefer:"return=minimal"
        },
        body:JSON.stringify({
          user_id:auth.user.id,
          provider:"chargily",
          provider_payment_id:checkout.id,
          product,
          amount,
          currency:"DZD",
          status:"pending",
          metadata:{
            checkout_id:checkout.id
          }
        })
      }
    );
  }

  return json({
    success:true,
    checkout_url:checkout.checkout_url,
    checkout_id:checkout.id
  });
}
