// =====================================================
// HAMOU MATH
// LEVEL NAVIGATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    initLevelPage
);


function initLevelPage() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const level =
        params.get("level") || "";


    if (!level) {
        window.location.href = "levels.html";
        return;
    }


    const title =
        document.getElementById("levelTitle");

    const lessons =
        document.getElementById("lessonsLink");

    const exercises =
        document.getElementById("exercisesLink");

    const resources =
        document.getElementById("resourcesLink");


    if (title) {
        title.textContent =
            `🎓 ${level}`;
    }


    /*
     * نستخدم البحث الحالي مع level.
     * هذا يتجنب إنشاء صفحات منفصلة لكل سنة.
     */

    const encoded =
        encodeURIComponent(level);


    if (lessons) {

        lessons.href =
            `search.html?type=lesson&level=${encoded}`;
    }


    if (exercises) {

        exercises.href =
            `search.html?type=exercise&level=${encoded}`;
    }


    if (resources) {

        resources.href =
            `search.html?type=resource&level=${encoded}`;
    }
}
