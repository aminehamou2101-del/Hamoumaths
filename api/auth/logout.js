export async function onRequestPost() {
  return Response.json({
    success: true,
    message: "تم تسجيل الخروج"
  });
}
