// =====================================================
// HAMOU MATH
// PUBLIC STUDENT PROFILE
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    loadProfile
);


async function loadProfile() {

    const user =
        await getCurrentUser();

    if (!user) {
        window.location.href =
            "login.html";
        return;
    }


    // ---------------------------------------------
    // البيانات العامة فقط
    // ---------------------------------------------

    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select(
            "full_name, role, xp, level"
        )
        .eq("id", user.id)
        .single();


    if (profileError) {

        console.error(
            "Profile error:",
            profileError
        );

        return;
    }


    const name =
        profile.full_name ||
        "طالب";


    setText(
        "profileName",
        name
    );


    setText(
        "profileRole",
        getRoleName(profile.role)
    );


    setText(
        "profileXP",
        Number(profile.xp || 0)
    );


    setText(
        "profileLevel",
        Number(profile.level || 1)
    );


    setText(
        "profileAvatar",
        getInitial(name)
    );


    // ---------------------------------------------
    // النتائج
    // ---------------------------------------------

    const {
        data: results,
        error: resultsError
    } = await supabaseClient
        .from("quiz_results")
        .select(
            "exercise_id, correct, xp"
        )
        .eq(
            "user_id",
            user.id
        );


    if (resultsError) {

        console.error(
            "Results error:",
            resultsError
        );

        return;
    }


    const rows =
        results || [];


    const completed =
        new Set(
            rows
                .filter(
                    row =>
                        Number(row.xp || 0) > 0
                )
                .map(
                    row =>
                        row.exercise_id
                )
        ).size;


    const attempts =
        rows.length;


    const correct =
        rows.filter(
            row =>
                row.correct === true
        ).length;


    const successRate =
        attempts > 0
            ? Math.round(
                (correct / attempts) * 100
            )
            : 0;


    setText(
        "profileExercises",
        completed
    );


    setText(
        "profileSuccess",
        `${successRate}%`
    );


    // ---------------------------------------------
    // التقدم في المستوى
    // ---------------------------------------------

    updateLevelProgress(
        Number(profile.xp || 0),
        Number(profile.level || 1)
    );


    // ---------------------------------------------
    // الشارات
    // ---------------------------------------------

    await loadBadges(user.id);
}


// =====================================================
// BADGES
// =====================================================

async function loadBadges(userId) {

    const box =
        document.getElementById(
            "profileBadges"
        );


    const {
        data,
        error
    } = await supabaseClient
        .from("user_achievements")
        .select(`
            unlocked_at,
            achievement_definitions (
                name,
                description,
                icon
            )
        `)
        .eq(
            "user_id",
            userId
        )
        .order(
            "unlocked_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Badge error:",
            error
        );

        box.textContent =
            "تعذر تحميل الشارات.";

        return;
    }


    if (!data || !data.length) {

        box.textContent =
            "لم تحصل على شارات بعد.";

        return;
    }


    box.innerHTML =
        data.map(item => {

            const badge =
                item.achievement_definitions;


            return `
                <div class="badge">

                    <div class="badge-icon">
                        ${escapeHtml(
                            badge?.icon || "🏅"
                        )}
                    </div>

                    <strong>
                        ${escapeHtml(
                            badge?.name || "إنجاز"
                        )}
                    </strong>

                    <small>
                        ${escapeHtml(
                            badge?.description || ""
                        )}
                    </small>

                </div>
            `;

        }).join("");
}


// =====================================================
// LEVEL PROGRESS
// =====================================================

function updateLevelProgress(
    xp,
    level
) {

    const currentLevelXP =
        (level - 1) * 100;


    const nextLevelXP =
        level * 100;


    const progressXP =
        Math.max(
            0,
            xp - currentLevelXP
        );


    const required =
        nextLevelXP -
        currentLevelXP;


    const percentage =
        Math.min(
            100,
            Math.round(
                (progressXP / required) * 100
            )
        );


    setText(
        "levelProgressText",
        `${progressXP} / ${required} XP إلى المستوى التالي`
    );


    const bar =
        document.getElementById(
            "levelProgressBar"
        );


    if (bar) {
        bar.style.width =
            `${percentage}%`;
    }
}


// =====================================================
// HELPERS
// =====================================================

function getRoleName(role) {

    const names = {
        student: "طالب",
        teacher: "أستاذ",
        researcher: "باحث",
        admin: "مدير",
        owner: "Owner"
    };

    return names[role] || "مستخدم";
}


function getInitial(name) {

    return String(name)
        .trim()
        .charAt(0) || "م";
}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value;
    }
}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;
}
