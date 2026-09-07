// =====================================================
// HAMOU MATH
// LESSON PAGE
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    loadLesson
);


async function loadLesson() {

    const status =
        document.getElementById("status");

    const header =
        document.getElementById("lessonHeader");

    const content =
        document.getElementById("lessonContent");


    const params =
        new URLSearchParams(
            window.location.search
        );


    const lessonId =
        params.get("id");


    if (!lessonId) {

        showError(
            "رابط الدرس غير صالح."
        );

        return;
    }


    // ---------------------------------------------
    // جلب الدرس
    // ---------------------------------------------

    const {
        data: lesson,
        error
    } = await supabaseClient
        .from("lessons")
        .select(`
            id,
            title,
            content,
            video_url,
            course_id
        `)
        .eq(
            "id",
            lessonId
        )
        .single();


    if (error || !lesson) {

        console.error(error);

        showError(
            "تعذر العثور على هذا الدرس."
        );

        return;
    }


    // ---------------------------------------------
    // عنوان الدورة
    // ---------------------------------------------

    let courseTitle = "";


    if (lesson.course_id) {

        const {
            data: course
        } = await supabaseClient
            .from("courses")
            .select("title")
            .eq(
                "id",
                lesson.course_id
            )
            .maybeSingle();


        courseTitle =
            course?.title || "";
    }


    // ---------------------------------------------
    // عرض الدرس
    // ---------------------------------------------

    document.getElementById(
        "lessonTitle"
    ).textContent =
        lesson.title;


    document.getElementById(
        "lessonCourse"
    ).textContent =
        courseTitle
            ? `📚 ${courseTitle}`
            : "📚 درس رياضيات";


    /*
     * content هنا يعرض كنص HTML.
     * لتقليل مخاطر XSS لا نعطي المحتوى القادم
     * من المستخدم innerHTML مباشرة.
     */
    document.getElementById(
        "lessonText"
    ).textContent =
        lesson.content || "لا يوجد محتوى لهذا الدرس.";


    // ---------------------------------------------
    // الفيديو
    // ---------------------------------------------

    if (lesson.video_url) {

        const videoBox =
            document.getElementById(
                "lessonVideo"
            );


        const url =
            normalizeVideoUrl(
                lesson.video_url
            );


        if (url) {

            videoBox.innerHTML = `
                <h2>🎥 شرح الفيديو</h2>

                <iframe
                    src="${escapeAttribute(url)}"
                    title="Lesson video"
                    loading="lazy"
                    allowfullscreen
                ></iframe>
            `;

            videoBox.style.display =
                "block";
        }
    }


    status.textContent =
        "";


    header.style.display =
        "block";


    content.style.display =
        "block";


    // ---------------------------------------------
    // تمارين الدرس
    // ---------------------------------------------

    await loadRelatedExercises(
        lesson.id
    );
}


// =====================================================
// RELATED EXERCISES
// =====================================================

async function loadRelatedExercises(
    lessonId
) {

    const box =
        document.getElementById(
            "relatedExercises"
        );


    const {
        data,
        error
    } = await supabaseClient
        .from("exercises")
        .select(
            "id, title, question, difficulty"
        )
        .eq(
            "lesson_id",
            lessonId
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(error);

        box.textContent =
            "تعذر تحميل تمارين الدرس.";

        return;
    }


    if (!data || !data.length) {

        box.textContent =
            "لا توجد تمارين مرتبطة بهذا الدرس حاليًا.";

        return;
    }


    box.innerHTML =
        data.map(
            exercise => `
                <div class="exercise-card">

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

                    <br>

                    <a
                        class="lesson-btn"
                        href="exercises.html"
                    >
                        📝 حل التمرين
                    </a>

                </div>
            `
        ).join("");
}


// =====================================================
// VIDEO URL
// =====================================================

function normalizeVideoUrl(
    value
) {

    const raw =
        String(value || "").trim();


    if (!raw) return "";


    try {

        const url =
            new URL(raw);


        const host =
            url.hostname.toLowerCase();


        // YouTube
        if (
            host.includes("youtube.com")
        ) {

            const videoId =
                url.searchParams.get(
                    "v"
                );

            if (videoId) {

                return `
                    https://www.youtube.com/embed/
                    ${encodeURIComponent(videoId)}
                `.replace(/\s+/g, "");
            }
        }


        if (
            host === "youtu.be"
        ) {

            const videoId =
                url.pathname
                    .replace("/", "");


            if (videoId) {

                return `
                    https://www.youtube.com/embed/
                    ${encodeURIComponent(videoId)}
                `.replace(/\s+/g, "");
            }
        }


        return "";
    }

    catch {

        return "";
    }
}


// =====================================================
// HELPERS
// =====================================================

function showError(message) {

    const status =
        document.getElementById(
            "status"
        );

    if (status) {
        status.textContent =
            message;
    }
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


function escapeAttribute(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
