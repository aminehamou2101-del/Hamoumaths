(function () {

    "use strict";

    let resources = [];

    const $ = id =>
        document.getElementById(id);

    const grid =
        $("libraryGrid");

    const searchInput =
        $("searchInput");

    const levelFilter =
        $("levelFilter");

    const subjectFilter =
        $("subjectFilter");

    const unitFilter =
        $("unitFilter");

    const topicFilter =
        $("topicFilter");

    const typeFilter =
        $("typeFilter");

    const resultsInfo =
        $("resultsInfo");

    const previewModal =
        $("previewModal");

    const previewTitle =
        $("previewTitle");

    const previewFrame =
        $("previewFrame");

    const previewUnsupported =
        $("previewUnsupported");

    const unsupportedLink =
        $("unsupportedLink");

    const closePreview =
        $("closePreview");

    const totalResources =
        $("totalResources");

    const pdfResources =
        $("pdfResources");

    const bookResources =
        $("bookResources");

    const exerciseResources =
        $("exerciseResources");

    /*
     * =====================================================
     * URL PARAMETERS
     * =====================================================
     */

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const initialLevel =
        urlParams.get("level") || "";

    const initialSubject =
        urlParams.get("subject") || "";

    const initialUnit =
        urlParams.get("unit") || "";

    const initialTopic =
        urlParams.get("topic") || "";

    const initialType =
        urlParams.get("type") || "";

    /*
     * =====================================================
     * HELPERS
     * =====================================================
     */

    function setState(
        message,
        icon = "ℹ️",
        isError = false
    ) {

        grid.innerHTML = "";

        const state =
            document.createElement(
                "div"
            );

        state.className =
            `library-state ${
                isError ? "error" : ""
            }`;

        const iconElement =
            document.createElement(
                "div"
            );

        iconElement.className =
            "state-icon";

        iconElement.textContent =
            icon;

        const text =
            document.createElement(
                "strong"
            );

        text.textContent =
            message;

        state.appendChild(
            iconElement
        );

        state.appendChild(
            text
        );

        if (isError) {

            const retry =
                document.createElement(
                    "button"
                );

            retry.className =
                "retry-button";

            retry.textContent =
                "إعادة المحاولة";

            retry.addEventListener(
                "click",
                loadResources
            );

            state.appendChild(
                retry
            );
        }

        grid.appendChild(
            state
        );
    }

    function unique(values) {

        return [
            ...new Set(
                values
                    .filter(
                        value =>
                            value !== null &&
                            value !== undefined &&
                            String(value).trim() !== ""
                    )
            )
        ];
    }

    function sortValues(values) {

        return values.sort(
            (a, b) =>
                String(a).localeCompare(
                    String(b),
                    "ar"
                )
        );
    }

    function addOptions(
        select,
        values
    ) {

        sortValues(
            unique(values)
        ).forEach(
            value => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    value;

                option.textContent =
                    value;

                select.appendChild(
                    option
                );
            }
        );
    }

    function typeLabel(type) {

        const labels = {
            pdf: "PDF",
            book: "كتاب",
            exercise: "ملف تمارين",
            video: "فيديو",
            link: "رابط"
        };

        return labels[type] ||
            type ||
            "مورد";
    }

    function typeIcon(type) {

        const icons = {
            pdf: "📄",
            book: "📘",
            exercise: "📝",
            video: "🎥",
            link: "🔗"
        };

        return icons[type] ||
            "📚";
    }

    function getSearchText(item) {

        return [
            item.title,
            item.description,
            item.level,
            item.subject,
            item.unit,
            item.topic,
            item.type
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
    }

    function normalizeFileUrl(url) {

        if (!url) {
            return null;
        }

        try {

            const parsed =
                new URL(
                    url,
                    window.location.origin
                );

            if (
                parsed.protocol === "http:" ||
                parsed.protocol === "https:"
            ) {
                return parsed.href;
            }

        } catch {
            return null;
        }

        return null;
    }

    /*
     * =====================================================
     * LOAD RESOURCES
     * =====================================================
     */

    async function loadResources() {

        setState(
            "جارِ تحميل المكتبة...",
            "⏳"
        );

        try {

            if (
                typeof supabaseClient ===
                "undefined"
            ) {

                throw new Error(
                    "Supabase غير متاح."
                );
            }

            const {
                data,
                error
            } =
                await supabaseClient
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
                        topic,
                        difficulty,
                        views,
                        created_at,
                        curriculum_id,
                        status
                    `)
                    .eq(
                        "status",
                        "published"
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );

            if (error) {
                throw error;
            }

            resources =
                data || [];

            updateStats();
            populateFilters();
            applyInitialFilters();
            render();

        } catch (error) {

            console.error(
                "HAMOU MATH library:",
                error
            );

            resultsInfo.textContent =
                "تعذر تحميل المكتبة";

            setState(
                "تعذر تحميل الموارد: " +
                error.message,
                "⚠️",
                true
            );
        }
    }

    /*
     * =====================================================
     * STATS
     * =====================================================
     */

    function updateStats() {

        totalResources.textContent =
            resources.length;

        pdfResources.textContent =
            resources.filter(
                item =>
                    item.type === "pdf"
            ).length;

        bookResources.textContent =
            resources.filter(
                item =>
                    item.type === "book"
            ).length;

        exerciseResources.textContent =
            resources.filter(
                item =>
                    item.type === "exercise"
            ).length;
    }

    /*
     * =====================================================
     * FILTERS
     * =====================================================
     */

    function populateFilters() {

        levelFilter.innerHTML =
            '<option value="">كل المستويات</option>';

        subjectFilter.innerHTML =
            '<option value="">كل المواد</option>';

        unitFilter.innerHTML =
            '<option value="">كل الوحدات</option>';

        topicFilter.innerHTML =
            '<option value="">كل المواضيع</option>';

        addOptions(
            levelFilter,
            resources.map(
                item =>
                    item.level
            )
        );

        addOptions(
            subjectFilter,
            resources.map(
                item =>
                    item.subject
            )
        );

        addOptions(
            unitFilter,
            resources.map(
                item =>
                    item.unit
            )
        );

        addOptions(
            topicFilter,
            resources.map(
                item =>
                    item.topic
            )
        );
    }

    function applyInitialFilters() {

        if (
            initialLevel
        ) {
            levelFilter.value =
                initialLevel;
        }

        if (
            initialSubject
        ) {
            subjectFilter.value =
                initialSubject;
        }

        if (
            initialUnit
        ) {
            unitFilter.value =
                initialUnit;
        }

        if (
            initialTopic
        ) {
            topicFilter.value =
                initialTopic;

            searchInput.value =
                initialTopic;
        }

        if (
            [
                "pdf",
                "book",
                "exercise",
                "video",
                "link"
            ].includes(
                initialType
            )
        ) {

            typeFilter.value =
                initialType;
        }
    }

    function getFilteredResources() {

        const query =
            searchInput.value
                .trim()
                .toLowerCase();

        const selectedLevel =
            levelFilter.value;

        const selectedSubject =
            subjectFilter.value;

        const selectedUnit =
            unitFilter.value;

        const selectedTopic =
            topicFilter.value;

        const selectedType =
            typeFilter.value;

        return resources.filter(
            item => {

                const text =
                    getSearchText(
                        item
                    );

                return (
                    (!query ||
                        text.includes(query)) &&

                    (!selectedLevel ||
                        item.level ===
                            selectedLevel) &&

                    (!selectedSubject ||
                        item.subject ===
                            selectedSubject) &&

                    (!selectedUnit ||
                        item.unit ===
                            selectedUnit) &&

                    (!selectedTopic ||
                        item.topic ===
                            selectedTopic) &&

                    (!selectedType ||
                        item.type ===
                            selectedType)
                );
            }
        );
    }

    /*
     * =====================================================
     * CARD
     * =====================================================
     */

    function createResourceCard(
        item
    ) {

        const card =
            document.createElement(
                "article"
            );

        card.className =
            "resource-card";

        const top =
            document.createElement(
                "div"
            );

        top.className =
            "resource-top";

        const icon =
            document.createElement(
                "div"
            );

        icon.className =
            "resource-icon";

        icon.textContent =
            typeIcon(item.type);

        const type =
            document.createElement(
                "span"
            );

        type.className =
            "resource-type";

        type.textContent =
            typeLabel(item.type);

        top.appendChild(icon);
        top.appendChild(type);

        card.appendChild(top);

        const title =
            document.createElement(
                "h3"
            );

        title.textContent =
            item.title ||
            "مورد تعليمي";

        card.appendChild(title);

        const description =
            document.createElement(
                "p"
            );

        description.className =
            "resource-description";

        description.textContent =
            item.description ||
            "لا يوجد وصف لهذا المورد.";

        card.appendChild(
            description
        );

        const tags =
            document.createElement(
                "div"
            );

        tags.className =
            "resource-tags";

        [
            item.level,
            item.subject,
            item.unit,
            item.topic
        ]
            .filter(Boolean)
            .slice(0, 5)
            .forEach(
                value => {

                    const tag =
                        document.createElement(
                            "span"
                        );

                    tag.className =
                        "resource-tag";

                    tag.textContent =
                        value;

                    tags.appendChild(
                        tag
                    );
                }
            );

        card.appendChild(tags);

        const actions =
            document.createElement(
                "div"
            );

        actions.className =
            "resource-actions";

        const url =
            normalizeFileUrl(
                item.file_url
            );

        if (url) {

            const preview =
                document.createElement(
                    "button"
                );

            preview.type =
                "button";

            preview.className =
                "preview-button";

            preview.textContent =
                "👁️ معاينة";

            preview.addEventListener(
                "click",
                function () {

                    openPreview(
                        item
                    );
                }
            );

            actions.appendChild(
                preview
            );

            const download =
                document.createElement(
                    "a"
                );

            download.className =
                "download-button";

            download.href =
                url;

            download.target =
                "_blank";

            download.rel =
                "noopener noreferrer";

            download.textContent =
                "⬇️ فتح / تحميل";

            actions.appendChild(
                download
            );

        } else {

            const unavailable =
                document.createElement(
                    "button"
                );

            unavailable.type =
                "button";

            unavailable.className =
                "preview-button";

            unavailable.disabled =
                true;

            unavailable.textContent =
                "الرابط غير متاح";

            actions.appendChild(
                unavailable
            );
        }

        card.appendChild(actions);

        return card;
    }

    /*
     * =====================================================
     * RENDER
     * =====================================================
     */

    function render() {

        const filtered =
            getFilteredResources();

        resultsInfo.textContent =
            `عرض ${filtered.length} من ${resources.length} مورد`;

        grid.innerHTML = "";

        if (!filtered.length) {

            setState(
                "لا توجد موارد مطابقة للفلاتر الحالية.",
                "🔎"
            );

            return;
        }

        filtered.forEach(
            item => {

                grid.appendChild(
                    createResourceCard(
                        item
                    )
                );
            }
        );
    }

    /*
     * =====================================================
     * PREVIEW
     * =====================================================
     */

    function openPreview(item) {

        const url =
            normalizeFileUrl(
                item.file_url
            );

        if (!url) {
            return;
        }

        previewTitle.textContent =
            item.title ||
            "معاينة المورد";

        previewUnsupported.classList.add(
            "hidden"
        );

        previewFrame.classList.remove(
            "hidden"
        );

        /*
         * PDF:
         * يعرض مباشرة داخل iframe.
         */
        if (
            item.type === "pdf" ||
            /\.pdf(?:$|\?)/i.test(url)
        ) {

            previewFrame.src =
                url;

        } else {

            /*
             * الأنواع الأخرى قد لا يدعمها
             * المتصفح داخل iframe.
             */
            previewFrame.src =
                "about:blank";

            previewFrame.classList.add(
                "hidden"
            );

            previewUnsupported.classList.remove(
                "hidden"
            );

            unsupportedLink.href =
                url;
        }

        previewModal.classList.add(
            "open"
        );

        previewModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow =
            "hidden";
    }

    function closePreviewModal() {

        previewModal.classList.remove(
            "open"
        );

        previewModal.setAttribute(
            "aria-hidden",
            "true"
        );

        previewFrame.src =
            "about:blank";

        document.body.style.overflow =
            "";
    }

    closePreview.addEventListener(
        "click",
        closePreviewModal
    );

    document
        .querySelector(
            ".modal-backdrop"
        )
        .addEventListener(
            "click",
            closePreviewModal
        );

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                closePreviewModal();
            }
        }
    );

    /*
     * =====================================================
     * EVENTS
     * =====================================================
     */

    searchInput.addEventListener(
        "input",
        render
    );

    levelFilter.addEventListener(
        "change",
        render
    );

    subjectFilter.addEventListener(
        "change",
        render
    );

    unitFilter.addEventListener(
        "change",
        render
    );

    topicFilter.addEventListener(
        "change",
        render
    );

    typeFilter.addEventListener(
        "change",
        render
    );

    $("clearFilters")
        .addEventListener(
            "click",
            function () {

                searchInput.value = "";

                levelFilter.value = "";

                subjectFilter.value = "";

                unitFilter.value = "";

                topicFilter.value = "";

                typeFilter.value = "";

                render();
            }
        );

    /*
     * =====================================================
     * START
     * =====================================================
     */

    loadResources();

})();
