import { getUser, json } from "../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const auth = await getUser(request, env);

  if (!auth.ok) return auth.response;

  if (!env.OPENAI_API_KEY) {
    return json({
      success: false,
      error: "خدمة AI غير مهيأة"
    }, 500);
  }

  try {
    const body = await request.json();

    const prompt = String(body.prompt || "").trim();

    if (!prompt) {
      return json({
        success: false,
        error: "أدخل السؤال أولًا"
      }, 400);
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Authorization":
            `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-5.6-luna",
          input: [
            {
              role: "system",
              content:
                "أنت HAMOU AI، مساعد رياضيات تعليمي. اشرح الحل خطوة بخطوة وبوضوح."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return json({
        success: false,
        error: "تعذر الاتصال بخدمة AI"
      }, 502);
    }

    const text =
      data.output_text ||
      data.output?.flatMap(x => x.content || [])
        ?.map(x => x.text || "")
        ?.join("") ||
      "";

    return json({
      success: true,
      answer: text
    });
  } catch {
    return json({
      success: false,
      error: "حدث خطأ أثناء توليد الإجابة"
    }, 500);
  }
}
