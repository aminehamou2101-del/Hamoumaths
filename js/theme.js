// =====================================================
// HAMOU MATH
// THEME + NAVIGATION
// =====================================================

(function () {

    const savedTheme =
        localStorage.getItem("hamou-theme") || "light";

    document.documentElement.dataset.theme = savedTheme;

    function updateThemeButton() {

        const buttons =
            document.querySelectorAll("[data-theme-toggle]");

        buttons.forEach(button => {
            button.textContent =
                document.documentElement.dataset.theme === "dark"
                    ? "☀️"
                    : "🌙";
        });
    }

    window.toggleTheme = function () {

        const current =
            document.documentElement.dataset.theme;

        const next =
            current === "dark"
                ? "light"
                : "dark";

        document.documentElement.dataset.theme = next;

        localStorage.setItem(
            "hamou-theme",
            next
        );

        updateThemeButton();
    };

    document.addEventListener(
        "DOMContentLoaded",
        updateThemeButton
    );

})();
