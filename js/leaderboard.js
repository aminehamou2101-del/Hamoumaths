// =====================================================
// HAMOU MATH
// PUBLIC LEADERBOARD
// =====================================================

const leaderboardList =
    document.getElementById("leaderboardList");

const leaderboardStatus =
    document.getElementById("leaderboardStatus");

const refreshButton =
    document.getElementById("refreshLeaderboard");


async function loadLeaderboard() {

    setStatus("جارٍ تحميل الترتيب...");

    leaderboardList.innerHTML = "";

    const {
        data,
        error
    } = await supabaseClient
        .rpc("get_public_leaderboard", {
            p_limit: 50
        });


    if (error) {

        console.error(
            "Leaderboard error:",
            error
        );

        setStatus(
            "تعذر تحميل الترتيب حاليًا."
        );

        return;
    }


    if (!data || data.length === 0) {

        setStatus(
            "لا يوجد طلاب في الترتيب حاليًا."
        );

        return;
    }


    setStatus(
        `تم تحميل ${data.length} طالب`
    );


    leaderboardList.innerHTML =
        data.map(renderStudent).join("");
}


function renderStudent(student) {

    const rank =
        Number(student.rank || 0);

    const name =
        escapeHtml(
            student.display_name || "طالب"
        );

    const xp =
        Number(student.xp || 0);

    const level =
        Number(student.level || 1);


    let medal = "";

    if (rank === 1) {
        medal = "🥇";
    }
    else if (rank === 2) {
        medal = "🥈";
    }
    else if (rank === 3) {
        medal = "🥉";
    }
    else {
        medal = `#${rank}`;
    }


    const topClass =
        rank <= 3
            ? ` top-${rank}`
            : "";


    return `
        <article class="leaderboard-row${topClass}">

            <div class="rank">
                ${medal}
            </div>

            <div class="student-info">

                <div class="student-avatar">
                    ${getInitial(name)}
                </div>

                <div>
                    <strong>
                        ${name}
                    </strong>

                    <small>
                        المستوى ${level}
                    </small>
                </div>

            </div>

            <div class="student-xp">
                <span>⭐</span>
                <strong>${xp}</strong>
                <small>XP</small>
            </div>

        </article>
    `;
}


function getInitial(name) {

    const value =
        String(name).trim();

    return value
        ? escapeHtml(value.charAt(0))
        : "م";
}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;
}


function setStatus(message) {

    if (leaderboardStatus) {
        leaderboardStatus.textContent =
            message;
    }
}


if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        loadLeaderboard
    );

}


loadLeaderboard();
async function loadRanking(){


const {

data,

error

}= await supabaseClient

.from("profiles")

.select(
"full_name,xp,level"
)

.order(
"xp",
{
ascending:false
}
)

.limit(50);



if(error){

console.error(error);

return;

}



const box =
document.getElementById(
"ranking"
);



box.innerHTML="";



data.forEach(
(user,index)=>{


box.innerHTML += `


<div class="card">


<h3>

${index+1} 🏅 ${user.full_name || "طالب"}

</h3>


<p>
⭐ XP: ${user.xp}
</p>


<p>
المستوى: ${user.level}
</p>


</div>


`;


});


}



loadRanking();
