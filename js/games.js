(function () {
  "use strict";

  let score = 0;
  let answer = 0;

  function newQuestion() {
    const a =
      Math.floor(
        Math.random() * 20
      ) + 1;

    const b =
      Math.floor(
        Math.random() * 20
      ) + 1;

    answer = a + b;

    const question =
      document.querySelector(
        "#gameQuestion"
      );

    const input =
      document.querySelector(
        "#gameAnswer"
      );

    if (question) {
      question.textContent =
        `${a} + ${b} = ؟`;
    }

    if (input) {
      input.value = "";
      input.focus();
    }
  }

  function submit() {
    const input =
      document.querySelector(
        "#gameAnswer"
      );

    if (!input) {
      return;
    }

    const value =
      Number(input.value);

    if (value === answer) {
      score += 10;

      showMessage(
        `إجابة صحيحة! +10 XP — المجموع ${score}`
      );

      newQuestion();
    } else {
      showMessage(
        "إجابة غير صحيحة، حاول مرة أخرى."
      );
    }
  }

  function showMessage(message) {
    if (
      typeof window.HAMOU_APP?.toast ===
      "function"
    ) {
      window.HAMOU_APP.toast(message);
    } else {
      alert(message);
    }
  }

  window.HAMOU_GAMES = {
    newQuestion,
    submit,
    get score() {
      return score;
    }
  };

  document.addEventListener(
    "DOMContentLoaded",
    newQuestion
  );
})();
