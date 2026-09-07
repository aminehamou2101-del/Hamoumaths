(function () {
    "use strict";

    function getBasePath() {
        return window.location.pathname.includes("/pages/")
            ? "../"
            : "";
    }

    function link(base, path, text) {
        return `
            <a href="${base}${path}">
                ${text}
            </a>
        `;
    }

    /*
     * مهم:
     * لا نسمي هذه الدالة getProfile حتى لا تتعارض
     * مع getProfile الموجودة في supabase.js.
     */
    async function fetchNavbarProfile() {
        try {
            if (
                typeof supabaseClient === "undefined"
            ) {
                return null;
            }

            const {
                data: authData,
                error: authError
            } = await supabaseClient.auth.getUser();

            if (authError || !authData?.user) {
                return null;
            }

            const {
                data,
                error
            } = await supabaseClient
                .from("profiles")
                .select(`
                    id,
                    full_name,
                    role,
                    avatar_url,
                    xp,
                    level
                `)
                .eq(
                    "id",
                    authData.user.id
                )
                .maybeSingle();

            if (error) {
                console.error(
                    "Navbar profile:",
                    error
                );
                return null;
            }

            return data || null;

        } catch (error) {
            console.error(
                "Navbar auth:",
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
            roleLinks += link(
                base,
                "pages/teacher.html",
                "👨‍🏫 الأستاذ"
            );
        }

        if (
            role === "admin" ||
            role === "owner"
        ) {
            roleLinks += link(
                base,
                "pages/content-review.html",
                "🛡️ المراجعة"
            );
        }

        if (role === "owner") {
            roleLinks += link(
                base,
                "pages/curriculum-admin.html",
                "👑 إدارة المنهاج"
            );

            roleLinks += link(
                base,
                "pages/admin.html",
                "⚙️ الإدارة"
            );
        }

        const authLinks = profile
            ? `
                <a href="${base}pages/profile.html">
                    👤 ${escapeHtml(
                        profile.full_name ||
                        "حسابي"
                    )}
                </a>

                <button
                    type="button"
                    id="hamouLogoutButton"
                >
                    🚪 خروج
                </button>
            `
            : `
                <a href="${base}pages/login.html">
                    🔐 دخول
                </a>

                <a href="${base}pages/register.html">
                    🚀 إنشاء حساب
                </a>
            `;

        container.innerHTML = `
            <style>

                .hamou-navbar {
                    position: sticky;
                    top: 0;
                    z-index: 5000;

                    width: 100%;

                    background:
                        rgba(255,255,255,.96);

                    backdrop-filter:
                        blur(14px);

                    border-bottom:
                        1px solid #dbe5f1;

                    box-shadow:
                        0 6px 24px
                        rgba(8,43,92,.07);
                }

                .hamou-navbar *,
                .hamou-navbar *::before,
                .hamou-navbar *::after {
                    box-sizing: border-box;
                }

                .hamou-navbar-inner {
                    width:
                        min(1450px, 94%);

                    min-height:
                        70px;

                    margin:
                        0 auto;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    gap:
                        12px;
                }

                .hamou-brand {
                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        10px;

                    color:
                        #082b5c;

                    font-size:
                        19px;

                    font-weight:
                        900;

                    white-space:
                        nowrap;
                }

                .hamou-brand-mark {
                    width:
                        43px;

                    height:
                        43px;

                    flex:
                        0 0 43px;

                    display:
                        grid;

                    place-items:
                        center;

                    border-radius:
                        13px;

                    color:
                        white;

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
                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        flex-end;

                    flex-wrap:
                        wrap;

                    gap:
                        3px;

                    overflow-x:
                        auto;
                }

                .hamou-nav a,
                .hamou-nav button {

                    appearance:
                        none;

                    border:
                        0;

                    text-decoration:
                        none;

                    background:
                        transparent;

                    color:
                        #334155;

                    padding:
                        9px 10px;

                    border-radius:
                        10px;

                    font-family:
                        inherit;

                    font-size:
                        12px;

                    font-weight:
                        800;

                    cursor:
                        pointer;

                    white-space:
                        nowrap;

                    transition:
                        .18s ease;
                }

                .hamou-nav a:hover,
                .hamou-nav button:hover {

                    background:
                        #edf5ff;

                    color:
                        #1565c0;
                }

                .hamou-menu-button {

                    display:
                        none;

                    width:
                        44px;

                    height:
                        44px;

                    flex:
                        0 0 44px;

                    border:
                        0;

                    border-radius:
                        12px;

                    background:
                        #edf5ff;

                    color:
                        #082b5c;

                    font-size:
                        22px;

                    cursor:
                        pointer;
                }

                .hamou-mobile-panel {

                    display:
                        none;

                    width:
                        min(1450px,94%);

                    margin:
                        0 auto;

                    padding:
                        0 0 14px;
                }

                .hamou-mobile-panel.active {
                    display:
                        block;
                }

                .hamou-mobile-panel a,
                .hamou-mobile-panel button {

                    display:
                        block;

                    width:
                        100%;

                    border:
                        0;

                    background:
                        #f8fbff;

                    color:
                        #172033;

                    padding:
                        12px 14px;

                    margin-top:
                        7px;

                    border-radius:
                        11px;

                    text-align:
                        right;

                    text-decoration:
                        none;

                    font-family:
                        inherit;

                    font-size:
                        13px;

                    font-weight:
                        800;

                    cursor:
                        pointer;
                }

                .hamou-mobile-panel a:hover,
                .hamou-mobile-panel button:hover {
                    background:
                        #edf5ff;

                    color:
                        #1565c0;
                }

                @media (max-width: 1150px) {

                    .hamou-nav {
                        display:
                            none;
                    }

                    .hamou-menu-button {
                        display:
                            block;
                    }
                }

                @media (max-width: 500px) {

                    .hamou-navbar-inner {
                        min-height:
                            62px;
                    }

                    .hamou-brand {
                        font-size:
                            16px;
                    }

                    .hamou-brand-mark {
                        width:
                            39px;

                        height:
                            39px;

                        flex-basis:
                            39px;
                    }
                }

                /* Dark mode */

                :root[data-theme="dark"]
                .hamou-navbar {

                    background:
                        rgba(8,20,33,.95);

                    border-bottom-color:
                        #284057;
                }

                :root[data-theme="dark"]
                .hamou-brand {

                    color:
                        #e3f2fd;
                }

                :root[data-theme="dark"]
                .hamou-nav a,
                :root[data-theme="dark"]
                .hamou-nav button {

                    color:
                        #d5e1ec;
                }

                :root[data-theme="dark"]
                .hamou-nav a:hover,
                :root[data-theme="dark"]
                .hamou-nav button:hover {

                    background:
                        #172b40;

                    color:
                        #64b5f6;
                }

                :root[data-theme="dark"]
                .hamou-menu-button {

                    background:
                        #172b40;

                    color:
                        #e3f2fd;
                }

                :root[data-theme="dark"]
                .hamou-mobile-panel a,
                :root[data-theme="dark"]
                .hamou-mobile-panel button {

                    background:
                        #102235;

                    color:
                        #e5edf5;
                }

            </style>

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

                    ${link(
                        base,
                        "index.html",
                        "الرئيسية"
                    )}

                    ${link(
                        base,
                        "pages/levels.html",
                        "🎓 المستويات"
                    )}

                    ${link(
                        base,
                        "pages/curriculum.html",
                        "📚 المنهاج"
                    )}

                    ${link(
                        base,
                        "pages/library.html",
                        "📖 المكتبة"
                    )}

                    ${link(
                        base,
                        "pages/exercises.html",
                        "📝 التمارين"
                    )}

                    ${link(
                        base,
                        "pages/tools.html",
                        "🧮 الأدوات"
                    )}

                    ${link(
                        base,
                        "pages/bac.html",
                        "🎯 البكالوريا"
                    )}

                    ${link(
                        base,
                        "pages/leaderboard.html",
                        "🏆 الترتيب"
                    )}

                    ${link(
                        base,
                        "pages/achievements.html",
                        "🎖️ الإنجازات"
                    )}

                    ${link(
                        base,
                        "pages/search.html",
                        "🔎 البحث"
                    )}

                    ${link(
                        base,
                        "pages/dashboard.html",
                        "📊 لوحتي"
                    )}

                    ${roleLinks}

                    ${authLinks}

                    <button
                        type="button"
                        data-theme-toggle
                        id="hamouThemeButton"
                        title="الوضع الليلي"
                        aria-label="الوضع الليلي"
                    >
                        🌙
                    </button>

                </nav>

                <button
                    type="button"
                    id="hamouMenuButton"
                    class="hamou-menu-button"
                    aria-expanded="false"
                    aria-label="فتح القائمة"
                >
                    ☰
                </button>

            </div>

            <div
                id="hamouMobilePanel"
                class="hamou-mobile-panel"
            >

                ${link(
                    base,
                    "index.html",
                    "🏠 الرئيسية"
                )}

                ${link(
                    base,
                    "pages/levels.html",
                    "🎓 المستويات"
                )}

                ${link(
                    base,
                    "pages/curriculum.html",
                    "📚 المنهاج"
                )}

                ${link(
                    base,
                    "pages/library.html",
                    "📖 المكتبة"
                )}

                ${link(
                    base,
                    "pages/exercises.html",
                    "📝 التمارين"
                )}

                ${link(
                    base,
                    "pages/tools.html",
                    "🧮 الأدوات"
                )}

                ${link(
                    base,
                    "pages/bac.html",
                    "🎯 البكالوريا"
                )}

                ${link(
                    base,
                    "pages/leaderboard.html",
                    "🏆 الترتيب"
                )}

                ${link(
                    base,
                    "pages/achievements.html",
                    "🎖️ الإنجازات"
                )}

                ${link(
                    base,
                    "pages/search.html",
                    "🔎 البحث"
                )}

                ${link(
                    base,
                    "pages/profile.html",
                    "👤 الملف الشخصي"
                )}

                ${link(
                    base,
                    "pages/dashboard.html",
                    "📊 لوحتي"
                )}

                ${roleLinks}

                ${authLinks}

                <button
                    type="button"
                    data-theme-toggle
                    id="hamouMobileThemeButton"
                >
                    🌙 الوضع الليلي
                </button>

            </div>
        `;

        /* =========================================
           MOBILE MENU
        ========================================= */

        const menuButton =
            document.getElementById(
                "hamouMenuButton"
            );

        const mobilePanel =
            document.getElementById(
                "hamouMobilePanel"
            );

        if (menuButton && mobilePanel) {

            menuButton.addEventListener(
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
        }

        /* =========================================
           LOGOUT
        ========================================= */

        const logoutButton =
            document.getElementById(
                "hamouLogoutButton"
            );

        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                async function () {

                    logoutButton.disabled =
                        true;

                    logoutButton.textContent =
                        "جارِ الخروج...";

                    try {

                        const {
                            error
                        } =
                            await supabaseClient
                                .auth
                                .signOut();

                        if (error) {
                            throw error;
                        }

                        window.location.href =
                            base +
                            "index.html";

                    } catch (error) {

                        console.error(
                            "Logout:",
                            error
                        );

                        logoutButton.disabled =
                            false;

                        logoutButton.textContent =
                            "🚪 خروج";
                    }
                }
            );
        }

        /* =========================================
           THEME
        ========================================= */

        document
            .querySelectorAll(
                "[data-theme-toggle]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        function () {

                            if (
                                typeof window.toggleTheme ===
                                "function"
                            ) {

                                window.toggleTheme();

                            } else {

                                const current =
                                    document
                                        .documentElement
                                        .dataset
                                        .theme ||
                                    "light";

                                const next =
                                    current ===
                                    "dark"
                                        ? "light"
                                        : "dark";

                                document
                                    .documentElement
                                    .dataset
                                    .theme =
                                    next;

                                localStorage.setItem(
                                    "hamou-theme",
                                    next
                                );
                            }
                        }
                    );
                }
            );
    }

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

    async function startNavbar() {

        /*
         * نرسم القائمة أولًا حتى لا يختفي الشريط
         * أثناء انتظار Supabase.
         */
        renderNavbar(null);

        const profile =
            await fetchNavbarProfile();

        renderNavbar(profile);
    }

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            startNavbar
        );

    } else {

        startNavbar();

    }

})();
