(function () {

    "use strict";

    let contents = [];

    const $ = id =>
        document.getElementById(id);

    function showStatus(
        message,
        success = true
    ) {

        const box = $("status");

        box.textContent = message;

        box.className =
            `status show ${
                success
                    ? "success"
                    : "error"
            }`;
    }

    async function checkAccess() {

        const {
            data,
            error
        } =
            await supabaseClient.auth
                .getUser();

        if (error) {
            throw error;
        }

        if (!data.user) {

            location.href =
                "login.html?redirect=content-review.html";

            return false;
        }

        const {
            data: profile,
            error: profileError
        } =
            await supabaseClient
                .from("profiles")
                .select("role")
                .eq(
                    "id",
                    data.user.id
                )
                .single();

        if (profileError) {
            throw profileError;
        }

        if (
            profile.role !== "owner" &&
            profile.role !== "admin"
        ) {

            showStatus(
                "هذه الصفحة متاحة للـOwner وAdmin فقط.",
                false
            );

            return false;
        }

        return true;
    }

    async function loadContent() {

        const [
            lessons,
            exercises,
            resources
        ] = await Promise.all([

            supabaseClient
                .from("lessons")
                .select(`
                    id,
                    title,
                    topic,
                    status,
                    created_at,
                    created_by
                `)
                .eq(
                    "status",
                    "review"
                ),

            supabaseClient
                .from("exercises")
                .select(`
                    id,
                    title,
                    topic,
                    status,
                    difficulty,
                    created_at,
                    created_by
                `)
                .eq(
                    "status",
                    "review"
                ),

            supabaseClient
                .from("resources")
                .select(`
                    id,
                    title,
                    topic,
                    status,
                    type,
                    created_at,
                    uploaded_by
                `)
                .eq(
                    "status",
                    "review"
                )

        ]);

        if (lessons.error) {
            throw lessons.error;
        }

        if (exercises.error) {
            throw exercises.error;
        }

        if (resources.error) {
            throw resources.error;
        }

        contents = [

            ...(lessons.data || [])
                .map(item => ({
                    ...item,
                    contentType: "lesson",
                    label: "درس"
                })),

            ...(exercises.data || [])
                .map(item => ({
                    ...item,
                    contentType: "exercise",
                    label: "تمرين"
                })),

            ...(resources.data || [])
                .map(item => ({
                    ...item,
                    contentType: "resource",
                    label: "مورد"
                }))

        ];

        contents.sort(
            (a, b) =>
                new Date(a.created_at) -
                new Date(b.created_at)
        );

        render();
    }

    function render() {

        const query =
            $("search")
                .value
                .trim()
                .toLowerCase();

        const type =
            $("type").value;

        const filtered =
            contents.filter(item => {

                const text = [
                    item.title,
                    item.topic,
                    item.label
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return (
                    (!query ||
                        text.includes(query)) &&
                    (!type ||
                        item.contentType === type)
                );
            });

        if (!filtered.length) {

            $("table").innerHTML =
                `<div class="empty">
                    لا توجد محتويات قيد المراجعة.
                </div>`;

            return;
        }

        const table =
            document.createElement("table");

        const thead =
            document.createElement("thead");

        const tr =
            document.createElement("tr");

        [
            "النوع",
            "العنوان",
            "الموضوع",
            "التاريخ",
            "الإجراءات"
        ].forEach(text => {

            const th =
                document.createElement("th");

            th.textContent =
                text;

            tr.appendChild(th);

        });

        thead.appendChild(tr);
        table.appendChild(thead);

        const tbody =
            document.createElement("tbody");

        filtered.forEach(item => {

            const row =
                document.createElement("tr");

            const typeCell =
                document.createElement("td");

            const badge =
                document.createElement("span");

            badge.className =
                `badge ${item.contentType}`;

            badge.textContent =
                item.label;

            typeCell.appendChild(badge);
            row.appendChild(typeCell);

            const titleCell =
                document.createElement("td");

            titleCell.textContent =
                item.title || "";

            row.appendChild(titleCell);

            const topicCell =
                document.createElement("td");

            topicCell.textContent =
                item.topic || "-";

            row.appendChild(topicCell);

            const dateCell =
                document.createElement("td");

            dateCell.textContent =
                new Date(
                    item.created_at
                ).toLocaleString(
                    "ar-DZ"
                );

            row.appendChild(dateCell);

            const actionsCell =
                document.createElement("td");

            const actions =
                document.createElement("div");

            actions.className =
                "actions";

            // فتح المحرر
            const open =
                document.createElement("button");

            open.className =
                "open";

            open.textContent =
                "فتح";

            open.onclick = () => {

                location.href =
                    `content-editor.html?type=${
                        encodeURIComponent(
                            item.contentType
                        )
                    }&id=${
                        encodeURIComponent(
                            item.id
                        )
                    }`;

            };

            actions.appendChild(open);

            // نشر
            const approve =
                document.createElement("button");

            approve.className =
                "approve";

            approve.textContent =
                "نشر";

            approve.onclick = () =>
                review(
                    item,
                    "approved"
                );

            actions.appendChild(approve);

            // رفض
            const reject =
                document.createElement("button");

            reject.className =
                "reject";

            reject.textContent =
                "إعادة للمسودة";

            reject.onclick = () =>
                rejectContent(item);

            actions.appendChild(reject);

            actionsCell.appendChild(actions);
            row.appendChild(actionsCell);

            tbody.appendChild(row);

        });

        table.appendChild(tbody);

        $("table").innerHTML = "";

        $("table")
            .appendChild(table);
    }

    async function rejectContent(item) {

        const note =
            prompt(
                "اكتب سبب إعادة المحتوى للمسودة:"
            );

        if (
            note === null
        ) {
            return;
        }

        await review(
            item,
            "rejected",
            note
        );
    }

    async function review(
        item,
        action,
        note = null
    ) {

        const actionText =
            action === "approved"
                ? "نشر"
                : "إعادة للمسودة";

        if (
            !confirm(
                `تأكيد: ${actionText} "${item.title}"؟`
            )
        ) {
            return;
        }

        const {
            data,
            error
        } =
            await supabaseClient
                .rpc(
                    "review_content",
                    {
                        p_content_type:
                            item.contentType,

                        p_content_id:
                            item.id,

                        p_action:
                            action,

                        p_note:
                            note
                    }
                );

        if (error) {

            console.error(error);

            showStatus(
                "فشلت عملية المراجعة: " +
                error.message,
                false
            );

            return;
        }

        console.log(data);

        showStatus(
            action === "approved"
                ? "تم نشر المحتوى."
                : "تمت إعادته إلى المسودة.",
            true
        );

        await loadContent();
    }

    $("search")
        .addEventListener(
            "input",
            render
        );

    $("type")
        .addEventListener(
            "change",
            render
        );

    async function start() {

        try {

            const allowed =
                await checkAccess();

            if (!allowed) {
                return;
            }

            await loadContent();

        } catch (error) {

            console.error(error);

            showStatus(
                "تعذر تحميل مركز المراجعة: " +
                error.message,
                false
            );
        }
    }

    start();

})();
