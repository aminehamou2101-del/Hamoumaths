// =====================================================
// HAMOU MATH
// BAC SIMULATION
// =====================================================

let examQuestions = [];
let examAnswers = [];
let currentQuestion = 0;
let timerSeconds = 0;
let timerId = null;
let examFinished = false;


// =====================================================
// START
// =====================================================

async function startExam() {

    const user = await getCurrentUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const count =
        Number(
            document.getElementById("questionCount").value
        );

    const duration =
        Number(
            document.getElementById("duration").value
        );


    const {
        data,
        error
    } = await supabaseClient
        .from("exercises")
        .select(`
            id,
            title,
            question,
            answer,
            difficulty
        `)
        .limit(count * 3);


    if (error) {
        console.error(error);
        alert("تعذر تحميل أسئلة الاختبار.");
        return;
    }


    if (!data || !data.length) {
        alert("لا توجد تمارين متاحة حاليًا.");
        return;
    }


    examQuestions =
        shuffle([...data]).slice(
            0,
            Math.min(count, data.length)
        );


    examAnswers =
        new Array(
            examQuestions.length
        ).fill("");


    currentQuestion = 0;
    examFinished = false;

    document.getElementById("startCard")
        .style.display = "none";

    document.getElementById("examCard")
        .style.display = "grid";

    document.getElementById("resultCard")
        .style.display = "none";


    document.getElementById("totalQuestions")
        .textContent =
        examQuestions.length;


    timerSeconds =
        duration * 60;


    startTimer();

    renderQuestion();
}


// =====================================================
// QUESTION
// =====================================================

function renderQuestion() {

    if (!examQuestions.length) return;


    const item =
        examQuestions[currentQuestion];


    document.getElementById("questionNumber")
        .textContent =
        `السؤال ${currentQuestion + 1}`;


    document.getElementById("questionText")
        .textContent =
        item.question;


    document.getElementById("answerInput")
        .value =
        examAnswers[currentQuestion] || "";


    document.getElementById("currentIndex")
        .textContent =
        currentQuestion + 1;


    const percent =
        ((currentQuestion + 1) /
            examQuestions.length) * 100;


    document.getElementById("examProgress")
        .style.width =
        `${percent}%`;
}


// =====================================================
// NAVIGATION
// =====================================================

function saveCurrentAnswer() {

    examAnswers[currentQuestion] =
        document.getElementById(
            "answerInput"
        ).value.trim();
}


function nextQuestion() {

    if (examFinished) return;

    saveCurrentAnswer();

    if (
        currentQuestion <
        examQuestions.length - 1
    ) {

        currentQuestion++;

        renderQuestion();

    } else {

        finishExam();

    }
}


function previousQuestion() {

    if (examFinished) return;

    saveCurrentAnswer();

    if (currentQuestion > 0) {

        currentQuestion--;

        renderQuestion();

    }
}


// =====================================================
// TIMER
// =====================================================

function startTimer() {

    clearInterval(timerId);

    renderTimer();

    timerId =
        setInterval(() => {

            if (examFinished) {
                clearInterval(timerId);
                return;
            }

            timerSeconds--;

            renderTimer();

            if (timerSeconds <= 0) {

                clearInterval(timerId);

                alert(
                    "⏰ انتهى الوقت."
                );

                finishExam();

            }

        }, 1000);
}


function renderTimer() {

    const minutes =
        Math.floor(timerSeconds / 60);

    const seconds =
        timerSeconds % 60;


    document.getElementById("timer")
        .textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


// =====================================================
// FINISH
// =====================================================

async function finishExam() {

    if (examFinished) return;

    saveCurrentAnswer();

    examFinished = true;

    clearInterval(timerId);


    const user =
        await getCurrentUser();


    if (!user) {
        window.location.href = "login.html";
        return;
    }


    let correct = 0;


    for (
        let i = 0;
        i < examQuestions.length;
        i++
    ) {

        const question =
            examQuestions[i];


        const given =
            normalizeAnswer(
                examAnswers[i]
            );


        const expected =
            normalizeAnswer(
                question.answer
            );


        const isCorrect =
            given !== "" &&
            given === expected;


        if (isCorrect) {
            correct++;
        }


        /*
         * نحفظ النتيجة لكل سؤال.
         * XP لا نمنحه هنا حتى لا نكافئ الطالب
         * مرتين عن نفس التمرين.
         */
        await supabaseClient
            .from("quiz_results")
            .insert({
                user_id: user.id,
                exercise_id: question.id,
                correct: isCorrect,
                xp: 0
            });
    }


    const total =
        examQuestions.length;


    const percentage =
        total
            ? Math.round(
                (correct / total) * 100
            )
            : 0;


    document.getElementById("examCard")
        .style.display = "none";


    document.getElementById("resultCard")
        .style.display = "block";


    document.getElementById("resultScore")
        .textContent =
        `${percentage}%`;


    document.getElementById("resultDetails")
        .textContent =
        `أجبت بشكل صحيح عن ${correct} من ${total} سؤال.`;
}


// =====================================================
// HELPERS
// =====================================================

function normalizeAnswer(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}


function shuffle(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            array[i],
            array[j]
        ] = [
            array[j],
            array[i]
        ];
    }

    return array;
}
