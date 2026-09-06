(function () {
  "use strict";

  function toast(message) {
    const element =
      document.querySelector("#toast");

    if (!element) {
      return;
    }

    element.textContent = message;
    element.classList.add("show");

    clearTimeout(
      window.__hamouToastTimer
    );

    window.__hamouToastTimer =
      setTimeout(() => {
        element.classList.remove(
          "show"
        );
      }, 2600);
  }

  function toggleTheme() {
    const dark =
      document.documentElement.classList.toggle(
        "dark"
      );

    localStorage.setItem(
      "hamou_theme",
      dark ? "dark" : "light"
    );
  }

  function loadTheme() {
    const theme =
      localStorage.getItem(
        "hamou_theme"
      );

    if (theme === "dark") {
      document.documentElement.classList.add(
        "dark"
      );
    }
  }

  function goTo(id) {
    const element =
      document.querySelector(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth"
      });
    }
  }

  function updateAuthUI(event) {
    const state =
      event?.detail ||
      window.HAMOU_AUTH_STATE ||
      {};

    document
      .querySelectorAll(
        "[data-auth-user]"
      )
      .forEach((element) => {
        element.textContent =
          state.profile?.full_name ||
          state.user?.email ||
          "زائر";
      });

    document
      .querySelectorAll(
        "[data-owner-only]"
      )
      .forEach((element) => {
        element.classList.toggle(
          "hidden",
          !state.isOwner
        );
      });

    document
      .querySelectorAll(
        "[data-logged-in]"
      )
      .forEach((element) => {
        element.classList.toggle(
          "hidden",
          !state.isLoggedIn
        );
      });

    document
      .querySelectorAll(
        "[data-logged-out]"
      )
      .forEach((element) => {
        element.classList.toggle(
          "hidden",
          state.isLoggedIn
        );
      });
  }

  function bind() {
    document
      .querySelectorAll(
        "[data-theme-toggle]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          toggleTheme
        );
      });

    document
      .querySelectorAll(
        "[data-scroll]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () =>
            goTo(
              button.dataset.scroll
            )
        );
      });

    document
      .querySelectorAll(
        "[data-language]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            window.HAMOU_I18N?.setLanguage(
              button.dataset.language
            );
          }
        );
      });
  }

  window.HAMOU_APP = {
    toast,
    goTo,
    toggleTheme
  };

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      loadTheme();
      bind();
      updateAuthUI();
    }
  );

  window.addEventListener(
    "hamou:auth",
    updateAuthUI
  );
})();
