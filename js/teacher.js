(function () {
  "use strict";

  async function loadDashboard() {
    const state =
      window.HAMOU_AUTH_STATE;

    if (!state?.isLoggedIn) {
      return;
    }

    const role =
      state.profile?.role;

    const teacherRoles = [
      "teacher",
      "admin",
      "owner"
    ];

    if (!teacherRoles.includes(role)) {
      return;
    }

    document
      .querySelectorAll(
        "[data-teacher-only]"
      )
      .forEach((element) => {
        element.classList.remove(
          "hidden"
        );
      });
  }

  function generateDocument(type) {
    const title =
      document.querySelector(
        "#teacherTitle"
      )?.value || "";

    const level =
      document.querySelector(
        "#teacherLevel"
      )?.value || "";

    const output =
      document.querySelector(
        "#teacherOutput"
      );

    if (!output) {
      return;
    }

    output.textContent =
      `نوع الوثيقة: ${type}\n` +
      `العنوان: ${title}\n` +
      `المستوى: ${level}\n\n` +
      `سيتم إنشاء المحتوى عبر خدمة HAMOU MATH AI عند ربط مفتاح الخادم.`;
  }

  window.HAMOU_TEACHER = {
    loadDashboard,
    generateDocument
  };

  window.addEventListener(
    "hamou:auth",
    loadDashboard
  );
})();
