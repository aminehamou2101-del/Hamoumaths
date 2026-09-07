// =====================================================
// HAMOU MATH - SHARED NAVBAR
// =====================================================

(function () {
    "use strict";

    function getBasePath() {
        return window.location.pathname.includes("/pages/")
            ? "../"
            : "";
    }

    function createLink(base, href, text) {
        return `
            <a href="${base}${href}">
                ${text}
            </a>
        `;
    }

    async function getProfile() {
        try {
            if (
                typeof window.getProfile === "function"
            ) {
                return await window.getProfile();
            }

            if (
                typeof supabaseClient === "undefined"
            ) {
                return null;
            }

            const {
                data: { user }
            } = await supabaseClient.auth.getUser();

            if (!user) {
                return null;
            }

            const {
                data,
                error
            } = await supabaseClient
                .from("profiles")
                .select("id, full_name, role")
                .eq("id", user.id)
                .single();

            if (error) {
                console.error(
                    "Navbar profile error:",
                    error
                );

                return null;
            }

            return data;
        } catch (error) {
            console.error(
                "Navbar profile error:",
                error
            );

            return null;
        }
    }

    function renderNavbar(profile) {

        const container =
            document.getElementById(
                "hamou-navbar"
            );

        if (!container) {
            return;
        }

        const base =
            getBasePath();

        const role =
            profile?.role || null;

        let roleLinks = "";

        if (
            role === "teacher" ||
            role === "admin" ||
            role === "owner"
        ) {
            roleLinks += createLink(
                base,
                "pages/teacher.html",
                "👨‍🏫 لوحة الأستاذ"
            );
        }

        if (
            role === "admin" ||
            role === "owner"
        ) {
            roleLinks += createLink(
                base,
                "pages/content-review.html",
                "🛡️ مراجعة المحتوى"
            );
        }

        if (role === "owner") {
            roleLinks += createLink(
                base,
                "pages/curriculum-admin.html",
                "👑 إدارة المنهاج"
            );

            roleLinks += createLink(
                base,
                "pages/admin.html",
                "⚙️ الإدارة"
            );
        }

        container.innerHTML = `
            <style>
                .hamou-navbar {
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                    background: rgba(255,255,255,.95);
                    backdrop-filter: blur(12px);
                    border-bottom: 1px solid #dbe5f1;
                    box-shadow:
                        0 5px 20px rgba(8,43,92,.06);
                }

                .hamou-navbar-inner {
                    width: min(1400px, 94%);
                    min-height: 70px;
                    margin: auto;

                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                }

                .hamou-brand {
                    display: flex;
                    align-items: center;
                    gap: 10px;

                    color: #082b5c;
                    font-size: 19px;
                    font-weight: 900;

                    white-space: nowrap;
                }

                .hamou-brand-mark {
                    width: 42px;
                    height: 42px;

                    display: grid;
                    place-items: center;

                    border-radius: 13px;

                    color: white;

                    background:
                        linear-gradient(
                            135deg,
                            #082b5c,
                            #1565c0,
                            #00bcd4
                        );

                    box-shadow:
                        0 8px 20px
                        rgba(21,101,192,.22);
                }

                .hamou-nav {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .hamou-nav a,
                .hamou-nav button {
                    border: 0;
                    background: transparent;

                    color: #334155;

                    padding:
                        9px 11px;

                    border-radius: 10px;

                    font: inherit;
                    font-size: 13px;
                    font-weight: 700;

                    cursor: pointer;

                    white-space: nowrap;
                }

                .hamou-nav a:hover,
                .hamou-nav button:hover {
                    background: #edf5ff;
                    color: #1565c0;
                }

                .hamou-menu-button {
                    display: none;

                    width: 44px;
                    height: 44px;

                    border: 0;
                    border-radius: 12px;

                    background: #edf5ff;
                    color: #082b5c;

                    font-size: 22px;
                    cursor: pointer;
                }

                .hamou-mobile-panel {
                    display: none;
                    width: min(1400px, 94%);
                    margin: auto;
                    padding-bottom: 14px;
                }

                .hamou-mobile-panel a,
                .hamou-mobile-panel button {
                    display: block;
                    width: 100%;

                    border: 0;

                    background: #f8fbff;

                    color: #172033;

                    padding: 12px;

                    margin-top: 7px;

                    border-radius: 11px;

                    text-align: right;

                    font: inherit;
                    font-weight: 700;
                }

                @media (max-width: 1000px) {

                    .hamou-nav {
                        display: none;
                    }

                    .hamou-menu-button {
                        display: block;
                    }

                    .hamou-mobile-panel.active {
                        display: block;
                    }
                }

                @media (max-width: 500px) {

                    .hamou-navbar-inner {
                        min-height: 62px;
                    }

                    .hamou-brand {
                        font-size: 16px;
                    }

                    .hamou-brand-mark {
                        width: 38px;
                        height: 38px;
                    }
                }
            </style>

            <div class="hamou-navbar">

                <div class="hamou-navbar-inner">

                    <a
                        class="hamou-brand"
                        href="${base}index.html"
                    >
                        <span class="hamou-brand-mark">
                            ∑
                        </span>

                        <span>
                            HAMOU MATH
                        </span>
                    </a>

                    <nav class="hamou-nav">

                        ${createLink(
                            base,
                            "index.html",
                            "الرئيسية"
                        )}

                        ${createLink(
                            base,
                            "pages/levels.html",
                            "🎓 المستويات"
                        )}

                        ${createLink(
                            base,
                            "pages/curriculum.html",
                            "📚 المنهاج"
                        )}

                        ${createLink(
                            base,
                            "pages/library.html",
                            "📖 المكتبة"
                        )}

                        ${createLink(
                            base,
                            "pages/exercises.html",
                            "📝 التمارين"
                        )}

                        ${createLink(
                            base,
                            "pages/tools.html",
                            "🧮 الأدوات"
                        )}

                        ${createLink(
                            base,
                            "pages/bac.html",
                            "🎯 البكالوريا"
                        )}

                        ${createLink(
                            base,
                            "pages/leaderboard.html",
                            "🏆 الترتيب"
                        )}

                        ${createLink(
                            base,
                            "pages/achievements.html",
                            "🎖️ الإنجازات"
                        )}

                        ${createLink(
                            base,
                            "pages/search.html",
                            "🔎 البحث"
                        )}

                        ${createLink(
                            base,
                            "pages/dashboard.html",
                            "📊 لوحتي"
                        )}

                        ${roleLinks}

                        <button
                            type="button"
                            id="hamouThemeButton"
                            aria-label="تغيير المظهر"
                        >
                            🌙
                        </button>

                    </nav>

                    <button
                        type="button"
                        class="hamou-menu-button"
                        id="hamouMenuButton"
                        aria-label="فتح القائمة"
                        aria-expanded="false"
                    >
                        ☰
                    </button>

                </div>

                <div
                    id="hamouMobilePanel"
                    class="hamou-mobile-panel"
                >

                    ${createLink(
                        base,
                        "index.html",
                        "الرئيسية"
                    )}

                    ${createLink(
                        base,
                        "pages/levels.html",
                        "🎓 المستويات"
                    )}

                    ${createLink(
                        base,
                        "pages/curriculum.html",
                        "📚 المنهاج"
                    )}

                    ${createLink(
                        base,
                        "pages/library.html",
                        "📖 المكتبة"
                    )}

                    ${createLink(
                        base,
                        "pages/exercises.html",
                        "📝 التمارين"
                    )}

                    ${createLink(
                        base,
                        "pages/tools.html",
                        "🧮 الأدوات"
                    )}

                    ${createLink(
                        base,
                        "pages/bac.html",
                        "🎯 البكالوريا"
                    )}

                    ${createLink(
                        base,
                        "pages/leaderboard.html",
                        "🏆 الترتيب"
                    )}

                    ${createLink(
                        base,
                        "pages/achievements.html",
                        "🎖️ الإنجازات"
                    )}

                    ${createLink(
                        base,
                        "pages/search.html",
                        "🔎 البحث"
                    )}

                    ${createLink(
                        base,
                        "pages/profile.html",
                        "👤 الملف الشخصي"
                    )}

                    ${createLink(
                        base,
                        "pages/dashboard.html",
                        "📊 لوحتي"
                    )}

                    ${roleLinks}

                    <button
                        type="button"
                        id="hamouMobileThemeButton"
                    >
                        🌙 الوضع الليلي
                    </button>

                </div>
            </div>
        `;

        const menuButton =
            document.getElementById(
                "hamouMenuButton"
            );

        const mobilePanel =
            document.getElementById(
                "hamouMobilePanel"
            );

        menuButton?.addEventListener(
            "click",
            function () {

                const active =
                    mobilePanel.classList.toggle(
                        "active"
                    );

                menuButton.setAttribute(
                    "aria-expanded",
                    String(active)
                );

            }
        );

        function toggleThemeSafely() {

            if (
                typeof window.toggleTheme ===
                "function"
            ) {
                window.toggleTheme();
                return;
            }

            document.documentElement
                .classList
                .toggle("dark");
        }

        document
            .getElementById("hamouThemeButton")
            ?.addEventListener(
                "click",
                toggleThemeSafely
            );

        document
            .getElementById(
                "hamouMobileThemeButton"
            )
            ?.addEventListener(
                "click",
                toggleThemeSafely
            );
    }

    async function start() {

        const profile =
            await getProfile();

        renderNavbar(profile);
    }

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            start
        );

    } else {

        start();

    }

})();
<button
    type="button"
    data-theme-toggle
>
    🌙
</button>
