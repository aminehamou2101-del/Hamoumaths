export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const {
      language,
      level,
      difficulty,
      topic,
      count,
      type
    } = req.body || {};

    if (!topic) {
      return res.status(400).json({
        error: "Topic is required"
      });
    }

    const safeCount = Math.min(
      Math.max(Number(count) || 5, 1),
      50
    );

    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        error:
          "OPENAI_API_KEY is not configured"
      });
    }

    const model =
      process.env.OPENAI_MODEL ||
      "gpt-5.6-luna";

    const prompt = `
You are HAMOU MATH AI,
an expert mathematics teacher.

Create ${safeCount} ${type || "exercises"}.

Language:
${language || "Arabic"}

Level:
${level || "Secondary"}

Difficulty:
${difficulty || "Medium"}

Topic:
${topic}

Requirements:

1. Mathematical correctness.
2. Clear educational wording.
3. Suitable difficulty.
4. Number every question.
5. Give complete solutions when requested.
6. Use Unicode mathematical symbols when appropriate.
7. Do not invent sources.
8. Respect the requested language.
9. For an exam, structure it professionally.
10. Return clean text suitable for a web page.
`;

    const response =
      await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            "Authorization":
              `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            input: prompt
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      return res.status(
        response.status
      ).json({
        error:
          data?.error?.message ||
          "AI provider error"
      });

    }

    const text =
      data.output_text ||
      "";

    return res.status(200).json({
      ok: true,
      text,
      model
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        "Internal AI server error"
    });

  }

}
