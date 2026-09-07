// =====================================================
// HAMOU MATH
// CURRICULUM TOPICS
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    loadTopics
);


async function loadTopics() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const level =
        params.get("level") || "";


    const title =
        document.getElementById("pageTitle");

    const container =
        document.getElementById(
            "topicsContainer"
        );


    if (!level) {

        container.textContent =
            "لم يتم تحديد المستوى.";

        return;
    }


    title.textContent =
        `📚 ${level}`;


    /*
     * نقرأ الوحدات والمواضيع الموجودة فعليًا
     * في الدروس والتمارين.
     */

    const [
        lessonsResult,
        exercisesResult
    ] = await Promise.all([

        supabaseClient
            .from("lessons")
            .select(
                "subject,unit,topic"
            )
            .eq(
                "level",
                level
            ),

        supabaseClient
            .from("exercises")
            .select(
                "subject,unit,topic"
            )
            .eq(
                "level",
                level
            )
    ]);


    if (lessonsResult.error) {

        console.error(
            lessonsResult.error
        );
    }


    if (exercisesResult.error) {

        console.error(
            exercisesResult.error
        );
    }


    const rows = [

        ...(lessonsResult.data || []),
        ...(exercisesResult.data || [])

    ];


    const map =
        new Map();


    rows.forEach(row => {

        const subject =
            row.subject ||
            "رياضيات";


        const unit =
            row.unit ||
            "غير مصنف";


        const topic =
            row.topic ||
            "موضوع عام";


        const key =
            `${subject}|||${unit}`;


        if (!map.has(key)) {

            map.set(key, {
                subject,
                unit,
                topics: new Set()
            });

        }


        map
            .get(key)
            .topics
            .add(topic);

    });


    if (!map.size) {

        container.innerHTML = `
            <div class="card">
                لا توجد وحدات مصنفة لهذا المستوى حتى الآن.
            </div>
        `;

        return;
    }


    container.innerHTML =
        Array.from(map.values())
            .map(item => {

                const topics =
                    Array.from(
                        item.topics
                    );


                const topicLinks =
                    topics
                        .map(
                            topic => `
                                <a
                                    class="action-btn"
                                    href="search.html?level=${encodeURIComponent(level)}&subject=${encodeURIComponent(item.subject)}&unit=${encodeURIComponent(item.unit)}&q=${encodeURIComponent(topic)}"
                                >
                                    ${escapeHtml(topic)}
                                </a>
                            `
                        )
                        .join("");


                return `
                    <article class="card">

                        <h2>
                            📖 ${escapeHtml(item.unit)}
                        </h2>

                        <p>
                            المادة:
                            ${escapeHtml(item.subject)}
                        </p>

                        <div>
                            ${topicLinks}
                        </div>

                    </article>
                `;

            })
            .join("");
}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;
}
