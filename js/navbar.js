// =====================================================
// HAMOU MATH - SHARED NAVBAR
// =====================================================

(function () {

    function getBasePath() {

        const path = window.location.pathname;

        return path.includes("/pages/")
            ? "../"
            : "";
    }


    function renderNavbar() {

        const base = getBasePath();

        const container =
            document.getElementById("hamou-navbar");

        if (!container) return;


        container.innerHTML = `
            <header class="navbar">

                <div class="brand">
                    <a href="${base}index.html">
                        🧮 HAMOU MATH
                    </a>
                </div>

                <button
                    class="menu-btn"
                    type="button"
                    id="hamouMenuButton"
                    aria-label="فتح القائمة"
                    aria-expanded="false"
                >
                    ☰
                </button>

                <nav id="hamouNavMenu">

                    <a href="${base}index.html">
                        الرئيسية
                    </a>

                    <a href="${base}pages/library.html">
                        📚 المكتبة
                    </a>

                    <a href="${base}pages/exercises.html">
                        📝 التمارين
                    </a>

                    <a href="${base}pages/tools.html">
                        🧮 الأدوات
                    </a>

                    <a href="${base}pages/leaderboard.html">
                        🏆 الترتيب
                    </a>

                    <a href="${base}pages/achievements.html">
                        🎖️ الإنجازات
                    </a>

                    <a href="${base}pages/profile.html">
                        👤 ملفي
                    </a>

                    <a href="${base}pages/dashboard.html">
                        📊 لوحتي
                    </a>

                    <button
                        type="button"
                        id="hamouThemeButton"
                        data-theme-toggle
                        aria-label="تغيير المظهر"
                    >
                        🌙
                    </button>

                </nav>

            </header>
        `;


        // القائمة الهاتفية
        const menuButton =
            document.getElementById(
                "hamouMenuButton"
            );

        const menu =
            document.getElementById(
                "hamouNavMenu"
            );


        menuButton?.addEventListener(
            "click",
            function () {

                const active =
                    menu.classList.toggle(
                        "active"
                    );

                menuButton.setAttribute(
                    "aria-expanded",
                    String(active)
                );

            }
        );


        // الوضع الليلي
        const themeButton =
            document.getElementById(
                "hamouThemeButton"
            );


        themeButton?.addEventListener(
            "click",
            function () {

                if (
                    typeof window.toggleTheme ===
                    "function"
                ) {
                    window.toggleTheme();
                }

            }
        );

    }


    document.addEventListener(
        "DOMContentLoaded",
        renderNavbar
    );

})();
