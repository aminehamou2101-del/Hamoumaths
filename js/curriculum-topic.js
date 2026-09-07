(function () {
    "use strict";

    const params =
        new URLSearchParams(
            window.location.search
        );

    const curriculumId =
        params.get("id");

    const topicTitle =
        document.getElementById("topicTitle");

    const topicDescription =
        document.getElementById(
            "topicDescription"
        );

    const lessonsBox =
        document.getElementById("lessons");

    const exercisesBox =
        document.getElementById("exercises");

    const resourcesBox =
        document.getElementById("resources");

    function showEmpty(box, text) {
        box.innerHTML = "";

        const element =
            document.createElement("div");

        element.className = "empty";
        element.textContent = text;

        box.appendChild(element);
    }

    function renderItems(
        box,
        items,
        emptyText,
        urlBuilder
    ) {
        box.innerHTML = "";

        if (!items || !items.length) {
            showEmpty(box, emptyText);
            return;
        }

        items.forEach(item => {

            const link =
                document.createElement("a");

            link.className = "item";
            link.href = urlBuilder(item);

            link.textContent =
                item.title || "بدون عنوان";

            box.appendChild(link);
        });
    }

    async function loadTopic() {

        if (!curriculumId) {

            topicTitle.textContent =
                "موضوع غير محدد";

            showEmpty(
                lessonsBox,
                "لم يتم تحديد الموضوع."
            );

            showEmpty(
                exercisesBox,
                "لم يتم تحديد الموضوع."
            );

            showEmpty(
                resourcesBox,
                "لم يتم تحديد الموضوع."
            );

            return;
        }

        const {
            data: curriculumItem,
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
            .eq("id", curriculumId)
            .single();

        if (error) {

            console.error(error);

            topicTitle.textContent =
                "تعذر تحميل الموضوع.";

            return;
        }

        topicTitle.textContent =
            curriculumItem.topic;

        topicDescription.textContent =
            [
                curriculumItem.level,
                curriculumItem.subject,
                curriculumItem.unit
            ]
                .filter(Boolean)
                .join(" • ");

        await Promise.all([
            loadLessons(),
            loadExercises(),
            loadResources()
        ]);
    }

    async function loadLessons() {

        const {
            data,
            error
        } = await supabaseClient
            .from("lessons")
            .select(`
                id,
                title,
                order_number
            `)
            .eq(
                "curriculum_id",
                curriculumId
            )
            .order(
                "order_number",
                {
                    ascending: true
                }
            );

        if (error) {

            console.error(error);

            showEmpty(
                lessonsBox,
                "تعذر تحميل الدروس."
            );

            return;
        }

        renderItems(
            lessonsBox,
            data,
            "لا توجد دروس مرتبطة بهذا الموضوع.",
            item =>
                `lesson.html?id=${encodeURIComponent(
                    item.id
                )}`
        );
    }

    async function loadExercises() {

        const {
            data,
            error
        } = await supabaseClient
            .from("exercises")
            .select(`
                id,
                title,
                difficulty
            `)
            .eq(
                "curriculum_id",
                curriculumId
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) {

            console.error(error);

            showEmpty(
                exercisesBox,
                "تعذر تحميل التمارين."
            );

            return;
        }

        renderItems(
            exercisesBox,
            data,
            "لا توجد تمارين مرتبطة بهذا الموضوع.",
            item =>
                `exercises.html?id=${encodeURIComponent(
                    item.id
                )}`
        );
    }

    async function loadResources() {

        const {
            data,
            error
        } = await supabaseClient
            .from("resources")
            .select(`
                id,
                title,
                type
            `)
            .eq(
                "curriculum_id",
                curriculumId
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) {

            console.error(error);

            showEmpty(
                resourcesBox,
                "تعذر تحميل الموارد."
            );

            return;
        }

        renderItems(
            resourcesBox,
            data,
            "لا توجد موارد مرتبطة بهذا الموضوع.",
            item =>
                `library.html?id=${encodeURIComponent(
                    item.id
                )}`
        );
    }

    loadTopic();

})();
