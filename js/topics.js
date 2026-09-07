// =====================================================
// HAMOU MATH
// OFFICIAL CURRICULUM TOPICS
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    loadCurriculum
);


async function loadCurriculum() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const level =
        params.get("level") || "";


    const title =
        document.getElementById(
            "pageTitle"
        );

    const container =
        document.getElementById(
            "topicsContainer"
        );


    if (!level) {

        title.textContent =
            "المستوى غير محدد";

        container.textContent =
            "اختر مستوى دراسي أولًا.";

        return;
    }


    title.textContent =
        `📚 ${level}`;


    const {
        data,
        error
    } = await supabaseClient

        .from("curriculum")

        .select(`
            id,
            level,
            subject,
            unit,
            topic,
            description,
            order_number
        `)

        .eq(
            "level",
            level
        )

        .eq(
            "is_active",
            true
        )

        .order(
            "order_number",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Curriculum error:",
            error
        );

        container.textContent =
            "تعذر تحميل المنهج.";

        return;
    }


    if (!data || !data.length) {

        container.innerHTML = `
            <div class="card">
                لا توجد وحدات منشورة لهذا المستوى حتى الآن.
            </div>
        `;

        return;
    }


    // ---------------------------------------------
    // تجميع حسب المادة ثم الوحدة
    // ---------------------------------------------

    const grouped =
        new Map();


    data.forEach(item => {

        const key =
            `${item.subject}|||${item.unit}`;


        if (!grouped.has(key)) {

            grouped.set(
                key,
                {
                    subject: item.subject,
                    unit: item.unit,
                    topics: []
                }
            );
        }


        grouped
            .get(key)
            .topics
            .push(item);

    });


    container.innerHTML =
        Array.from(
            grouped.values()
        )
        .map(
            renderUnit
        )
        .join("");
}


// =====================================================
// UNIT
// =====================================================

function renderUnit(unit) {

    const topics =
        unit.topics
            .map(
                topic => `

                    <a
                        class="action-btn"
                        href="search.html?level=${encodeURIComponent(topic.level || "")}&subject=${encodeURIComponent(unit.subject)}&unit=${encodeURIComponent(unit.unit)}&topic=${encodeURIComponent(topic.topic)}"
                    >

                        🧩
                        ${escapeHtml(topic.topic)}

                    </a>

                `
            )
            .join("");


    return `

        <article class="card">

            <h2>
                📖 ${escapeHtml(unit.unit)}
            </h2>

            <p>
                المادة:
                ${escapeHtml(unit.subject)}
            </p>

            <div>
                ${topics}
            </div>

        </article>

    `;
}


// =====================================================
// HELPERS
// =====================================================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;
}
