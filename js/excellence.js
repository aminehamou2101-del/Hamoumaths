// =====================================================
// HAMOU MATH
// EXCELLENCE CENTER
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    loadExcellence
);


async function loadExcellence() {

    const user =
        await getCurrentUser();

    if (!user) {
        window.location.href =
            "login.html";
        return;
    }


    // ---------------------------------------------
    // Profile
    // ---------------------------------------------

    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select(
            "full_name, xp, level"
        )
        .eq(
            "id",
            user.id
        )
        .single();


    if (profileError) {
        console.error(profileError);
        return;
    }


    const xp =
        Number(profile.xp || 0);

    const level =
        Number(profile.level || 1);


    setText(
        "studentName",
        profile.full_name || "طالب"
    );

    setText(
        "studentXP",
        xp
    );

    setText(
        "studentLevel",
        level
    );


    // ---------------------------------------------
    // Results
    // ---------------------------------------------

    const {
        data: results,
        error: resultsError
    } = await supabaseClient
        .from("quiz_results")
        .select(
            "exercise_id, correct, xp, created_at"
        )
        .eq(
            "user_id",
            user.id
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (resultsError) {
        console.error(resultsError);
        return;
    }


    const rows =
        results || [];


    const attempts =
        rows.length;


    const correct =
        rows.filter(
            row => row.correct === true
        ).length;


    const successRate =
        attempts
            ? Math.round(
                (correct / attempts) * 100
            )
            : 0;


    setText(
        "attempts",
        attempts
    );

    setText(
        "correct",
        correct
    );

    setText(
        "successRate",
        `${successRate}%`
    );


    // ---------------------------------------------
    // Daily task
    // ---------------------------------------------

    const today =
        new Date();


    today.setHours(
        0, 0, 0, 0
    );


    const todayResults =
        rows.filter(row => {

            const date =
                new Date(
                    row.created_at
                );

            date.setHours(
                0, 0, 0, 0
            );

            return (
                date.getTime() ===
                today.getTime()
            );

        });


    const dailyCompleted =
        Math.min(
            todayResults.length,
            3
        );


    const dailyPercent =
        Math.round(
            (dailyCompleted / 3) * 100
        );


    setText(
        "dailyTask",
        `${dailyCompleted}/3`
    );


    const dailyBar =
        document.getElementById(
            "dailyProgress"
        );


    if (dailyBar) {
        dailyBar.style.width =
            `${dailyPercent}%`;
    }


    // ---------------------------------------------
    // Next XP goal
    // ---------------------------------------------

    const goal =
        Math.ceil(
            (xp + 1) / 100
        ) * 100;


    const remaining =
        goal - xp;


    setText(
        "nextGoal",
        `${remaining} XP`
    );


    setText(
        "goalText",
        `تحتاج ${remaining} XP للوصول إلى ${goal} XP`
    );


    // ---------------------------------------------
    // Wrong answers
    // ---------------------------------------------

    renderMistakes(rows);


    // ---------------------------------------------
    // Recent activity
    // ---------------------------------------------

    renderRecentActivity(rows);
}


// =====================================================
// Mistakes
// =====================================================

async function renderMistakes(rows) {

    const box =
        document.getElementById(
            "mistakes"
        );


    const wrong =
        rows
            .filter(
                row =>
                    row.correct === false
            )
            .slice(0, 5);


    if (!wrong.length) {

        box.innerHTML =
            "🎉 لا توجد إجابات خاطئة حديثة.";

        return;
    }


    // نعرف عناوين التمارين
    const ids =
        wrong
            .map(row => row.exercise_id)
            .filter(Boolean);


    let exerciseMap =
        new Map();


    if (ids.length) {

        const {
            data,
            error
        } = await supabaseClient
            .from("exercises")
            .select(
                "id, title"
            )
            .in(
                "id",
                ids
            );


        if (!error) {

            (data || []).forEach(
                exercise => {

                    exerciseMap.set(
                        exercise.id,
                        exercise.title
                    );

                }
            );

        }
    }


    box.innerHTML =
        wrong.map(row => {

            const title =
                exerciseMap.get(
                    row.exercise_id
                ) ||
                "تمرين";


            return `
                <div class="mistake-item">

                    ❌
                    ${escapeHtml(title)}

                    <br>

                    <small>
                        راجع هذا الموضوع وحاول من جديد.
                    </small>

                </div>
            `;

        }).join("");
}


// =====================================================
// Recent activity
// =====================================================

function renderRecentActivity(rows) {

    const box =
        document.getElementById(
            "recentActivity"
        );


    const recent =
        rows.slice(0, 8);


    if (!recent.length) {

        box.innerHTML =
            "<li>لا يوجد نشاط بعد.</li>";

        return;
    }


    box.innerHTML =
        recent.map(row => {

            const status =
                row.correct
                    ? "✅ إجابة صحيحة"
                    : "❌ إجابة خاطئة";


            const xp =
                Number(row.xp || 0);


            return `
                <li>
                    ${status}
                    — +${xp} XP
                    <br>
                    <small>
                        ${formatDate(row.created_at)}
                    </small>
                </li>
            `;

        }).join("");
}


// =====================================================
// Helpers
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


function formatDate(value) {

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleString(
        "ar-DZ"
    );
}


function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        String(value);

    return div.innerHTML;
}
async function loadRecommendedExercises() {

    const box =
        document.getElementById(
            "recommendedExercises"
        );

    if (!box) return;


    const {
        data,
        error
    } = await supabaseClient
        .rpc(
            "get_my_recommendations"
        );


    if (error) {

        console.error(error);

        box.textContent =
            "تعذر تحميل التوصيات.";

        return;
    }


    if (!data?.length) {

        box.textContent =
            "🎉 لا توجد تمارين علاجية مقترحة الآن.";

        return;
    }


    box.innerHTML =
        data.map(
            item => `
                <div class="mistake-item">

                    <strong>
                        ${escapeHtml(
                            item.title
                        )}
                    </strong>

                    <p>
                        ${escapeHtml(
                            item.question
                        )}
                    </p>

                    <a
                        class="action-btn"
                        href="exercises.html"
                    >
                        📝 حل التمرين
                    </a>

                </div>
            `
        ).join("");
}
