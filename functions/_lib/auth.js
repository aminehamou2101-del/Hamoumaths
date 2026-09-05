import { json, supabaseFetch } from "./supabase.js";

export function getBearer(request) {
  const value = request.headers.get("Authorization") || "";
  if (!value.startsWith("Bearer ")) return null;
  return value.slice(7).trim() || null;
}

export async function getUser(request, env) {
  const token = getBearer(request);

  if (!token) {
    return { user: null, token: null };
  }

  const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    return { user: null, token };
  }

  return {
    user: await response.json(),
    token
  };
}

export async function requireUser(request, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return {
      ok: false,
      response: json({success:false,error:"Supabase غير مهيأ"},500)
    };
  }

  const result = await getUser(request, env);

  if (!result.user) {
    return {
      ok:false,
      response:json({success:false,error:"يجب تسجيل الدخول"},401)
    };
  }

  return {
    ok:true,
    user:result.user,
    token:result.token
  };
}

export async function requireOwner(request, env) {
  const auth = await requireUser(request, env);
  if (!auth.ok) return auth;

  const response = await supabaseFetch(
    env,
    `/rest/v1/profiles?id=eq.${encodeURIComponent(auth.user.id)}&select=id,role`,
    {},
    true
  );

  if (!response.ok) {
    return {
      ok:false,
      response:json({success:false,error:"تعذر التحقق من الصلاحيات"},500)
    };
  }

  const profiles = await response.json();
  const profile = profiles[0];

  if (!profile || !["owner","admin"].includes(profile.role)) {
    return {
      ok:false,
      response:json({success:false,error:"غير مصرح"},403)
    };
  }

  return {...auth,profile};
}
