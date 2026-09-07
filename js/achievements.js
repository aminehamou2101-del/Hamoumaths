// =====================================================
// HAMOU MATH
// ACHIEVEMENTS
// Uses:
//   achievement_definitions
//   user_achievements
// =====================================================


document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadAchievements();

        const refreshButton =
            document.getElementById(
                "refreshAchievements"
            );

        if (refreshButton) {

            refreshButton.addEventListener(
                "click",
                loadAchievements
            );

        }

    }
);


// =====================================================
// MAIN
// =====================================================

async function loadAchievements() {

    const message =
        document.getElementById(
            "achievementMessage"
        );

    const grid =
        document.getElementById(
            "achievementsGrid"
        );


    if (!message || !grid) {
        return;
    }


    setMessage(
        "جارٍ فحص الإنجازات..."
    );

    grid.innerHTML = "";


    try {

        // ---------------------------------------------
        // المستخدم الحالي
        // ---------------------------------------------

        const {
            data: {
                user
            },
            error: userError
        } = await supabaseClient
            .auth
            .getUser();


        if (
            userError ||
            !user
        ) {

            window.location.href =
                "login.html";

            return;
        }


        // ---------------------------------------------
        // فحص وفتح الإنجازات المؤهلة
        // ---------------------------------------------

        const {
            data: newlyChecked,
            error: checkError
        } = await supabaseClient
            .rpc(
                "check_my_achievements"
            );


        if (checkError) {

            console.error(
                "Achievement check error:",
                checkError
            );

            // لا نوقف الصفحة؛
            // قد تكون المشكلة مؤقتة.
        }


        // ---------------------------------------------
        // جلب تعريفات الشارات
        // ---------------------------------------------

        const {
            data: definitions,
            error: definitionsError
        } = await supabaseClient

            .from(
                "achievement_definitions"
            )

            .select(`
                id,
                name,
                description,
                icon,
                required_xp,
                required_exercises
            `)

            .order(
                "required_xp",
                {
                    ascending: true
                }
            );


        if (definitionsError) {

            console.error(
                "Definitions error:",
                definitionsError
            );

            setMessage(
                "❌ تعذر تحميل تعريفات الإنجازات."
            );

            return;
        }


        // ---------------------------------------------
        // الشارات التي حصل عليها المستخدم
        // ---------------------------------------------

        const {
            data: userAchievements,
            error: userAchievementsError
        } = await supabaseClient

            .from(
                "user_achievements"
            )

            .select(
                "achievement_id, unlocked_at"
            )

            .eq(
                "user_id",
                user.id
            );


        if (userAchievementsError) {

            console.error(
                "User achievements error:",
                userAchievementsError
            );

            setMessage(
                "❌ تعذر تحميل شارات الحساب."
            );

            return;
        }


        // ---------------------------------------------
        // تحويلها إلى Map
        // ---------------------------------------------

        const unlockedMap =
            new Map(
                (userAchievements || [])
                    .map(item => [
                        item.achievement_id,
                        item.unlocked_at
                    ])
            );


        const allAchievements =
            definitions || [];


        const unlockedCount =
            allAchievements.filter(
                item =>
                    unlockedMap.has(item.id)
            ).length;


        const totalCount =
            allAchievements.length;


        const completionRate =
            totalCount > 0
                ? Math.round(
                    (
                        unlockedCount /
                        totalCount
                    ) * 100
                )
                : 0;


        setText(
            "unlockedCount",
            unlockedCount
        );

        setText(
            "totalCount",
            totalCount
        );

        setText(
            "completionRate",
            `${completionRate}%`
        );


        // ---------------------------------------------
        // رسالة إنجاز جديد
        // ---------------------------------------------

        const newAchievements =
            (newlyChecked || [])
                .filter(
                    item =>
                        item.newly_unlocked === true
                );


        if (newAchievements.length > 0) {

            const names =
                newAchievements
                    .map(
                        item =>
                            `${item.achievement_icon || "🏅"} ${item.achievement_name}`
                    )
                    .join(" • ");


            setMessage(
                `🎉 حصلت على إنجاز جديد: ${names}`
            );

        } else {

            setMessage(
                `${unlockedCount} من ${totalCount} شارات مفتوحة.`
            );

        }


        // ---------------------------------------------
        // عرض الشارات
        // ---------------------------------------------

        grid.innerHTML =
            allAchievements
                .map(
                    achievement =>
                        renderAchievement(
                            achievement,
                            unlockedMap.get(
                                achievement.id
                            )
                        )
                )
                .join("");


    } catch (error) {

        console.error(
            "Achievements unexpected error:",
            error
        );

        setMessage(
            "❌ حدث خطأ غير متوقع."
        );
    }
}


// =====================================================
// RENDER
// =====================================================

function renderAchievement(
    achievement,
    unlockedAt
) {

    const isUnlocked =
        Boolean(unlockedAt);


    const icon =
        escapeHtml(
            achievement.icon || "🏅"
        );


    const name =
        escapeHtml(
            achievement.name || "إنجاز"
        );


    const description =
        escapeHtml(
            achievement.description || ""
        );


    return `
        <article
            class="
                achievement-card
                ${isUnlocked ? "unlocked" : "locked"}
            "
        >

            <div class="achievement-icon">
                ${icon}
            </div>

            <h3>
                ${name}
            </h3>

            <p class="achievement-description">
                ${description}
            </p>

            <div class="achievement-requirement">
                ${getRequirementText(achievement)}
            </div>

            <div class="achievement-status">

                ${
                    isUnlocked

                    ? `
                        ✅ تم الحصول عليها

                        <small>
                            ${
                                unlockedAt
                                    ? `بتاريخ ${formatDate(unlockedAt)}`
                                    : ""
                            }
                        </small>
                    `

                    : `
                        🔒 لم تُفتح بعد
                    `
                }

            </div>

        </article>
    `;
}


// =====================================================
// REQUIREMENTS
// =====================================================

function getRequirementText(
    achievement
) {

    const requirements = [];


    const requiredXP =
        Number(
            achievement.required_xp || 0
        );


    const requiredExercises =
        Number(
            achievement.required_exercises || 0
        );


    if (requiredXP > 0) {

        requirements.push(
            `⭐ ${requiredXP} XP`
        );

    }


    if (requiredExercises > 0) {

        requirements.push(
            `📝 ${requiredExercises} تمارين`
        );

    }


    return requirements.length
        ? requirements.join(" • ")
        : "شروط خاصة";
}


// =====================================================
// HELPERS
// =====================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value;
    }
}


function setMessage(
    message
) {

    const element =
        document.getElementById(
            "achievementMessage"
        );

    if (element) {
        element.textContent =
            message;
    }
}


function formatDate(
    value
) {

    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }


    return date.toLocaleDateString(
        "ar-DZ"
    );
}


function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        String(value);

    return div.innerHTML;
}
