// =====================================================
// HAMOU MATH
// STUDENT STATISTICS
// =====================================================

async function loadStudentStats() {

    const user = await getCurrentUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // -----------------------------------------
    // بيانات الملف الشخصي
    // -----------------------------------------

    const { data: profile, error: profileError } =
        await supabaseClient
            .from("profiles")
            .select("id, full_name, role, xp, level")
            .eq("id", user.id)
            .single();

    if (profileError) {
        console.error("Profile error:", profileError);
        return;
    }

    setText("studentName", profile.full_name || "طالب");
    setText("studentRole", profile.role || "student");
    setText("studentXP", profile.xp ?? 0);
    setText("studentLevel", profile.level ?? 1);


    // -----------------------------------------
    // نتائج الاختبارات
    // -----------------------------------------

    const { data: results, error: resultsError } =
        await supabaseClient
            .from("quiz_results")
            .select("exercise_id, correct, xp, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

    if (resultsError) {
        console.error("Results error:", resultsError);
        return;
    }

    const rows = results || [];

    const attempts = rows.length;

    const correctAnswers =
        rows.filter(row => row.correct === true).length;

    const totalXP =
        rows.reduce(
            (sum, row) => sum + Number(row.xp || 0),
            0
        );

    const successRate =
        attempts > 0
            ? Math.round((correctAnswers / attempts) * 100)
            : 0;

    // عدد التمارين التي حصل منها الطالب على XP
    const completedExercises =
        new Set(
            rows
                .filter(row => Number(row.xp || 0) > 0)
                .map(row => row.exercise_id)
        ).size;


    setText("attemptsCount", attempts);
    setText("correctCount", correctAnswers);
    setText("successRate", `${successRate}%`);
    setText("completedCount", completedExercises);
    setText("earnedXP", totalXP);


    // -----------------------------------------
    // آخر المحاولات
    // -----------------------------------------

    renderRecentResults(rows.slice(0, 10));
}


// =====================================================
// عرض آخر النتائج
// =====================================================

function renderRecentResults(rows) {

    const box = document.getElementById("recentResults");

    if (!box) return;

    if (!rows.length) {
        box.textContent = "لا توجد محاولات بعد.";
        return;
    }

    box.innerHTML = rows.map(row => {

        const status =
            row.correct
                ? "✅ صحيحة"
                : "❌ خاطئة";

        const xp =
            Number(row.xp || 0);

        return `
            <div class="result-item">
                <span>${status}</span>
                <span>+${xp} XP</span>
                <small>
                    ${formatDate(row.created_at)}
                </small>
            </div>
        `;

    }).join("");
}


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


function formatDate(value) {

    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString("ar-DZ");
}


document.addEventListener(
    "DOMContentLoaded",
    loadStudentStats
);
