(function () {
    "use strict";

    const params =
        new URLSearchParams(
            window.location.search
        );

    const type =
        params.get("type");

    const id =
        params.get("id");

    let user = null;
    let profile = null;
    let currentItem = null;

    const $ = id =>
        document.getElementById(id);

    function showStatus(
        message,
        ok = true
    ) {
        const box =
            $("saveStatus");

        box.textContent =
            message;

        box.className =
            `status show ${ok ? "ok" : "error"}`;
    }

    function safe(value) {
        return value == null
            ? ""
            : String(value);
    }

    async function initialize() {

        try {

            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .getUser();

            if (error) {
                throw error;
            }

            user = data.user;

            if (!user) {
                location.href =
                    "login.html?redirect=" +
                    encodeURIComponent(
                        location.pathname +
                        location.search
                    );

                return;
            }

            const {
                data: profileData,
                error: profileError
            } =
                await supabaseClient
                    .from("profiles")
                    .select(`
                        id,
                        role,
                        full_name
                    `)
                    .eq("id", user.id)
                    .single();

            if (profileError) {
                throw profileError;
            }

            profile =
                profileData;

            const allowed = [
                "teacher",
                "admin",
                "owner"
            ];

            if (
                !allowed.includes(
                    profile.role
                )
            ) {

                showAccessError(
                    "ليس لديك صلاحية تعديل المحتوى."
                );

                return;
            }

            if (
                !id ||
                ![
                    "lesson",
                    "exercise",
                    "resource"
                ].includes(type)
            ) {

                showAccessError(
                    "رابط المحتوى غير صالح."
                );

                return;
            }

            await loadContent();

            $("editor")
                .classList
                .remove("hidden");

            $("accessStatus")
                .className =
                "status";

        } catch (error) {

            console.error(error);

            showAccessError(
                "تعذر فتح المحرر: " +
                error.message
            );
        }
    }

    function showAccessError(message) {

        const box =
            $("accessStatus");

        box.textContent =
            message;

        box.className =
            "status show error";
    }

    async function loadContent() {

        let response;

        if (type === "lesson") {

            response =
                await supabaseClient
                    .from("lessons")
                    .select("*")
                    .eq("id", id)
                    .single();

        } else if (type === "exercise") {

            response =
                await supabaseClient
                    .from("exercises")
                    .select("*")
                    .eq("id", id)
                    .single();

        } else {

            response =
                await supabaseClient
                    .from("resources")
                    .select("*")
                    .eq("id", id)
                    .single();
        }

        if (response.error) {
            throw response.error;
        }

        currentItem =
            response.data;

        // حماية إضافية على الواجهة
        if (
            profile.role === "teacher"
        ) {

            const ownerId =
                type === "resource"
                    ? currentItem.uploaded_by
                    : currentItem.created_by;

            if (
                ownerId &&
                ownerId !== user.id
            ) {

                showAccessError(
                    "هذا المحتوى ليس من محتواك."
                );

                $("editor")
                    .classList
                    .add("hidden");

                return;
            }
        }

        fillEditor();
    }

    function fillEditor() {

        $("contentTypeLabel")
            .textContent =
            type === "lesson"
                ? "درس"
                : type === "exercise"
                ? "تمرين"
                : "مورد";

        $("contentTopic")
            .textContent =
            safe(currentItem.topic) ||
            "-";

        $("title").value =
            safe(currentItem.title);

        $("status").value =
            safe(currentItem.status) ||
            "draft";

        if (type === "lesson") {

            $("lessonFields")
                .classList
                .remove("hidden");

            $("content").value =
                safe(currentItem.content);

            $("videoUrl").value =
                safe(currentItem.video_url);

            $("orderNumber").value =
                currentItem.order_number || 1;
        }

        if (type === "exercise") {

            $("exerciseFields")
                .classList
                .remove("hidden");

            $("question").value =
                safe(currentItem.question);

            $("answer").value =
                safe(currentItem.answer);

            $("difficulty").value =
                safe(currentItem.difficulty) ||
                "medium";
        }

        if (type === "resource") {

            $("resourceFields")
                .classList
                .remove("hidden");

            $("description").value =
                safe(currentItem.description);

            $("resourceType").value =
                safe(currentItem.type) ||
                "pdf";
        }
    }

    function buildPayload() {

        const payload = {
            title:
                $("title").value.trim(),

            status:
                $("status").value
        };

        if (type === "lesson") {

            payload.content =
                $("content")
                    .value
                    .trim();

            payload.video_url =
                $("videoUrl")
                    .value
                    .trim() || null;

            payload.order_number =
                Number(
                    $("orderNumber")
                        .value || 1
                );
        }

        if (type === "exercise") {

            payload.question =
                $("question")
                    .value
                    .trim();

            payload.answer =
                $("answer")
                    .value
                    .trim();

            payload.difficulty =
                $("difficulty")
                    .value;
        }

        if (type === "resource") {

            payload.description =
                $("description")
                    .value
                    .trim() || null;

            payload.type =
                $("resourceType")
                    .value;
        }

        if (
            payload.status ===
            "published"
        ) {

            payload.published_at =
                currentItem.published_at ||
                new Date().toISOString();

        } else {

            payload.published_at =
                null;
        }

        return payload;
    }

    async function save() {

        try {

            const payload =
                buildPayload();

            if (!payload.title) {
                showStatus(
                    "العنوان مطلوب.",
                    false
                );
                return;
            }

            if (
                type === "lesson" &&
                !payload.content
            ) {

                showStatus(
                    "محتوى الدرس مطلوب.",
                    false
                );

                return;
            }

            const {
                error
            } =
                await updateItem(payload);

            if (error) {
                throw error;
            }

            currentItem = {
                ...currentItem,
                ...payload
            };

            showStatus(
                "تم حفظ التعديلات بنجاح.",
                true
            );

            renderPreview();

        } catch (error) {

            console.error(error);

            showStatus(
                "تعذر الحفظ: " +
                error.message,
                false
            );
        }
    }

    async function updateItem(payload) {

        if (type === "lesson") {

            return await supabaseClient
                .from("lessons")
                .update(payload)
                .eq("id", id);
        }

        if (type === "exercise") {

            return await supabaseClient
                .from("exercises")
                .update(payload)
                .eq("id", id);
        }

        return await supabaseClient
            .from("resources")
            .update(payload)
            .eq("id", id);
    }

    async function setStatus(status) {

        $("status").value =
            status;

        await save();
    }

    function renderPreview() {

        const title =
            $("title").value.trim();

        const preview =
            $("preview");

        preview.innerHTML = "";

        const titleElement =
            document.createElement("h2");

        titleElement.textContent =
            title || "بدون عنوان";

        preview.appendChild(
            titleElement
        );

        if (type === "lesson") {

            const text =
                document.createElement("div");

            text.textContent =
                $("content").value;

            preview.appendChild(text);

            const video =
                $("videoUrl")
                    .value
                    .trim();

            if (video) {

                const p =
                    document.createElement("p");

                p.textContent =
                    "الفيديو: " + video;

                preview.appendChild(p);
            }
        }

        if (type === "exercise") {

            const question =
                document.createElement("div");

            question.textContent =
                "السؤال: " +
                $("question").value;

            preview.appendChild(
                question
            );

            const difficulty =
                document.createElement("p");

            difficulty.textContent =
                "الصعوبة: " +
                $("difficulty")
                    .selectedOptions[0]
                    .textContent;

            preview.appendChild(
                difficulty
            );
        }

        if (type === "resource") {

            const description =
                document.createElement("div");

            description.textContent =
                $("description")
                    .value;

            preview.appendChild(
                description
            );
        }
    }

    $("saveBtn")
        .addEventListener(
            "click",
            save
        );

    $("previewBtn")
        .addEventListener(
            "click",
            renderPreview
        );

    $("publishBtn")
        .addEventListener(
            "click",
            () => setStatus("published")
        );

    $("reviewBtn")
        .addEventListener(
            "click",
            () => setStatus("review")
        );

    initialize();

})();
