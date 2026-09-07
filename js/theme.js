(function () {
    "use strict";

    const STORAGE_KEY = "hamou-theme";

    function getTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved === "dark" || saved === "light") {
            return saved;
        }

        return window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }

    function applyTheme(theme) {
        const root = document.documentElement;

        root.dataset.theme = theme;

        root.classList.toggle(
            "dark",
            theme === "dark"
        );

        document.body?.classList.toggle(
            "dark-mode",
            theme === "dark"
        );

        localStorage.setItem(
            STORAGE_KEY,
            theme
        );

        updateButtons(theme);
    }

    function updateButtons(theme) {
        const icon =
            theme === "dark" ? "☀️" : "🌙";

        const text =
            theme === "dark"
                ? "الوضع النهاري"
                : "الوضع الليلي";

        document
            .querySelectorAll(
                "[data-theme-toggle]"
            )
            .forEach(button => {
                button.textContent = icon;
                button.title = text;
                button.setAttribute(
                    "aria-label",
                    text
                );
            });
    }

    function toggleTheme() {
        const current =
            document.documentElement.dataset.theme ||
            getTheme();

        applyTheme(
            current === "dark"
                ? "light"
                : "dark"
        );
    }

    window.toggleTheme = toggleTheme;
    window.applyHamouTheme = applyTheme;

    /*
     * نطبّق الوضع قبل اكتمال تحميل الصفحة
     * لتقليل وميض الصفحة.
     */
    applyTheme(getTheme());

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            document
                .querySelectorAll(
                    "[data-theme-toggle]"
                )
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        toggleTheme
                    );

                });

            updateButtons(
                document.documentElement.dataset.theme
            );
        }
    );
})();
