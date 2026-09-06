export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        ok: false,
        error: "Method not allowed",
      }),
    };
  }

  const envKeys = Object.keys(process.env)
    .filter((key) => key.startsWith("SUPABASE_"))
    .sort();

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify({
      ok: true,
      service: "HAMOU MATH",
      platform: "Netlify",
      timestamp: new Date().toISOString(),

      diagnostics: {
        hasUrl: Boolean(process.env.SUPABASE_URL),
        hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY),
        hasServiceRoleKey: Boolean(
          process.env.SUPABASE_SERVICE_ROLE_KEY
        ),
        detectedSupabaseVariables: envKeys,
      },
    }),
  };
}
