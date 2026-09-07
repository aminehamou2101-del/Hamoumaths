(function () {

    "use strict";

    const $ = id =>
        document.getElementById(id);

    let dashboard = null;

    function empty(
        element,
        message
    ) {
        element.innerHTML = "";

        const div =
            document.createElement("div");

        div.className = "empty";
        div.textContent = message;

        element.appendChild(div);
    }

    async function loadDashboard() {

        const {
            data: userData,
            error: userError
        } =
            await supabaseClient.auth
                .getUser();

        if (userError) {
            throw userError;
        }

        if (!userData.user) {

            location.href =
                "login.html?redirect=dashboard.html";

            return;
        }

        const {
            data,
            error
        } =
            await supabaseClient
                .rpc(
                    "get_student_dashboard"
                );

        if (error) {
            throw error;
        }

        dashboard =
            data;

        render();
    }

    function render() {

        const profile =
            dashboard.profile || {};

        const stats =
            dashboard.stats || {};

        const name =
            profile.full_name ||
            "طالبنا العزيز";

        $("welcome").textContent =
            `مرحبًا ${name} 👋`;

        $("profileSummary")
            .textContent =
            `أنت في المستوى ${profile.level || 1} ولديك ${profile.xp || 0} XP.`;

        $("xp").textContent =
            profile.xp || 0;

        $("level").textContent =
            profile.level || 1;

        $("attempts").textContent =
            stats.attempts || 0;

        $("successRate").textContent =
            `${stats.success_rate || 0}%`;

        const xp =
            Number(profile.xp || 0);

        const currentLevel =
            Number(profile.level || 1);

        const levelStart =
            (currentLevel - 1) * 100;

        const nextLevel =
            currentLevel * 100;

        const withinLevel =
            Math.max(
                0,
                xp - levelStart
            );

        const required =
            Math.max(
                1,
                nextLevel - levelStart
            );

        const percentage =
            Math.min(
                100,
                Math.round(
                    withinLevel /
                    required *
                    100
                )
            );

        $("currentXp").textContent =
            xp;

        $("nextXp").textContent =
            nextLevel;

        $("xpProgress").style.width =
            `${percentage}%`;

        renderRecommendations(
            dashboard.recommendations ||
            []
        );

        renderLessons(
            dashboard.recent_lessons ||
            []
        );

        renderResults(
            dashboard.recent_results ||
            []
        );

        renderAchievements(
            dashboard.achievements ||
            []
        );
    }

    function renderRecommendations(items) {

        const box =
            $("recommendations");

        box.innerHTML = "";

        if (!items.length) {

            empty(
                box,
                "لا توجد تمارين مقترحة حاليًا. استمر في التعلم!"
            );

            return;
        }

        items.forEach(item => {

            const link =
                document.createElement("a");

            link.className = "item";

            link.href =
                `exercises.html?id=${encodeURIComponent(
                    item.id
                )}`;

            link.textContent =
                item.title || "تمرين";

            const meta =
                document.createElement("div");

            meta.className =
                "meta";

            meta.textContent =
                [
                    item.topic,
                    item.difficulty
                ]
                    .filter(Boolean)
                    .join(" • ");

            link.appendChild(meta);

            box.appendChild(link);
        });
    }

    function renderLessons(items) {

        const box =
            $("lessons");

        box.innerHTML = "";

        if (!items.length) {

            empty(
                box,
                "لا توجد دروس منشورة بعد."
            );

            return;
        }

        items.forEach(item => {

            const link =
                document.createElement("a");

            link.className = "item";

            link.href =
                `lesson.html?id=${encodeURIComponent(
                    item.id
                )}`;

            link.textContent =
                item.title || "درس";

            const meta =
                document.createElement("div");

            meta.className =
                "meta";

            meta.textContent =
                [
                    item.level,
                    item.subject,
                    item.topic
                ]
                    .filter(Boolean)
                    .join(" • ");

            link.appendChild(meta);

            box.appendChild(link);
        });
    }

    function renderResults(items) {

        const box =
            $("results");

        box.innerHTML = "";

        if (!items.length) {

            empty(
                box,
                "لم تقم بأي محاولات بعد."
            );

            return;
        }

        items.forEach(item => {

            const result =
                document.createElement("div");

            result.className =
                "result";

            const title =
                document.createElement("div");

            title.textContent =
                item.title ||
                "تمرين";

            const state =
                document.createElement("span");

            state.className =
                item.correct
                    ? "correct"
                    : "wrong";

            state.textContent =
                item.correct
                    ? `✓ +${item.xp || 0} XP`
                    : "✗ خطأ";

            result.appendChild(title);
            result.appendChild(state);

            box.appendChild(result);
        });
    }

    function renderAchievements(items) {

        const box =
            $("achievements");

        box.innerHTML = "";

        if (!items.length) {

            empty(
                box,
                "لم تحصل على إنجازات بعد."
            );

            return;
        }

        items.forEach(item => {

            const achievement =
                document.createElement("div");

            achievement.className =
                "achievement";

            const icon =
                document.createElement("div");

            icon.className =
                "achievement-icon";

            icon.textContent =
                item.icon || "🏆";

            const text =
                document.createElement("div");

            const name =
                document.createElement("strong");

            name.textContent =
                item.name || "إنجاز";

            const description =
                document.createElement("div");

            description.className =
                "meta";

            description.textContent =
                item.description || "";

            text.appendChild(name);
            text.appendChild(description);

            achievement.appendChild(icon);
            achievement.appendChild(text);

            box.appendChild(
                achievement
            );
        });
    }

    async function start() {

        try {

            await loadDashboard();

        } catch (error) {

            console.error(error);

            document.body.innerHTML =
                `
                <div style="
                    max-width:700px;
                    margin:80px auto;
                    padding:25px;
                    font-family:Tahoma,Arial;
                    direction:rtl;
                ">
                    <h2>تعذر تحميل لوحة الطالب</h2>
                    <p>${escapeHtml(
                        error.message
                    )}</p>
                </div>
                `;
        }
    }

    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(
                /'/g,
                "&#039;"
            );
    }

    start();

})();
