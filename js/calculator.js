(function () {
  "use strict";

  let expression = "";

  const allowed =
    /^[0-9+\-*/().,%\sA-Za-zπ√^]+$/;

  function displayValue() {
    const element =
      document.querySelector("#calculatorDisplay");

    if (element) {
      element.value = expression;
    }
  }

  function normalize(input) {
    return input
      .replaceAll("π", "Math.PI")
      .replaceAll("√", "Math.sqrt")
      .replaceAll("^", "**")
      .replaceAll("sin", "Math.sin")
      .replaceAll("cos", "Math.cos")
      .replaceAll("tan", "Math.tan")
      .replaceAll("log", "Math.log10")
      .replaceAll("ln", "Math.log")
      .replaceAll("abs", "Math.abs");
  }

  function calculate() {
    if (!expression.trim()) {
      return;
    }

    if (!allowed.test(expression)) {
      throw new Error(
        "تعبير رياضي غير صالح."
      );
    }

    const normalized = normalize(expression);

    const result = Function(
      `"use strict"; return (${normalized})`
    )();

    if (
      typeof result !== "number" ||
      !Number.isFinite(result)
    ) {
      throw new Error(
        "النتيجة غير صالحة."
      );
    }

    expression = String(result);
    displayValue();
  }

  function append(value) {
    expression += value;
    displayValue();
  }

  function clear() {
    expression = "";
    displayValue();
  }

  function backspace() {
    expression = expression.slice(0, -1);
    displayValue();
  }

  window.HAMOU_CALCULATOR = {
    append,
    clear,
    backspace,
    calculate
  };

  window.HAMOU_CALC = window.HAMOU_CALCULATOR;
})();
