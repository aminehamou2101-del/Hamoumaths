// =====================================================
// HAMOU MATH
// ADVANCED SEARCH + PAGINATION
// =====================================================

const PAGE_SIZE = 20;

let currentPage = 0;

let lastSearch = {
    term: "",
    type: "all",
    level: "",
    subject: "",
    unit: "",
    difficulty: ""
};

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


// =====================================================
// SEARCH
// =====================================================

async function runSearch(page = 0) {

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

        clearResults();

        return;
    }


    currentPage = page;


    lastSearch = {
        term,
        type,
        level,
        subject,
        unit,
        difficulty
    };


    setStatus("⏳ جارٍ البحث...");

    clearResults();


    try {

        const results = [];


        await searchResources(results);

        await searchLessons(results);

        await searchExercises(results);


        /*
         * pagination على النتائج المجمعة.
         * هذا مناسب الآن للمشروع،
         * لكن عند نمو البيانات جدًا سننقل البحث
         * إلى RPC / Full Text Search مركزي.
         */

        const start =
            currentPage * PAGE_SIZE;

        const end =
            start + PAGE_SIZE;

        const pageResults =
            results.slice(start, end);


        if (!pageResults.length) {

            setStatus(
                currentPage === 0
                    ? "لم يتم العثور على نتائج."
                    : "لا توجد نتائج أخرى."
            );

            return;
        }


        setStatus(
            `النتائج ${start + 1} - ${Math.min(
                end,
                results.length
            )} من ${results.length}`
        );


        searchResults.innerHTML =
            pageResults
                .map(renderResult)
                .join("");


        renderPagination(
            results.length
        );


    } catch (error) {

        console.error(
            "Search error:",
            error
        );

        setStatus(
            "❌ حدث خطأ أثناء البحث."
        );
    }
}


// =====================================================
// RESOURCES
// =====================================================

async function searchResources(results) {

    if (
        lastSearch.type !== "all" &&
        lastSearch.type !== "resource"
    ) {
        return;
    }


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
            .limit(500);


    applyCommonFilters(
        query,
        "resource"
    );


    if (lastSearch.term.length >= 2) {

        const pattern =
            buildLike(lastSearch.term);

        query =
            query.or(
                `title.ilike.${pattern},description.ilike.${pattern}`
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
            description: item.description,
            url: item.file_url,
            level: item.level,
            subject: item.subject,
            unit: item.unit,
            difficulty: item.difficulty
        });

    });
}


// =====================================================
// LESSONS
// =====================================================

async function searchLessons(results) {

    if (
        lastSearch.type !== "all" &&
        lastSearch.type !== "lesson"
    ) {
        return;
    }


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
            .limit(500);


    applyCommonFilters(
        query,
        "lesson"
    );


    if (lastSearch.term.length >= 2) {

        const pattern =
            buildLike(lastSearch.term);

        query =
            query.or(
                `title.ilike.${pattern},content.ilike.${pattern}`
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
            description: item.content,
            url:
                `lesson.html?id=${encodeURIComponent(item.id)}`,
            level: item.level,
            subject: item.subject,
            unit: item.unit
        });

    });
}


// =====================================================
// EXERCISES
// =====================================================

async function searchExercises(results) {

    if (
        lastSearch.type !== "all" &&
        lastSearch.type !== "exercise"
    ) {
        return;
    }


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
            .limit(500);


    applyCommonFilters(
        query,
        "exercise"
    );


    if (lastSearch.term.length >= 2) {

        const pattern =
            buildLike(lastSearch.term);

        query =
            query.or(
                `title.ilike.${pattern},question.ilike.${pattern}`
            );
    }


    if (lastSearch.difficulty) {

        query =
            query.eq(
                "difficulty",
                lastSearch.difficulty
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
            description: item.question,
            difficulty: item.difficulty,
            level: item.level,
            subject: item.subject,
            unit: item.unit
        });

    });
}


// =====================================================
// COMMON FILTERS
// =====================================================

function applyCommonFilters(
    query,
    kind
) {

    if (lastSearch.level) {

        query =
            query.eq(
                "level",
                lastSearch.level
            );
    }


    if (lastSearch.subject) {

        query =
            query.ilike(
                "subject",
                buildLike(
                    lastSearch.subject
                )
            );
    }


    if (lastSearch.unit) {

        query =
            query.ilike(
                "unit",
                buildLike(
                    lastSearch.unit
                )
            );
    }

    return query;
}


// =====================================================
// PAGINATION UI
// =====================================================

function renderPagination(
    total
) {

    let old =
        document.getElementById(
            "searchPagination"
        );


    if (old) {
        old.remove();
    }


    const totalPages =
        Math.ceil(
            total / PAGE_SIZE
        );


    if (totalPages <= 1) {
        return;
    }


    const wrapper =
        document.createElement("div");


    wrapper.id =
        "searchPagination";


    wrapper.className =
        "search-pagination";


    const previous =
        document.createElement("button");

    previous.type =
        "button";

    previous.textContent =
        "السابق";

    previous.disabled =
        currentPage === 0;


    previous.onclick =
        () => runSearch(
            currentPage - 1
        );


    const pageInfo =
        document.createElement("span");

    pageInfo.textContent =
        `صفحة ${currentPage + 1} من ${totalPages}`;


    const next =
        document.createElement("button");

    next.type =
        "button";

    next.textContent =
        "التالي";

    next.disabled =
        currentPage >= totalPages - 1;


    next.onclick =
        () => runSearch(
            currentPage + 1
        );


    wrapper.append(
        previous,
        pageInfo,
        next
    );


    searchResults.parentElement
        ?.appendChild(wrapper);
}


// =====================================================
// RESULT RENDER
// =====================================================

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

    } else if (item.kind === "lesson") {

        action = `
            <a
                class="search-action"
                href="${escapeAttribute(item.url)}"
            >
                📖 فتح الدرس
            </a>
        `;

    } else if (item.kind === "exercise") {

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
                ${escapeHtml(
                    item.title || "بدون عنوان"
                )}
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


// =====================================================
// HELPERS
// =====================================================

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


function buildLike(
    value
) {

    return `%${String(value)
        .replace(/\\/g, "\\\\")
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_")}%`;
}


function escapeHtml(
    value
) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;
}


function escapeAttribute(
    value
) {

    return escapeHtml(value)
        .replace(/'/g, "&#39;");
}


function setStatus(
    message
) {

    if (searchStatus) {
        searchStatus.textContent =
            message;
    }
}


function clearResults() {

    if (searchResults) {
        searchResults.innerHTML = "";
    }

    const pagination =
        document.getElementById(
            "searchPagination"
        );

    pagination?.remove();
}


searchButton?.addEventListener(
    "click",
    () => runSearch(0)
);


searchInput?.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            runSearch(0);
        }

    }
);
