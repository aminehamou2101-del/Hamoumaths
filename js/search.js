// =====================================================
// HAMOU MATH
// GLOBAL SEARCH
// =====================================================

const searchInput =
    document.getElementById("searchInput");

const searchType =
    document.getElementById("searchType");

const searchButton =
    document.getElementById("searchButton");

const searchStatus =
    document.getElementById("searchStatus");

const searchResults =
    document.getElementById("searchResults");


function setSearchStatus(message) {

    if (searchStatus) {
        searchStatus.textContent = message;
    }
}


function clearResults() {

    if (searchResults) {
        searchResults.innerHTML = "";
    }
}


async function runSearch() {

    const term =
        String(
            searchInput?.value || ""
        ).trim();

    const type =
        searchType?.value || "all";


    clearResults();


    if (term.length < 2) {

        setSearchStatus(
            "اكتب حرفين على الأقل للبحث."
        );

        return;
    }


    setSearchStatus(
        "⏳ جارٍ البحث..."
    );


    try {

        const results = [];


        // ---------------------------------------------
        // الموارد
        // ---------------------------------------------

        if (
            type === "all" ||
            type === "resource"
        ) {

            const {
                data,
                error
            } = await supabaseClient
                .from("resources")
                .select(
                    "id, title, description, type, file_url, created_at"
                )
                .ilike(
                    "title",
                    `%${escapeLike(term)}%`
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(30);


            if (error) {
                throw error;
            }


            (data || []).forEach(item => {

                results.push({
                    kind: "resource",
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    type: item.type,
                    url: item.file_url
                });

            });
        }


        // ---------------------------------------------
        // الدروس
        // ---------------------------------------------

        if (
            type === "all" ||
            type === "lesson"
        ) {

            const {
                data,
                error
            } = await supabaseClient
                .from("lessons")
                .select(
                    "id, title, content, course_id, created_at"
                )
                .ilike(
                    "title",
                    `%${escapeLike(term)}%`
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(30);


            if (error) {
                throw error;
            }


            (data || []).forEach(item => {

                results.push({
                    kind: "lesson",
                    id: item.id,
                    title: item.title,
                    description:
                        item.content || "",
                    url:
                        `lesson.html?id=${encodeURIComponent(item.id)}`
                });

            });
        }


        // ---------------------------------------------
        // التمارين
        // ---------------------------------------------

        if (
            type === "all" ||
            type === "exercise"
        ) {

            const {
                data,
                error
            } = await supabaseClient
                .from("exercises")
                .select(
                    "id, title, question, difficulty, created_at"
                )
                .or(
                    `title.ilike.%${escapeLike(term)}%,question.ilike.%${escapeLike(term)}%`
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(30);


            if (error) {
                throw error;
            }


            (data || []).forEach(item => {

                results.push({
                    kind: "exercise",
                    id: item.id,
                    title: item.title,
                    description: item.question,
                    difficulty: item.difficulty
                });

            });
        }


        renderResults(
            results,
            term
        );


    } catch (error) {

        console.error(
            "Search error:",
            error
        );

        setSearchStatus(
            "❌ حدث خطأ أثناء البحث."
        );
    }
}


function renderResults(
    results,
    term
) {

    if (!results.length) {

        setSearchStatus(
            `لا توجد نتائج لـ "${term}".`
        );

        return;
    }


    setSearchStatus(
        `تم العثور على ${results.length} نتيجة.`
    );


    searchResults.innerHTML =
        results.map(
            renderResult
        ).join("");
}


function renderResult(item) {

    const badge =
        getTypeLabel(item.kind);


    let action = "";


    if (
        item.kind === "resource" &&
        item.url
    ) {

        action = `
            <a
                class="search-action"
                href="${escapeAttribute(item.url)}"
                target="_blank"
                rel="noopener noreferrer"
            >
                📄 فتح
            </a>
        `;
    }


    if (item.kind === "lesson") {

        action = `
            <a
                class="search-action"
                href="${escapeAttribute(item.url)}"
            >
                📖 فتح الدرس
            </a>
        `;
    }


    if (item.kind === "exercise") {

        action = `
            <a
                class="search-action"
                href="exercises.html"
            >
                📝 حل التمرين
            </a>
        `;
    }


    return `
        <article class="search-card">

            <span class="search-badge">
                ${badge}
            </span>

            <h3>
                ${escapeHtml(item.title || "بدون عنوان")}
            </h3>

            <p>
                ${escapeHtml(
                    truncate(
                        item.description || "",
                        180
                    )
                )}
            </p>

            ${
                item.difficulty
                    ? `
                        <small>
                            الصعوبة:
                            ${escapeHtml(
                                item.difficulty
                            )}
                        </small>
                      `
                    : ""
            }

            <div>
                ${action}
            </div>

        </article>
    `;
}


function getTypeLabel(kind) {

    if (kind === "resource") {
        return "📚 مورد";
    }

    if (kind === "lesson") {
        return "📖 درس";
    }

    if (kind === "exercise") {
        return "📝 تمرين";
    }

    return "محتوى";
}


function truncate(
    text,
    max
) {

    const value =
        String(text);


    return value.length > max
        ? value.slice(0, max) + "…"
        : value;
}


function escapeLike(value) {

    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_");
}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;
}


function escapeAttribute(value) {

    return escapeHtml(value)
        .replace(/'/g, "&#39;");
}


searchButton?.addEventListener(
    "click",
    runSearch
);


searchInput?.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            runSearch();
        }

    }
);
