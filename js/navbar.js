"use strict";

/*
============================================================
HAMOU MATH - Global Navbar
js/navbar.js

المزايا:
- قائمة موحدة في جميع الصفحات
- AR / FR / EN تعمل فعليًا
- حفظ اللغة المختارة
- دعم RTL / LTR
- متوافق مع js/i18n.js
- متوافق مع js/supabase.js
- روابط صحيحة من الجذر ومن /pages/
- تسجيل الدخول / التسجيل / الملف الشخصي / تسجيل الخروج
- إظهار روابط الأستاذ والإدارة حسب الدور
- Mobile Menu
- Light / Dark Theme
============================================================
*/

(function () {
    "use strict";

    const NAVBAR_ID = "hamou-navbar";

    /*
    ------------------------------------------------------------
    تحديد المسار الأساسي تلقائيًا
    ------------------------------------------------------------
    */

    function getBasePath() {
        const path = window.location.pathname || "";

        return path.includes("/pages/")
            ? "../"
            : "./";
    }

    const BASE = getBasePath();

    function url(path) {
        return BASE + path;
    }

    /*
    ------------------------------------------------------------
    Escape HTML
    ------------------------------------------------------------
    */

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /*
    ------------------------------------------------------------
    الحصول على الترجمة
    ------------------------------------------------------------
    */

    function tr(key, fallback) {
        if (
            window.HAMOU_I18N &&
            typeof window.HAMOU_I18N.t === "function"
        ) {
            return window.HAMOU_I18N.t(key, fallback);
        }

        return fallback || key;
    }

    /*
    ------------------------------------------------------------
    Profile
    مهم:
    لا نستعمل getProfile() هنا حتى لا يحدث recursion
    ------------------------------------------------------------
    */

    async function fetchNavbarProfile() {
        try {
            if (
                typeof window.supabaseClient === "undefined" ||
                !window.supabaseClient
            ) {
                return null;
            }

            const {
                data: sessionData,
                error: sessionError
            } = await window.supabaseClient.auth.getSession();

            if (sessionError || !sessionData?.session?.user) {
                return null;
            }

            const user = sessionData.session.user;

            const {
                data: profile,
                error: profileError
            } = await window.supabaseClient
                .from("profiles")
                .select(`
                    id,
                    email,
                    full_name,
                    avatar_url,
                    role,
                    xp,
                    level
                `)
                .eq("id", user.id)
                .maybeSingle();

            if (profileError) {
                console.warn(
                    "HAMOU NAVBAR profile:",
                    profileError.message
                );

                return {
                    id: user.id,
                    email: user.email || "",
                    full_name:
                        user.user_metadata?.full_name ||
                        user.email ||
                        "User",
                    avatar_url:
                        user.user_metadata?.avatar_url ||
                        "",
                    role: "student"
                };
            }

            return profile || {
                id: user.id,
                email: user.email || "",
                full_name:
                    user.user_metadata?.full_name ||
                    user.email ||
                    "User",
                avatar_url:
                    user.user_metadata?.avatar_url ||
                    "",
                role: "student"
            };
        } catch (error) {
            console.warn(
                "HAMOU NAVBAR:",
                error
            );

            return null;
        }
    }

    /*
    ------------------------------------------------------------
    role helpers
    ------------------------------------------------------------
    */

    function isTeacherRole(role) {
        return [
            "teacher",
            "admin",
            "owner"
        ].includes(role);
    }

    function isAdminRole(role) {
        return [
            "admin",
            "owner"
        ].includes(role);
    }

    function isOwnerRole(role) {
        return role === "owner";
    }

    /*
    ------------------------------------------------------------
    لغة المستخدم الحالية
    ------------------------------------------------------------
    */

    function getCurrentLanguage() {
        try {
            if (
                window.HAMOU_I18N &&
                typeof window.HAMOU_I18N.getLanguage === "function"
            ) {
                return window.HAMOU_I18N.getLanguage();
            }

            return (
                localStorage.getItem("hamou_math_language") ||
                "ar"
            );
        } catch {
            return "ar";
        }
    }

    /*
    ------------------------------------------------------------
    بناء أزرار اللغة
    ------------------------------------------------------------
    */

    function languageButtons() {
        const current = getCurrentLanguage();

        return `
            <div class="hamou-lang-switcher"
                 role="group"
                 aria-label="${escapeHtml(
                     tr("nav.language", "Language")
                 )}">

                <button
                    type="button"
                    class="hamou-lang-btn ${current === "ar" ? "active" : ""}"
                    data-hamou-language="ar"
                    aria-pressed="${current === "ar"}"
                    title="العربية"
                >
                    AR
                </button>

                <button
                    type="button"
                    class="hamou-lang-btn ${current === "fr" ? "active" : ""}"
                    data-hamou-language="fr"
                    aria-pressed="${current === "fr"}"
                    title="Français"
                >
                    FR
                </button>

                <button
                    type="button"
                    class="hamou-lang-btn ${current === "en" ? "active" : ""}"
                    data-hamou-language="en"
                    aria-pressed="${current === "en"}"
                    title="English"
                >
                    EN
                </button>

            </div>
        `;
    }

    /*
    ------------------------------------------------------------
    قائمة التنقل الأساسية
    ------------------------------------------------------------
    */

    function baseNavigation() {
        return [
            {
                href: url("index.html"),
                icon: "⌂",
                key: "nav.home",
                fallback: "الرئيسية"
            },
            {
                href: url("pages/levels.html"),
                icon: "🎓",
                key: "nav.levels",
                fallback: "المستويات"
            },
            {
                href: url("pages/curriculum.html"),
                icon: "📚",
                key: "nav.curriculum",
                fallback: "المنهاج"
            },
            {
                href: url("pages/library.html"),
                icon: "📖",
                key: "nav.library",
                fallback: "المكتبة"
            },
            {
                href: url("pages/exercises.html"),
                icon: "✏️",
                key: "nav.exercises",
                fallback: "التمارين"
            },
            {
                href: url("pages/tools.html"),
                icon: "🧮",
                key: "nav.tools",
                fallback: "الأدوات"
            },
            {
                href: url("pages/bac.html"),
                icon: "🏆",
                key: "nav.bac",
                fallback: "البكالوريا"
            },
            {
                href: url("pages/leaderboard.html"),
                icon: "🥇",
                key: "nav.leaderboard",
                fallback: "المتصدرون"
            },
            {
                href: url("pages/achievements.html"),
                icon: "⭐",
                key: "nav.achievements",
                fallback: "الإنجازات"
            },
            {
                href: url("pages/search.html"),
                icon: "🔎",
                key: "nav.search",
                fallback: "بحث"
            }
        ];
    }

    /*
    ------------------------------------------------------------
    الدور
    ------------------------------------------------------------
    */

    function roleNavigation(profile) {
        if (!profile) {
            return [];
        }

        const links = [];

        const role = profile.role;

        if (isTeacherRole(role)) {
            links.push({
                href: url("pages/teacher.html"),
                icon: "👨‍🏫",
                key: "nav.teacher",
                fallback: "فضاء الأستاذ"
            });
        }

        if (isAdminRole(role)) {
            links.push({
                href: url("pages/content-review.html"),
                icon: "✅",
                key: "nav.review",
                fallback: "مراجعة المحتوى"
            });
        }

        if (isOwnerRole(role)) {
            links.push({
                href: url("pages/curriculum-admin.html"),
                icon: "🗂️",
                key: "nav.curriculumAdmin",
                fallback: "إدارة المنهاج"
            });

            links.push({
                href: url("pages/admin.html"),
                icon: "⚙️",
                key: "nav.owner",
                fallback: "الإدارة"
            });
        }

        return links;
    }

    /*
    ------------------------------------------------------------
    عنصر رابط
    ------------------------------------------------------------
    */

    function renderNavLink(item, mobile = false) {
        return `
            <a
                class="hamou-nav-link ${mobile ? "mobile-link" : ""}"
                href="${escapeHtml(item.href)}"
            >
                <span class="hamou-nav-icon">
                    ${item.icon}
                </span>

                <span class="hamou-nav-text">
                    ${escapeHtml(
                        tr(item.key, item.fallback)
                    )}
                </span>
            </a>
        `;
    }

    /*
    ------------------------------------------------------------
    منطقة الحساب
    ------------------------------------------------------------
    */

    function renderAuthArea(profile, mobile = false) {
        if (profile) {
            const name =
                profile.full_name ||
                profile.email ||
                "User";

            const avatar = profile.avatar_url
                ? `
                    <img
                        src="${escapeHtml(profile.avatar_url)}"
                        alt=""
                        class="hamou-avatar"
                    >
                  `
                : `
                    <span class="hamou-avatar-placeholder">
                        ${escapeHtml(
                            name.charAt(0).toUpperCase()
                        )}
                    </span>
                  `;

            return `
                <div class="hamou-user-area ${mobile ? "mobile-auth" : ""}">

                    <a
                        href="${escapeHtml(
                            url("pages/profile.html")
                        )}"
                        class="hamou-profile-link"
                    >
                        ${avatar}

                        <span class="hamou-user-info">
                            <strong>
                                ${escapeHtml(name)}
                            </strong>

                            <small>
                                ${escapeHtml(
                                    translateRole(profile.role)
                                )}
                            </small>
                        </span>
                    </a>

                    <button
                        type="button"
                        class="hamou-logout-btn"
                        data-hamou-logout
                        title="${escapeHtml(
                            tr("nav.logout", "Logout")
                        )}"
                    >
                        <span>↪</span>
                        <span>
                            ${escapeHtml(
                                tr("nav.logout", "Logout")
                            )}
                        </span>
                    </button>

                </div>
            `;
        }

        return `
            <div class="hamou-auth-area ${mobile ? "mobile-auth" : ""}">

                <a
                    href="${escapeHtml(
                        url("pages/login.html")
                    )}"
                    class="hamou-login-btn"
                >
                    ${escapeHtml(
                        tr("nav.login", "Login")
                    )}
                </a>

                <a
                    href="${escapeHtml(
                        url("pages/register.html")
                    )}"
                    class="hamou-register-btn"
                >
                    ${escapeHtml(
                        tr("nav.register", "Create Account")
                    )}
                </a>

            </div>
        `;
    }

    /*
    ------------------------------------------------------------
    ترجمة الدور
    ------------------------------------------------------------
    */

    function translateRole(role) {
        switch (role) {
            case "owner":
                return tr(
                    "profile.owner",
                    "Owner"
                );

            case "admin":
                return tr(
                    "profile.admin",
                    "Admin"
                );

            case "teacher":
                return tr(
                    "profile.teacher",
                    "Teacher"
                );

            case "researcher":
                return tr(
                    "profile.researcher",
                    "Researcher"
                );

            default:
                return tr(
                    "profile.student",
                    "Student"
                );
        }
    }

    /*
    ------------------------------------------------------------
    تحديد الصفحة الحالية
    ------------------------------------------------------------
    */

    function markActiveLink(root) {
        const currentPath =
            window.location.pathname
                .replace(/\/+/g, "/");

        root
            .querySelectorAll(".hamou-nav-link")
            .forEach(link => {

                let href = "";

                try {
                    href = new URL(
                        link.href,
                        window.location.origin
                    ).pathname;
                } catch {
                    return;
                }

                const normalizedHref =
                    href.replace(/\/+/g, "/");

                const active =
                    normalizedHref === currentPath;

                link.classList.toggle(
                    "active",
                    active
                );
            });
    }

    /*
    ------------------------------------------------------------
    CSS
    ------------------------------------------------------------
    */

    function injectStyles() {
        if (
            document.getElementById(
                "hamou-navbar-style"
            )
        ) {
            return;
        }

        const style =
            document.createElement("style");

        style.id =
            "hamou-navbar-style";

        style.textContent = `
        :root {
            --hamou-nav-bg: rgba(255,255,255,.92);
            --hamou-nav-text: #172033;
            --hamou-nav-muted: #667085;
            --hamou-nav-border: rgba(15,23,42,.10);
            --hamou-nav-hover: rgba(37,99,235,.08);
            --hamou-nav-active: rgba(37,99,235,.13);
            --hamou-nav-accent: #2563eb;
            --hamou-nav-shadow:
                0 8px 30px rgba(15,23,42,.08);
        }

        html[data-theme="dark"],
        html.dark,
        body.dark {
            --hamou-nav-bg: rgba(15,23,42,.94);
            --hamou-nav-text: #f8fafc;
            --hamou-nav-muted: #cbd5e1;
            --hamou-nav-border: rgba(255,255,255,.10);
            --hamou-nav-hover: rgba(255,255,255,.07);
            --hamou-nav-active: rgba(59,130,246,.20);
            --hamou-nav-accent: #60a5fa;
            --hamou-nav-shadow:
                0 10px 30px rgba(0,0,0,.25);
        }

        .hamou-navbar {
            position: sticky;
            top: 0;
            z-index: 9999;
            width: 100%;
            background: var(--hamou-nav-bg);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            border-bottom:
                1px solid var(--hamou-nav-border);
            box-shadow: var(--hamou-nav-shadow);
        }

        .hamou-navbar * {
            box-sizing: border-box;
        }

        .hamou-nav-container {
            width: min(1500px, 96%);
            margin: 0 auto;
            min-height: 74px;
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .hamou-brand {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            flex: 0 0 auto;
            text-decoration: none;
            color: var(--hamou-nav-text);
            font-weight: 900;
            letter-spacing: -.5px;
            white-space: nowrap;
        }

        .hamou-brand-logo {
            width: 44px;
            height: 44px;
            border-radius: 14px;
            display: grid;
            place-items: center;
            font-size: 20px;
            font-weight: 900;
            color: white;
            background:
                linear-gradient(
                    135deg,
                    #2563eb,
                    #7c3aed
                );
            box-shadow:
                0 8px 20px rgba(37,99,235,.25);
        }

        .hamou-brand-name {
            font-size: 1.05rem;
        }

        .hamou-desktop-nav {
            display: flex;
            align-items: center;
            gap: 4px;
            flex: 1;
            min-width: 0;
            overflow-x: auto;
            scrollbar-width: none;
        }

        .hamou-desktop-nav::-webkit-scrollbar {
            display: none;
        }

        .hamou-nav-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
            min-height: 42px;
            padding: 8px 11px;
            border-radius: 12px;
            color: var(--hamou-nav-muted);
            text-decoration: none;
            font-size: .88rem;
            font-weight: 750;
            white-space: nowrap;
            transition:
                background .18s ease,
                color .18s ease,
                transform .18s ease;
        }

        .hamou-nav-link:hover {
            color: var(--hamou-nav-text);
            background: var(--hamou-nav-hover);
            transform: translateY(-1px);
        }

        .hamou-nav-link.active {
            color: var(--hamou-nav-accent);
            background: var(--hamou-nav-active);
        }

        .hamou-nav-icon {
            font-size: 1rem;
            line-height: 1;
        }

        .hamou-nav-text {
            line-height: 1.2;
        }

        .hamou-nav-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 0 0 auto;
        }

        .hamou-lang-switcher {
            display: flex;
            align-items: center;
            gap: 3px;
            padding: 4px;
            border:
                1px solid var(--hamou-nav-border);
            border-radius: 12px;
            background:
                rgba(127,127,127,.06);
        }

        .hamou-lang-btn {
            appearance: none;
            border: 0;
            min-width: 37px;
            height: 34px;
            padding: 0 8px;
            border-radius: 9px;
            cursor: pointer;
            color: var(--hamou-nav-muted);
            background: transparent;
            font-weight: 900;
            font-size: .75rem;
            transition:
                background .18s ease,
                color .18s ease,
                transform .18s ease;
        }

        .hamou-lang-btn:hover {
            color: var(--hamou-nav-text);
            background: var(--hamou-nav-hover);
        }

        .hamou-lang-btn.active {
            color: white;
            background: var(--hamou-nav-accent);
            box-shadow:
                0 4px 12px rgba(37,99,235,.22);
        }

        .hamou-theme-btn {
            width: 42px;
            height: 42px;
            border: 1px solid var(--hamou-nav-border);
            border-radius: 12px;
            background: transparent;
            color: var(--hamou-nav-text);
            cursor: pointer;
            font-size: 1.1rem;
        }

        .hamou-theme-btn:hover {
            background: var(--hamou-nav-hover);
        }

        .hamou-auth-area,
        .hamou-user-area {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .hamou-login-btn,
        .hamou-register-btn,
        .hamou-logout-btn {
            min-height: 42px;
            padding: 8px 13px;
            border-radius: 11px;
            text-decoration: none;
            font-size: .84rem;
            font-weight: 850;
            cursor: pointer;
        }

        .hamou-login-btn {
            color: var(--hamou-nav-text);
            border:
                1px solid var(--hamou-nav-border);
            background: transparent;
        }

        .hamou-register-btn {
            color: white;
            background: var(--hamou-nav-accent);
            border: 1px solid transparent;
        }

        .hamou-login-btn:hover {
            background: var(--hamou-nav-hover);
        }

        .hamou-register-btn:hover {
            filter: brightness(1.06);
        }

        .hamou-profile-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            text-decoration: none;
            color: var(--hamou-nav-text);
            min-width: 0;
        }

        .hamou-avatar,
        .hamou-avatar-placeholder {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            object-fit: cover;
            display: grid;
            place-items: center;
            flex: 0 0 auto;
        }

        .hamou-avatar-placeholder {
            color: white;
            font-weight: 900;
            background:
                linear-gradient(
                    135deg,
                    #2563eb,
                    #7c3aed
                );
        }

        .hamou-user-info {
            display: flex;
            flex-direction: column;
            min-width: 0;
        }

        .hamou-user-info strong {
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: .82rem;
        }

        .hamou-user-info small {
            color: var(--hamou-nav-muted);
            font-size: .7rem;
        }

        .hamou-logout-btn {
            border:
                1px solid var(--hamou-nav-border);
            background: transparent;
            color: var(--hamou-nav-text);
        }

        .hamou-logout-btn:hover {
            background: var(--hamou-nav-hover);
        }

        .hamou-menu-btn {
            display: none;
            width: 44px;
            height: 44px;
            border-radius: 12px;
            border:
                1px solid var(--hamou-nav-border);
            background: transparent;
            color: var(--hamou-nav-text);
            cursor: pointer;
            font-size: 1.25rem;
        }

        .hamou-mobile-panel {
            display: none;
            border-top:
                1px solid var(--hamou-nav-border);
            padding: 12px;
            background: var(--hamou-nav-bg);
        }

        .hamou-mobile-panel.open {
            display: block;
        }

        .hamou-mobile-links {
            display: grid;
            gap: 5px;
        }

        .hamou-mobile-links .hamou-nav-link {
            width: 100%;
            justify-content: flex-start;
            min-height: 46px;
        }

        .hamou-mobile-tools {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
            margin-top: 10px;
            padding-top: 10px;
            border-top:
                1px solid var(--hamou-nav-border);
        }

        .hamou-mobile-tools .hamou-auth-area,
        .hamou-mobile-tools .hamou-user-area {
            width: 100%;
            flex-wrap: wrap;
        }

        @media (max-width: 1250px) {
            .hamou-nav-text {
                display: none;
            }

            .hamou-nav-link {
                min-width: 42px;
                padding-inline: 9px;
            }
        }

        @media (max-width: 1000px) {
            .hamou-desktop-nav,
            .hamou-nav-actions {
                display: none;
            }

            .hamou-menu-btn {
                display: inline-grid;
                place-items: center;
                margin-inline-start: auto;
            }
        }

        @media (max-width: 560px) {
            .hamou-nav-container {
                min-height: 64px;
                width: min(96%, 100%);
            }

            .hamou-brand-name {
                font-size: .95rem;
            }

            .hamou-brand-logo {
                width: 40px;
                height: 40px;
                border-radius: 12px;
            }
        }
        `;

        document.head.appendChild(style);
    }

    /*
    ------------------------------------------------------------
    Render Navbar
    ------------------------------------------------------------
    */

    async function renderNavbar(profile = null) {
        const host =
            document.getElementById(NAVBAR_ID);

        if (!host) {
            return;
        }

        const links = [
            ...baseNavigation(),
            ...roleNavigation(profile)
        ];

        host.innerHTML = `
            <nav
                class="hamou-navbar"
                aria-label="${escapeHtml(
                    tr("app.name", "HAMOU MATH")
                )}"
            >

                <div class="hamou-nav-container">

                    <a
                        href="${escapeHtml(
                            url("index.html")
                        )}"
                        class="hamou-brand"
                    >
                        <span class="hamou-brand-logo">
                            H
                        </span>

                        <span class="hamou-brand-name">
                            HAMOU MATH
                        </span>
                    </a>

                    <div class="hamou-desktop-nav">
                        ${links
                            .map(item =>
                                renderNavLink(item)
                            )
                            .join("")}
                    </div>

                    <div class="hamou-nav-actions">

                        ${languageButtons()}

                        <button
                            type="button"
                            class="hamou-theme-btn"
                            data-hamou-theme
                            title="${escapeHtml(
                                tr(
                                    "nav.theme",
                                    "Theme"
                                )
                            )}"
                            aria-label="${escapeHtml(
                                tr(
                                    "nav.theme",
                                    "Theme"
                                )
                            )}"
                        >
                            🌙
                        </button>

                        ${renderAuthArea(profile)}

                    </div>

                    <button
                        type="button"
                        class="hamou-menu-btn"
                        data-hamou-menu
                        aria-expanded="false"
                        aria-label="${escapeHtml(
                            tr(
                                "nav.menu",
                                "Menu"
                            )
                        )}"
                    >
                        ☰
                    </button>

                </div>

                <div
                    class="hamou-mobile-panel"
                    data-hamou-mobile-panel
                >

                    <div class="hamou-mobile-links">
                        ${links
                            .map(item =>
                                renderNavLink(
                                    item,
                                    true
                                )
                            )
                            .join("")}
                    </div>

                    <div class="hamou-mobile-tools">

                        ${languageButtons()}

                        <button
                            type="button"
                            class="hamou-theme-btn"
                            data-hamou-theme
                        >
                            🌙
                        </button>

                        ${renderAuthArea(
                            profile,
                            true
                        )}

                    </div>

                </div>

            </nav>
        `;

        bindNavbarEvents(host);
        markActiveLink(host);
        syncThemeButton(host);
    }

    /*
    ------------------------------------------------------------
    ربط الأحداث
    ------------------------------------------------------------
    */

    function bindNavbarEvents(host) {

        /*
        LANGUAGE
        */

        host
            .querySelectorAll(
                "[data-hamou-language]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    async function (event) {

                        event.preventDefault();

                        const language =
                            this.getAttribute(
                                "data-hamou-language"
                            );

                        if (!language) {
                            return;
                        }

                        /*
                        استخدام i18n الرسمي
                        */

                        if (
                            window.HAMOU_I18N &&
                            typeof window.HAMOU_I18N.setLanguage ===
                                "function"
                        ) {
                            window.HAMOU_I18N.setLanguage(
                                language
                            );
                        } else {
                            /*
                            fallback
                            */

                            try {
                                localStorage.setItem(
                                    "hamou_math_language",
                                    language
                                );
                            } catch {}
                        }

                        /*
                        تحديث اتجاه الصفحة فورًا
                        */

                        applyLanguageFallback(language);

                        /*
                        إعادة رسم navbar حتى تتحدث
                        النصوص واللغة النشطة
                        */

                        const profile =
                            await fetchNavbarProfile();

                        await renderNavbar(profile);
                    }
                );
            });

        /*
        MENU
        */

        const menuButton =
            host.querySelector(
                "[data-hamou-menu]"
            );

        const mobilePanel =
            host.querySelector(
                "[data-hamou-mobile-panel]"
            );

        if (menuButton && mobilePanel) {
            menuButton.addEventListener(
                "click",
                () => {

                    const open =
                        mobilePanel.classList.toggle(
                            "open"
                        );

                    menuButton.setAttribute(
                        "aria-expanded",
                        String(open)
                    );
                }
            );
        }

        /*
        LOGOUT
        */

        host
            .querySelectorAll(
                "[data-hamou-logout]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    async () => {

                        try {

                            if (
                                window.supabaseClient
                            ) {

                                const { error } =
                                    await window.supabaseClient
                                        .auth
                                        .signOut();

                                if (error) {
                                    throw error;
                                }
                            }

                            window.location.href =
                                url("index.html");

                        } catch (error) {

                            console.error(
                                "HAMOU logout:",
                                error
                            );

                            alert(
                                tr(
                                    "general.error",
                                    "An error occurred"
                                )
                            );
                        }
                    }
                );
            });

        /*
        THEME
        */

        host
            .querySelectorAll(
                "[data-hamou-theme]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    toggleTheme
                );
            });

        /*
        إغلاق القائمة بعد اختيار رابط
        */

        host
            .querySelectorAll(
                ".hamou-mobile-panel a"
            )
            .forEach(link => {

                link.addEventListener(
                    "click",
                    () => {

                        const panel =
                            host.querySelector(
                                "[data-hamou-mobile-panel]"
                            );

                        const menu =
                            host.querySelector(
                                "[data-hamou-menu]"
                            );

                        panel?.classList.remove(
                            "open"
                        );

                        menu?.setAttribute(
                            "aria-expanded",
                            "false"
                        );
                    }
                );
            });
    }

    /*
    ------------------------------------------------------------
    Language fallback
    ------------------------------------------------------------
    */

    function applyLanguageFallback(language) {

        const map = {
            ar: {
                lang: "ar",
                dir: "rtl"
            },
            fr: {
                lang: "fr",
                dir: "ltr"
            },
            en: {
                lang: "en",
                dir: "ltr"
            }
        };

        const meta =
            map[language] || map.ar;

        document.documentElement.lang =
            meta.lang;

        document.documentElement.dir =
            meta.dir;

        if (document.body) {
            document.body.dir =
                meta.dir;
        }
    }

    /*
    ------------------------------------------------------------
    Theme
    ------------------------------------------------------------
    */

    function getTheme() {
        try {
            return (
                localStorage.getItem(
                    "hamou_math_theme"
                ) || "light"
            );
        } catch {
            return "light";
        }
    }

    function applyTheme(theme) {

        document.documentElement.dataset.theme =
            theme;

        document.documentElement.classList.toggle(
            "dark",
            theme === "dark"
        );

        document.body?.classList.toggle(
            "dark",
            theme === "dark"
        );

        try {
            localStorage.setItem(
                "hamou_math_theme",
                theme
            );
        } catch {}
    }

    function toggleTheme() {

        const current =
            getTheme();

        const next =
            current === "dark"
                ? "light"
                : "dark";

        applyTheme(next);

        syncThemeButton(
            document.getElementById(
                NAVBAR_ID
            )
        );
    }

    function syncThemeButton(host) {

        if (!host) return;

        const dark =
            getTheme() === "dark";

        host
            .querySelectorAll(
                "[data-hamou-theme]"
            )
            .forEach(button => {

                button.textContent =
                    dark ? "☀️" : "🌙";

                button.setAttribute(
                    "aria-label",
                    dark
                        ? tr(
                            "nav.light",
                            "Light Mode"
                        )
                        : tr(
                            "nav.dark",
                            "Dark Mode"
                        )
                );

                button.setAttribute(
                    "title",
                    dark
                        ? tr(
                            "nav.light",
                            "Light Mode"
                        )
                        : tr(
                            "nav.dark",
                            "Dark Mode"
                        )
                );
            });
    }

    /*
    ------------------------------------------------------------
    الاستماع لتغيير اللغة من i18n.js
    ------------------------------------------------------------
    */

    document.addEventListener(
        "hamou:languageChanged",
        async event => {

            applyLanguageFallback(
                event.detail?.language ||
                "ar"
            );

            const host =
                document.getElementById(
                    NAVBAR_ID
                );

            if (!host) return;

            const profile =
                await fetchNavbarProfile();

            await renderNavbar(profile);
        }
    );

    /*
    ------------------------------------------------------------
    عند جاهزية i18n
    ------------------------------------------------------------
    */

    document.addEventListener(
        "hamou:i18nApplied",
        () => {
            const host =
                document.getElementById(
                    NAVBAR_ID
                );

            if (!host) return;

            markActiveLink(host);
        }
    );

    /*
    ------------------------------------------------------------
    Init
    ------------------------------------------------------------
    */

    async function initNavbar() {

        injectStyles();

        /*
        اتجاه ابتدائي سريع قبل تحميل Supabase
        */

        applyLanguageFallback(
            getCurrentLanguage()
        );

        /*
        Render أولي مباشر
        حتى لا تختفي القائمة
        */

        await renderNavbar(null);

        /*
        تحميل الحساب لاحقًا
        */

        const profile =
            await fetchNavbarProfile();

        await renderNavbar(profile);
    }

    /*
    ------------------------------------------------------------
    تشغيل
    ------------------------------------------------------------
    */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initNavbar,
            { once: true }
        );

    } else {

        initNavbar();

    }

})();
