// =====================================================
// HAMOU MATH
// MY LEADERBOARD POSITION
// =====================================================

async function loadMyRanking() {

    const box =
        document.getElementById("myRanking");

    if (!box) return;

    const user =
        await getCurrentUser();

    if (!user) {
        box.textContent =
            "يجب تسجيل الدخول.";
        return;
    }

    const {
        data,
        error
    } = await supabaseClient
        .rpc("get_my_leaderboard_position");

    if (error) {

        console.error(
            "My ranking error:",
            error
        );

        box.textContent =
            "تعذر تحميل ترتيبك.";
        return;
    }

    const result =
        data?.[0];

    if (!result) {

        box.textContent =
            "لا يوجد ترتيب متاح.";
        return;
    }

    box.innerHTML = `
        <div class="my-ranking-main">
            🏅 ترتيبك الحالي:
            <strong>#${Number(result.my_rank)}</strong>
        </div>

        <div class="my-ranking-details">
            من أصل
            <strong>${Number(result.total_students)}</strong>
            طالبًا
            •
            ⭐ ${Number(result.my_xp)} XP
            •
            المستوى ${Number(result.my_level)}
        </div>
    `;
}


document.addEventListener(
    "DOMContentLoaded",
    loadMyRanking
);
