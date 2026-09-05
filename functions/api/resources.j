import { json } from "../_lib/supabase.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({
      success:false,
      error:"Supabase غير مهيأ"
    },500);
  }

  const url = new URL(request.url);
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit") || 24),1),
    100
  );

  const q = url.searchParams.get("q") || "";

  let path =
    `/rest/v1/resources?select=*&order=created_at.desc&limit=${limit}`;

  if(q){
    path += `&title=ilike.*${encodeURIComponent(q)}*`;
  }

  const response = await fetch(env.SUPABASE_URL + path,{
    headers:{
      apikey:env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  if(!response.ok){
    return json({
      success:false,
      error:"تعذر تحميل الموارد"
    },500);
  }

  const resources = await response.json();

  return json({
    success:true,
    resources
  });
}
