// =====================================================
// HAMOU MATH
// DATABASE-POWERED SEARCH
// =====================================================
function loadSearchFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const type =
        params.get("type");

    const level =
        params.get("level");


    if (type && searchType) {
        searchType.value = type;
    }


    if (level && searchLevel) {

        searchLevel.value =
            level;
    }


    if (type || level) {
        runSearch(1);
    }
}


document.addEventListener(
    "DOMContentLoaded",
    loadSearchFromURL
);
const PAGE_SIZE = 20;

let currentPage = 1;


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


async function runSearch(page = 1) {

    const query =
        String(
            searchInput?.value || ""
        ).trim();


    const type =
        searchType?.value || "all";


    const level =
        searchLevel?.value || "";


    const subject =
        String(
            searchSubject?.value || ""
        ).trim();


    const unit =
        String(
            searchUnit?.value || ""
        ).trim();


    const difficulty =
        searchDifficulty?.value || "";


    if (
        query.length < 2 &&
        !level &&
        !subject &&
        !unit &&
        !difficulty
    ) {

        searchStatus.textContent =
            "اكتب حرفين على الأقل أو اختر فلترًا.";

        searchResults.innerHTML = "";

        return;
    }


    currentPage = Math.max(page, 1);

    searchStatus.textContent =
        "⏳ جارٍ البحث...";

    searchResults.innerHTML = "";


    try {

        const {
            data,
            error
        } = await supabaseClient
            .rpc(
                "global_search",
                {
                    p_query: query,
                    p_type: type,
                    p_level: level,
                    p_subject: subject,
                    p_unit: unit,
                    p_difficulty: difficulty,
                    p_page: currentPage,
                    p_page_size: PAGE_SIZE
                }
            );


        if (error) {
            throw error;
        }


        const results =
            data || [];


        if (!results.length) {

            searchStatus.textContent =
                currentPage === 1
                    ? "لم يتم العثور على نتائج."
                    : "لا توجد نتائج إضافية.";

            removePagination();

            return;
        }


        searchStatus.textContent =
            `تم تحميل ${results.length} نتيجة في الصفحة ${currentPage}.`;


        searchResults.innerHTML =
            results
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

        searchStatus.textContent =
            "❌ حدث خطأ أثناء البحث.";
    }
}


// =====================================================
// RESULT
// =====================================================

function renderResult(item) {

    let action = "";


    if (
        item.result_type === "resource" &&
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

    } else if (
        item.result_type === "lesson"
    ) {

        action = `
            <a
                class="search-action"
                href="lesson.html?id=${encodeURIComponent(item.result_id)}"
            >
                📖 فتح الدرس
            </a>
        `;

    } else if (
        item.result_type === "exercise"
    ) {

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
                ${getTypeLabel(item.result_type)}
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
// PAGINATION
// =====================================================

function renderPagination(
    resultCount
) {

    removePagination();


    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.id =
        "searchPagination";

    wrapper.className =
        "search-pagination";


    const previous =
        document.createElement(
            "button"
        );

    previous.type =
        "button";

    previous.textContent =
        "← السابق";

    previous.disabled =
        currentPage <= 1;

    previous.onclick =
        () => runSearch(
            currentPage - 1
        );


    const page =
        document.createElement(
            "span"
        );

    page.textContent =
        `صفحة ${currentPage}`;


    const next =
        document.createElement(
            "button"
        );

    next.type =
        "button";

    next.textContent =
        "التالي →";

    /*
     * إذا رجعت صفحة كاملة فهذا يعني
     * أنه قد توجد صفحة أخرى.
     */
    next.disabled =
        resultCount < PAGE_SIZE;

    next.onclick =
        () => runSearch(
            currentPage + 1
        );


    wrapper.append(
        previous,
        page,
        next
    );


    searchResults.parentElement
        ?.appendChild(wrapper);
}


function removePagination() {

    document
        .getElementById("searchPagination")
        ?.remove();
}


// =====================================================
// HELPERS
// =====================================================

function getTypeLabel(type) {

    if (type === "resource") {
        return "📚 مورد";
    }

    if (type === "lesson") {
        return "📖 درس";
    }

    if (type === "exercise") {
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


function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        String(value);

    return div.innerHTML;
}


function escapeAttribute(
    value
) {

    return escapeHtml(value);
}


searchButton?.addEventListener(
    "click",
    () => runSearch(1)
);


searchInput?.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            runSearch(1);
        }
        const searchTopic =
    document.getElementById("searchTopic");

    }
);
