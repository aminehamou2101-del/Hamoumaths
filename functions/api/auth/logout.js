import { json } from "../../_lib/auth.js";

export async function onRequestPost() {
  return json({
    success: true,
    message: "تم تسجيل الخروج"
  });
}
