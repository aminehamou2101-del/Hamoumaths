import { requireUser } from "../../../_lib/auth.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  const auth = await requireUser(request, env);

  if (!auth.ok) {
    return auth.response;
  }

  const userId = auth.user.id;

  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(
      userId
    )}&status=eq.active&select=id,plan,status,current_period_start,current_period_end,provider`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );

  if (!response.ok) {
    return Response.json(
      {
        success: false,
        error: "تعذر الحصول على حالة الاشتراك"
      },
      { status: 500 }
    );
  }

  const subscriptions = await response.json();

  const now = Date.now();

  const activeSubscriptions = subscriptions.filter((subscription) => {
    if (!subscription.current_period_end) return false;

    return (
      new Date(subscription.current_period_end).getTime() > now
    );
  });

  return Response.json({
    success: true,

    premium: activeSubscriptions.some(
      (s) => s.plan === "premium"
    ),

    teacher_pro: activeSubscriptions.some(
      (s) => s.plan === "teacher_pro"
    ),

    subscriptions: activeSubscriptions
  });
}
