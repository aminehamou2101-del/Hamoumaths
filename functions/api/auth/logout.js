import { json } from "../../_lib/supabase.js";

export async function onRequestPost() {
  return json({
    success:true,
    message:"تم تسجيل الخروج"
  });
}
