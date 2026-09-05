import { json } from "../../_lib/supabase.js";
import { requireUser } from "../../_lib/auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  const auth=await requireUser(request,env);
  if(!auth.ok)return auth.response;

  if(!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY){
    return json({
      success:false,
      error:"Supabase غير مهيأ"
    },500);
  }

  const response=await fetch(
    `${env.SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(auth.user.id)}&select=id,plan,status,current_period_start,current_period_end,provider`,
    {
      headers:{
        apikey:env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );

  if(!response.ok){
    return json({
      success:false,
      error:"تعذر الحصول على الاشتراك"
    },500);
  }

  const subscriptions=await response.json();
  const now=Date.now();

  const active=subscriptions.filter(s=>
    s.status==="active" &&
    s.current_period_end &&
    new Date(s.current_period_end).getTime()>now
  );

  return json({
    success:true,
    premium:active.some(s=>s.plan==="premium"),
    teacher_pro:active.some(s=>s.plan==="teacher_pro"),
    subscriptions:active
  });
}
