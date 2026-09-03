export function GET() {
  return new Response(
    JSON.stringify({
      success: true,
      message: "HAMOU MATH API يعمل بنجاح"
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
