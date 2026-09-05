export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      ...extra
    }
  });
}

export function supabaseHeaders(env, admin = false) {
  const key = admin
    ? env.SUPABASE_SERVICE_ROLE_KEY
    : env.SUPABASE_ANON_KEY;

  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json"
  };
}

export async function supabaseFetch(env, path, options = {}, admin = false) {
  return fetch(`${env.SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      ...supabaseHeaders(env, admin),
      ...(options.headers || {})
    }
  });
}
