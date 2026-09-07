// =====================================================
// HAMOU MATH
// ADVANCED SEARCH
// =====================================================

const searchInput =
    document.getElementById("searchInput");

const searchType =
    document.getElementById("searchType");

const searchLevel =
    document.getElementById("searchLevel");

const searchSubject =
    document.getElementById("searchSubject");

const searchUnit =
    document.getElementById("searchUnit");

const searchDifficulty =
    document.getElementById("searchDifficulty");

const searchButton =
    document.getElementById("searchButton");

const searchStatus =
    document.getElementById("searchStatus");

const searchResults =
    document.getElementById("searchResults");


function setStatus(message) {

    if (searchStatus) {
        searchStatus.textContent = message;
    }
}


function clearResults() {

    if (searchResults) {
        searchResults.innerHTML = "";
    }
}


function buildLike(value) {

    return `%${String(value)
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_")}%`;
}


async function runSearch() {

    const term =
        String(searchInput?.value || "").trim();

    const type =
        searchType?.value || "all";

    const level =
        searchLevel?.value || "";

    const subject =
        String(searchSubject?.value || "").trim();

    const unit =
        String(searchUnit?.value || "").trim();

    const difficulty =
        searchDifficulty?.value || "";


    clearResults();


    if (
        term.length < 2 &&
        !level &&
        !subject &&
        !unit &&
        !difficulty
    ) {

        setStatus(
            "اكتب حرفين على الأقل أو اختر فلترًا."
        );

        return;
    }


    setStatus("⏳ جارٍ البحث...");


    try {

        const results = [];


        // =================================================
        // RESOURCES
        // =================================================

        if (
            type === "all" ||
            type === "resource"
        ) {

            let query =
                supabaseClient
                    .from("resources")
                    .select(`
                        id,
                        title,
                        description,
                        type,
                        file_url,
                        level,
                        subject,
                        unit,
                        difficulty,
                        created_at
                    `)
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    )
                    .limit(50);


            if (term.length >= 2) {

                const pattern =
                    buildLike(term);

                query =
                    query.or(
                        `title.ilike.${pattern},description.ilike.${pattern}`
                    );
            }


            if (level) {
                query =
                    query.eq(
                        "level",
                        level
                    );
            }


            if (subject) {
                query =
                    query.ilike(
                        "subject",
                        buildLike(subject)
                    );
            }


            if (unit) {
                query =
                    query.ilike(
                        "unit",
                        buildLike(unit)
                    );
            }


            if (difficulty) {
                query =
                    query.eq(
                        "difficulty",
                        difficulty
                    );
            }


            const {
                data,
                error
            } = await query;


            if (error) {
                throw error;
            }


            (data || []).forEach(item => {

                results.push({
                    kind: "resource",
                    id: item.id,
                    title: item.title,
                    description:
                        item.description,
                    url: item.file_url,
                    level: item.level,
                    subject: item.subject,
                    unit: item.unit,
                    difficulty: item.difficulty,
                    type: item.type
                });

            });

        }


        // =================================================
        // LESSONS
        // =================================================

        if (
            type === "all" ||
            type === "lesson"
        ) {

            let query =
                supabaseClient
                    .from("lessons")
                    .select(`
                        id,
                        title,
                        content,
                        level,
                        subject,
                        unit,
                        created_at
                    `)
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    )
                    .limit(50);


            if (term.length >= 2) {

                const pattern =
                    buildLike(term);

                query =
                    query.or(
                        `title.ilike.${pattern},content.ilike.${pattern}`
                    );
            }


            if (level) {
                query =
                    query.eq(
                        "level",
                        level
                    );
            }


            if (subject) {
                query =
                    query.ilike(
                        "subject",
                        buildLike(subject)
                    );
            }


            if (unit) {
                query =
                    query.ilike(
                        "unit",
                        buildLike(unit)
                    );
            }


            const {
                data,
                error
            } = await query;


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
                        `lesson.html?id=${encodeURIComponent(item.id)}`,
                    level: item.level,
                    subject: item.subject,
                    unit: item.unit
                });

            });

        }


        // =================================================
        // EXERCISES
        // =================================================

        if (
            type === "all" ||
            type === "exercise"
        ) {

            let query =
                supabaseClient
                    .from("exercises")
                    .select(`
                        id,
                        title,
                        question,
                        difficulty,
                        level,
                        subject,
                        unit,
                        created_at
                    `)
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    )
                    .limit(50);


            if (term.length >= 2) {

                const pattern =
                    buildLike(term);

                query =
                    query.or(
                        `title.ilike.${pattern},question.ilike.${pattern}`
                    );
            }


            if (level) {
                query =
                    query.eq(
                        "level",
                        level
                    );
            }


            if (subject) {
                query =
                    query.ilike(
                        "subject",
                        buildLike(subject)
                    );
            }


            if (unit) {
                query =
                    query.ilike(
                        "unit",
                        buildLike(unit)
                    );
            }


            if (difficulty) {
                query =
                    query.eq(
                        "difficulty",
                        difficulty
                    );
            }


            const {
                data,
                error
            } = await query;


            if (error) {
                throw error;
            }


            (data || []).forEach(item => {

                results.push({
                    kind: "exercise",
                    id: item.id,
                    title: item.title,
                    description:
                        item.question,
                    difficulty:
                        item.difficulty,
                    level:
                        item.level,
                    subject:
                        item.subject,
                    unit:
                        item.unit
                });

            });

        }


        renderResults(results);


    } catch (error) {

        console.error(
            "Advanced search error:",
            error
        );

        setStatus(
            "❌ حدث خطأ أثناء البحث."
        );
    }
}


function renderResults(results) {

    if (!results.length) {

        setStatus(
            "لم يتم العثور على نتائج مناسبة."
        );

        return;
    }


    setStatus(
        `تم العثور على ${results.length} نتيجة.`
    );


    searchResults.innerHTML =
        results
            .map(renderResult)
            .join("");
}


function renderResult(item) {

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
    else if (item.kind === "lesson") {

        action = `
            <a
                class="search-action"
                href="${escapeAttribute(item.url)}"
            >
                📖 فتح الدرس
            </a>
        `;

    }
    else if (item.kind === "exercise") {

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
                ${getTypeLabel(item.kind)}
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

            <div class="search-meta">

                ${
                    item.level
                        ? `<span>🎓 ${escapeHtml(item.level)}</span>`
                        : ""
                }

                ${
                    item.subject
                        ? `<span>📚 ${escapeHtml(item.subject)}</span>`
                        : ""
                }

                ${
                    item.unit
                        ? `<span>📖 ${escapeHtml(item.unit)}</span>`
                        : ""
                }

                ${
                    item.difficulty
                        ? `<span>⭐ ${escapeHtml(item.difficulty)}</span>`
                        : ""
                }

            </div>

            ${action}

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


function truncate(text, max) {

    const value =
        String(text);

    return value.length > max
        ? value.slice(0, max) + "…"
        : value;
}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;
}


function escapeAttribute(value) {

    return escapeHtml(value);
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
