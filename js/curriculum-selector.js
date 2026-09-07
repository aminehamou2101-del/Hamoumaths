(function () {
    "use strict";

    const selectors = {
        level: document.getElementById("curriculumLevel"),
        subject: document.getElementById("curriculumSubject"),
        unit: document.getElementById("curriculumUnit"),
        topic: document.getElementById("curriculumTopic"),
        hiddenId: document.getElementById("curriculumId")
    };

    let curriculum = [];

    async function loadCurriculum() {
        if (!supabaseClient) {
            console.error("supabaseClient غير موجود");
            return;
        }

        const { data, error } =
            await supabaseClient.rpc(
                "get_curriculum_tree"
            );

        if (error) {
            console.error(
                "خطأ في تحميل المنهاج:",
                error
            );
            return;
        }

        curriculum = data || [];

        fillLevels();
    }

    function resetSelect(select, placeholder) {
        select.innerHTML = "";

        const option =
            document.createElement("option");

        option.value = "";
        option.textContent = placeholder;

        select.appendChild(option);
    }

    function addOptions(select, values) {
        for (const value of values) {
            const option =
                document.createElement("option");

            option.value = value;
            option.textContent = value;

            select.appendChild(option);
        }
    }

    function unique(values) {
        return [
            ...new Set(
                values.filter(Boolean)
            )
        ];
    }

    function fillLevels() {
        resetSelect(
            selectors.level,
            "اختر المستوى"
        );

        resetSelect(
            selectors.subject,
            "اختر المادة"
        );

        resetSelect(
            selectors.unit,
            "اختر الوحدة"
        );

        resetSelect(
            selectors.topic,
            "اختر الموضوع"
        );

        const levels =
            unique(
                curriculum.map(
                    item => item.level
                )
            );

        addOptions(
            selectors.level,
            levels
        );

        selectors.hiddenId.value = "";
    }

    function fillSubjects() {

        const selectedLevel =
            selectors.level.value;

        resetSelect(
            selectors.subject,
            "اختر المادة"
        );

        resetSelect(
            selectors.unit,
            "اختر الوحدة"
        );

        resetSelect(
            selectors.topic,
            "اختر الموضوع"
        );

        selectors.hiddenId.value = "";

        if (!selectedLevel) {
            return;
        }

        const subjects =
            unique(
                curriculum
                    .filter(
                        item =>
                            item.level ===
                            selectedLevel
                    )
                    .map(
                        item =>
                            item.subject
                    )
            );

        addOptions(
            selectors.subject,
            subjects
        );
    }

    function fillUnits() {

        const level =
            selectors.level.value;

        const subject =
            selectors.subject.value;

        resetSelect(
            selectors.unit,
            "اختر الوحدة"
        );

        resetSelect(
            selectors.topic,
            "اختر الموضوع"
        );

        selectors.hiddenId.value = "";

        if (!level || !subject) {
            return;
        }

        const units =
            unique(
                curriculum
                    .filter(
                        item =>
                            item.level === level &&
                            item.subject === subject
                    )
                    .map(
                        item =>
                            item.unit
                    )
            );

        addOptions(
            selectors.unit,
            units
        );
    }

    function fillTopics() {

        const level =
            selectors.level.value;

        const subject =
            selectors.subject.value;

        const unit =
            selectors.unit.value;

        resetSelect(
            selectors.topic,
            "اختر الموضوع"
        );

        selectors.hiddenId.value = "";

        if (!level || !subject || !unit) {
            return;
        }

        const topics =
            curriculum.filter(
                item =>
                    item.level === level &&
                    item.subject === subject &&
                    item.unit === unit
            );

        for (const item of topics) {

            const option =
                document.createElement("option");

            option.value =
                item.id;

            option.textContent =
                item.topic;

            option.dataset.level =
                item.level;

            option.dataset.subject =
                item.subject;

            option.dataset.unit =
                item.unit;

            selectors.topic.appendChild(
                option
            );
        }
    }

    function selectTopic() {

        const id =
            selectors.topic.value;

        selectors.hiddenId.value =
            id || "";
    }

    selectors.level.addEventListener(
        "change",
        fillSubjects
    );

    selectors.subject.addEventListener(
        "change",
        fillUnits
    );

    selectors.unit.addEventListener(
        "change",
        fillTopics
    );

    selectors.topic.addEventListener(
        "change",
        selectTopic
    );

    window.HamouCurriculum = {
        load: loadCurriculum,
        getSelectedId: () =>
            selectors.hiddenId.value || null
    };

    loadCurriculum();

})();
