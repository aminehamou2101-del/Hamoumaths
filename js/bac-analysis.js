// =====================================================
// HAMOU MATH
// BAC RESULT ANALYSIS
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    loadLatestAnalysis
);


async function loadLatestAnalysis() {

    const user =
        await getCurrentUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }


    const {
        data: simulation,
        error: simulationError
    } = await supabaseClient
        .from("bac_simulation_results")
        .select("*")
        .eq("user_id", user.id)
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .limit(1)
        .maybeSingle();


    if (simulationError) {

        console.error(simulationError);

        setText(
            "mainSummary",
            "تعذر تحميل نتيجة المحاكاة."
        );

        return;
    }


    if (!simulation) {

        setText(
            "mainSummary",
            "لا توجد نتيجة بكالوريا بعد. ابدأ محاكاة أولًا."
        );

        return;
    }


    renderMainResult(simulation);


    const {
        data: details,
        error: detailsError
    } = await supabaseClient
        .from("bac_question_results")
        .select(`
            id,
            exercise_id,
            difficulty,
            question_order,
            user_answer,
            correct_answer,
            is_correct
        `)
        .eq(
            "simulation_id",
            simulation.id
        )
        .order(
            "question_order",
            {
                ascending: true
            }
        );


    if (detailsError) {

        console.error(detailsError);

        return;
    }


    const rows =
        details || [];


    renderDifficulty(rows);

    renderMistakes(rows);

    renderStrengths(rows);

    renderRecommendation(
        simulation,
        rows
    );
}


// =====================================================
// Main result
// =====================================================

function renderMainResult(simulation) {

    const score =
        Number(
            simulation.score_percent || 0
        );

    const correct =
        Number(
            simulation.correct_answers || 0
        );

    const wrong =
        Number(
            simulation.wrong_answers || 0
        );

    const total =
        Number(
            simulation.total_questions || 0
        );

    const seconds =
        Number(
            simulation.duration_seconds || 0
        );


    setText(
        "mainScore",
        `${score.toFixed(0)}%`
    );

    setText(
        "correctCount",
        correct
    );

    setText(
        "wrongCount",
        wrong
    );

    setText(
        "totalCount",
        total
    );

    setText(
        "duration",
        formatDuration(seconds)
    );


    setText(
        "mainSummary",
        `أجبت بشكل صحيح عن ${correct} من ${total} سؤالًا.`
    );
}


// =====================================================
// Difficulty
// =====================================================

function renderDifficulty(rows) {

    const box =
        document.getElementById(
            "difficultyAnalysis"
        );


    if (!rows.length) {

        box.textContent =
            "لا توجد بيانات كافية.";

        return;
    }


    const groups = {};


    rows.forEach(row => {

        const difficulty =
            row.difficulty || "غير محدد";


        if (!groups[difficulty]) {

            groups[difficulty] = {
                total: 0,
                correct: 0
            };

        }


        groups[difficulty].total++;


        if (row.is_correct) {
            groups[difficulty].correct++;
        }

    });


    box.innerHTML =
        Object.entries(groups)
            .map(
                ([difficulty, value]) => {

                    const percent =
                        value.total
                            ? Math.round(
                                (
                                    value.correct /
                                    value.total
                                ) * 100
                            )
                            : 0;


                    return `
                        <div class="difficulty-row">

                            <strong>
                                ${escapeHtml(
                                    difficulty
                                )}
                            </strong>

                            <br>

                            ✅ ${value.correct}
                            /
                            ${value.total}

                            — ${percent}%

                        </div>
                    `;
                }
            )
            .join("");
}


// =====================================================
// Mistakes
// =====================================================

async function renderMistakes(rows) {

    const box =
        document.getElementById(
            "mistakes"
        );


    const mistakes =
        rows.filter(
            row =>
                row.is_correct === false
        );


    if (!mistakes.length) {

        box.textContent =
            "🎉 ممتاز! لم تسجل أخطاء في هذه المحاكاة.";

        return;
    }


    const ids =
        mistakes
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
            .select("id,title")
            .in("id", ids);


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
        mistakes.map(
            row => {

                const title =
                    exerciseMap.get(
                        row.exercise_id
                    ) ||
                    `السؤال ${row.question_order}`;


                return `
                    <div class="mistake-row">

                        <strong>
                            ❌ ${escapeHtml(title)}
                        </strong>

                        <br>

                        <small>
                            الصعوبة:
                            ${escapeHtml(
                                row.difficulty || "غير محدد"
                            )}
                        </small>

                    </div>
                `;

            }
        ).join("");
}


// =====================================================
// Strengths
// =====================================================

function renderStrengths(rows) {

    const box =
        document.getElementById(
            "strengths"
        );


    const correct =
        rows.filter(
            row =>
                row.is_correct === true
        );


    if (!correct.length) {

        box.textContent =
            "ابدأ بالتدرب لبناء نقاط القوة.";

        return;
    }


    const byDifficulty = {};


    correct.forEach(row => {

        const key =
            row.difficulty ||
            "غير محدد";


        byDifficulty[key] =
            (byDifficulty[key] || 0) + 1;

    });


    const strengths =
        Object.entries(byDifficulty)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );


    box.innerHTML =
        strengths
            .map(
                ([difficulty, count]) =>
                    `
                    <div class="difficulty-row">

                        💪 لديك أداء جيد في:
                        <strong>
                            ${escapeHtml(
                                difficulty
                            )}
                        </strong>

                        — ${count} إجابة صحيحة.

                    </div>
                    `
            )
            .join("");
}
async function loadTreatmentPlan() {

    const box =
        document.getElementById(
            "treatmentPlan"
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

        console.error(
            "Treatment plan error:",
            error
        );

        box.textContent =
            "تعذر إعداد الخطة العلاجية.";

        return;
    }


    const recommendations =
        data || [];


    if (!recommendations.length) {

        box.innerHTML = `
            <div class="recommendation">
                🎉 لا توجد أخطاء كافية لإنشاء خطة علاجية.
                استمر في التدريب!
            </div>
        `;

        return;
    }


    box.innerHTML =
        recommendations
            .map(
                exercise => `
                    <div class="mistake-row">

                        <h3>
                            ${escapeHtml(
                                exercise.title
                            )}
                        </h3>

                        <p>
                            ${escapeHtml(
                                exercise.question
                            )}
                        </p>

                        <small>
                            الصعوبة:
                            ${escapeHtml(
                                exercise.difficulty || "غير محدد"
                            )}
                        </small>

                        ${
                            exercise.topic
                                ? `
                                    <p>
                                        📚 المهارة:
                                        ${escapeHtml(
                                            exercise.topic
                                        )}
                                    </p>
                                  `
                                : ""
                        }

                        ${
                            exercise.lesson_id
                                ? `
                                    <a
                                        class="action-btn"
                                        href="lesson.html?id=${encodeURIComponent(exercise.lesson_id)}"
                                    >
                                        📖 مراجعة الدرس
                                    </a>
                                  `
                                : ""
                        }

                    </div>
                `
            )
            .join("");
}

// =====================================================
// Recommendation
// =====================================================

function renderRecommendation(
    simulation,
    rows
) {

    const box =
        document.getElementById(
            "recommendation"
        );


    const wrong =
        rows.filter(
            row =>
                row.is_correct === false
        ).length;


    const total =
        rows.length;


    const rate =
        total
            ? Math.round(
                (
                    (total - wrong) /
                    total
                ) * 100
            )
            : 0;


    let recommendation;


    if (rate >= 90) {

        recommendation =
            "🏆 مستواك ممتاز. ركز الآن على الأسئلة الصعبة والمحاكاة الكاملة تحت ضغط الوقت.";

    }
    else if (rate >= 75) {

        recommendation =
            "⭐ مستواك جيد جدًا. راجع الأخطاء السابقة ثم انتقل إلى اختبارات أصعب.";

    }
    else if (rate >= 50) {

        recommendation =
            "📚 لديك أساس جيد، لكن تحتاج إلى مراجعة الدروس المرتبطة بالأسئلة الخاطئة وحل تمارين علاجية.";

    }
    else {

        recommendation =
            "🎯 ابدأ بمراجعة الأساسيات، ثم حل تمارين سهلة ومتوسطة قبل العودة إلى محاكاة البكالوريا.";

    }


    box.textContent =
        recommendation;
}
await loadTreatmentPlan();

// =====================================================
// Helpers
// =====================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


function formatDuration(seconds) {

    const minutes =
        Math.floor(seconds / 60);

    const remaining =
        seconds % 60;


    return `${minutes} د ${remaining} ث`;
}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;
}
