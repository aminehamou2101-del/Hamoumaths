import { json } from "../_lib/supabase.js";
import { requireUser } from "../_lib/auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  const auth=await requireUser(request,env);
  if(!auth.ok)return auth.response;

  if(!env.OPENAI_API_KEY){
    return json({
      success:false,
      error:"خدمة حل الصور غير مهيأة"
    },503);
  }

  let body;

  try{
    body=await request.json();
  }catch{
    return json({success:false,error:"JSON غير صالح"},400);
  }

  const image=String(body.image||"");
  const language=String(body.language||"ar");

  if(!image.startsWith("data:image/")){
    return json({
      success:false,
      error:"صورة غير صالحة"
    },400);
  }

  if(image.length>12_000_000){
    return json({
      success:false,
      error:"الصورة كبيرة جدًا"
    },413);
  }

  const model=env.OPENAI_VISION_MODEL || env.OPENAI_MODEL || "gpt-5";

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
            role:"user",
            content:[
              {
                type:"input_text",
                text:
                  `Solve the mathematics problem in the image accurately. Explain every step. Answer in language ${language}. If the image is unclear, explicitly say what cannot be read.`
              },
              {
                type:"input_image",
                image_url:image
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
      error:data.error?.message || "فشل تحليل الصورة"
    },500);
  }

  const solution=data.output_text||"لم يتم استخراج حل.";

  return json({
    success:true,
    solution
  });
}
