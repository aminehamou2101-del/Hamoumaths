import { json } from "../../_lib/supabase.js";
import { requireUser } from "../../_lib/auth.js";

export async function onRequestGet(context) {
  const result = await requireUser(context.request,context.env);

  if(!result.ok)return result.response;

  return json({
    success:true,
    user:result.user
  });
}
