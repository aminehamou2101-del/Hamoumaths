export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      success: true,
      service: "HAMOU MATH GLOBAL",
      status: "online"
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=UTF-8"
      }
    }
  );
}
