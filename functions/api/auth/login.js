import { json } from "../../_lib/supabase.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return json({
        success:false,
        error:"البريد وكلمة المرور مطلوبان"
      },400);
    }

    const response = await fetch(
      `${env.SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method:"POST",
        headers:{
          apikey:env.SUPABASE_ANON_KEY,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({email,password})
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return json({
        success:false,
        error:data.error_description || data.msg || "بيانات الدخول غير صحيحة"
      },401);
    }

    return json({
      success:true,
      access_token:data.access_token,
      refresh_token:data.refresh_token,
      expires_in:data.expires_in,
      user:data.user
    });
  } catch {
    return json({success:false,error:"طلب غير صالح"},400);
  }
}
