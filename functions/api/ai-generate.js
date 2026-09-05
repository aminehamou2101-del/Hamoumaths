import { json } from "../_lib/supabase.js";
import { requireUser } from "../_lib/auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  const auth = await requireUser(request,env);
  if(!auth.ok)return auth.response;

  if(!env.OPENAI_API_KEY){
    return json({
      success:false,
      error:"خدمة الذكاء الاصطناعي غير مهيأة"
    },503);
  }

  let body;

  try{
    body=await request.json();
  }catch{
    return json({success:false,error:"JSON غير صالح"},400);
  }

  const prompt=String(body.prompt||"").trim();
  const language=String(body.language||"ar");

  if(!prompt){
    return json({success:false,error:"الطلب فارغ"},400);
  }

  const model=env.OPENAI_MODEL || "gpt-5";

  const response=await fetch(
    "https://api.openai.com/v1/responses",
    {
      method:"POST",
      headers:{
        Authorization:`Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model,
        input:[
          {
            role:"system",
            content:[
              {
                type:"input_text",
                text:
                  `You are HAMOU MATH, a professional mathematics educational assistant. Answer in language code: ${language}. Give accurate educational answers and show mathematical reasoning clearly.`
              }
            ]
          },
          {
            role:"user",
            content:[
              {
                type:"input_text",
                text:prompt
              }
            ]
          }
        ]
      })
    }
  );

  const data=await response.json();

  if(!response.ok){
    return json({
      success:false,
      error:data.error?.message || "فشل الذكاء الاصطناعي"
    },500);
  }

  const text=
    data.output_text ||
    data.output?.flatMap(x=>x.content||[])
      ?.map(x=>x.text||"").join("\n") ||
    "";

  return json({
    success:true,
    text
  });
}
