import { getUser, json } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const auth = await getUser(request, env);

  if (!auth.ok) return auth.response;

  if (!env.OPENAI_API_KEY) {
    return json({
      success: false,
      error: "خدمة حل الصور غير مهيأة"
    }, 500);
  }

  try {
    const body = await request.json();

    const image = String(body.image || "").trim();

    if (!image) {
      return json({
        success: false,
        error: "لم يتم إرسال الصورة"
      }, 400);
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-5.6-luna",
          input: [{
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "اقرأ التمرين الرياضي الموجود في الصورة وحله خطوة بخطوة، مع شرح واضح."
              },
              {
                type: "input_image",
                image_url: image
              }
            ]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return json({
        success: false,
        error: "تعذر تحليل الصورة"
      }, 502);
    }

    return json({
      success: true,
      answer: data.output_text || ""
    });
  } catch {
    return json({
      success: false,
      error: "خطأ أثناء معالجة الصورة"
    }, 500);
  }
}
