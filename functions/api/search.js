import { json } from "../_lib/supabase.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();

  if(!q){
    return json({success:true,results:[]});
  }

  if(!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY){
    return json({success:false,error:"Supabase غير مهيأ"},500);
  }

  const path =
    `/rest/v1/resources?select=*&or=(title.ilike.*${encodeURIComponent(q)}*,description.ilike.*${encodeURIComponent(q)}*)&limit=50`;

  const response = await fetch(env.SUPABASE_URL + path,{
    headers:{
      apikey:env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });

  if(!response.ok){
    return json({success:false,error:"فشل البحث"},500);
  }

  return json({
    success:true,
    results:await response.json()
  });
}
