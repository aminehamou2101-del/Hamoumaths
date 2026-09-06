import { requireUser, json } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireUser(request, env);

  if (!auth.ok) return auth.response;

  const userId = auth.user.id;

  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/subscriptions` +
    `?user_id=eq.${encodeURIComponent(userId)}` +
    `&select=id,plan,status,current_period_start,current_period_end,provider`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization:
          `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );

  if (!response.ok) {
    return json({
      success: false,
      error: "تعذر قراءة الاشتراك"
    }, 500);
  }

  const rows = await response.json();
  const now = Date.now();

  const active = rows.filter(row =>
    row.status === "active" &&
    row.current_period_end &&
    new Date(row.current_period_end).getTime() > now
  );

  return json({
    success: true,
    premium: active.some(x => x.plan === "premium"),
    teacher_pro: active.some(x => x.plan === "teacher_pro"),
    subscriptions: active
  });
}
