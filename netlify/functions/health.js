import { createClient } from "@supabase/supabase-js";

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

  const url = String(process.env.SUPABASE_URL || "").trim();

  const key = String(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      ""
  ).trim();

  const result = {
    ok: true,
    service: "HAMOU MATH",
    platform: "Netlify",
    timestamp: new Date().toISOString(),
    supabase: false,
  };

  if (url && key) {
    try {
      const supabase = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const { error } = await supabase
        .from("resources")
        .select("id")
        .limit(1);

      if (!error) {
        result.supabase = true;
      } else {
        result.supabase_error = error.message;
      }
    } catch (error) {
      result.supabase_error = error.message;
    }
  } else {
    result.supabase_error =
      "Supabase environment variables are missing";
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(result),
  };
}
