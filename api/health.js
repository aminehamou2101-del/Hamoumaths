export async function onRequest(context) {
  return new Response(
    JSON.stringify({
      success: true,
      service: "HAMOU MATH GLOBAL",
      status: "online",
      runtime: "cloudflare-pages",
      version: "1.0.0"
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=UTF-8",
        "cache-control": "no-store"
      }
    }
  );
}
