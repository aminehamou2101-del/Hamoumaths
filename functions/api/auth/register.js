import { json, supabaseFetch } from "../../_lib/supabase.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullName = String(body.full_name || "").trim();

    if (!email || password.length < 6) {
      return json({
        success:false,
        error:"البريد الإلكتروني وكلمة المرور غير صالحين"
      },400);
    }

    const response = await fetch(`${env.SUPABASE_URL}/auth/v1/signup`, {
      method:"POST",
      headers:{
        apikey:env.SUPABASE_ANON_KEY,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        email,
        password,
        data:{full_name:fullName}
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return json({
        success:false,
        error:data.msg || data.message || data.error_description || "فشل التسجيل"
      },400);
    }

    return json({
      success:true,
      user:data.user || null,
      access_token:data.access_token || null,
      message:data.access_token
        ?"تم إنشاء الحساب"
        :"تم إنشاء الحساب. تحقق من بريدك الإلكتروني."
    });
  } catch {
    return json({success:false,error:"طلب غير صالح"},400);
  }
}
