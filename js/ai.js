(function () {
  "use strict";

  async function solveText() {
    const input =
      document.querySelector(
        "#aiQuestion"
      );

    const output =
      document.querySelector(
        "#aiOutput"
      );

    if (!input || !output) {
      return;
    }

    const question =
      input.value.trim();

    if (!question) {
      output.textContent =
        "اكتب التمرين أولًا.";
      return;
    }

    output.textContent =
      "جاري تحليل التمرين...";

    try {
      const response =
        await fetch(
          "/api/ai-generate",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify({
              prompt: question,
              mode: "solve"
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "تعذر الاتصال بخدمة الذكاء الاصطناعي."
        );
      }

      output.textContent =
        data.answer ||
        data.result ||
        "لم يتم الحصول على نتيجة.";
    } catch (error) {
      console.error(error);

      output.textContent =
        "تعذر تنفيذ الحل الآن. تأكد من إعداد API الخاص بالذكاء الاصطناعي.";
    }
  }

  window.HAMOU_AI = {
    solveText
  };
})();
