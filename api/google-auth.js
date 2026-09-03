export function GET() {
  return new Response(
    JSON.stringify({
      success: true,
      message: "HAMOU MATH API يعمل بنجاح",
      route: "/api/google-auth"
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      }
    }
  );
}
