import { json } from "../../_lib/supabase.js";

async function hmacSHA256(secret,message){
  const key=await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {name:"HMAC",hash:"SHA-256"},
    false,
    ["sign"]
  );

  const signature=await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );

  return [...new Uint8Array(signature)]
    .map(b=>b.toString(16).padStart(2,"0"))
    .join("");
}

function constantTimeEqual(a,b){
  if(!a||!b||a.length!==b.length)return false;

  let result=0;

  for(let i=0;i<a.length;i++){
    result|=a.charCodeAt(i)^b.charCodeAt(i);
  }

  return result===0;
}

export async function onRequestPost(context){
  const {request,env}=context;

  if(!env.CHARGILY_SECRET_KEY){
    return json({success:false,error:"Secret missing"},500);
  }

  const raw=await request.text();

  const signature=
    request.headers.get("signature")||
    request.headers.get("x-signature")||
    "";

  const expected=await hmacSHA256(
    env.CHARGILY_SECRET_KEY,
    raw
  );

  if(!constantTimeEqual(
    signature.toLowerCase(),
    expected.toLowerCase()
  )){
    return json({
      success:false,
      error:"Invalid signature"
    },401);
  }

  let event;

  try{
    event=JSON.parse(raw);
  }catch{
    return json({success:false,error:"Invalid JSON"},400);
  }

  const type=event.type||event.event;
  const checkout=event.data||event.checkout||event;

  const metadata=checkout.metadata||{};
  const userId=metadata.user_id;
  const product=metadata.product;

  if(!userId||!product){
    return json({success:true,ignored:true});
  }

  if(!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY){
    return json({success:false,error:"Supabase missing"},500);
  }

  const paymentId=checkout.id;

  if(type==="checkout.paid"){
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/payment_transactions?provider_payment_id=eq.${encodeURIComponent(paymentId)}`,
      {
        method:"PATCH",
        headers:{
          apikey:env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          status:"paid"
        })
      }
    );

    const start=new Date();
    const end=new Date(start.getTime()+30*24*60*60*1000);

    await fetch(
      `${env.SUPABASE_URL}/rest/v1/subscriptions`,
      {
        method:"POST",
        headers:{
          apikey:env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type":"application/json",
          Prefer:"resolution=merge-duplicates"
        },
        body:JSON.stringify({
          user_id:userId,
          plan:product,
          provider:"chargily",
          status:"active",
          current_period_start:start.toISOString(),
          current_period_end:end.toISOString()
        })
      }
    );
  }

  if(type==="checkout.failed" || type==="checkout.canceled"){
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/payment_transactions?provider_payment_id=eq.${encodeURIComponent(paymentId)}`,
      {
        method:"PATCH",
        headers:{
          apikey:env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          status:type==="checkout.failed"?"failed":"cancelled"
        })
      }
    );
  }

  return json({
    success:true
  });
}
