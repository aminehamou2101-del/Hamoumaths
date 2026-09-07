(function () {
    "use strict";

    const form = document.getElementById("curriculumForm");
    const itemId = document.getElementById("itemId");

    const level = document.getElementById("level");
    const subject = document.getElementById("subject");
    const unit = document.getElementById("unit");
    const topic = document.getElementById("topic");
    const description = document.getElementById("description");
    const orderNumber = document.getElementById("orderNumber");
    const isActive = document.getElementById("isActive");

    const formTitle = document.getElementById("formTitle");
    const resetBtn = document.getElementById("resetBtn");

    const statusBox = document.getElementById("status");
    const accessMessage = document.getElementById("accessMessage");

    const searchInput = document.getElementById("searchInput");
    const levelFilter = document.getElementById("levelFilter");
    const statusFilter = document.getElementById("statusFilter");

    const tableContainer =
        document.getElementById("tableContainer");

    const editorCard =
        document.getElementById("editorCard");

    let curriculum = [];
    let isOwnerAccount = false;

    function showStatus(message, type = "success") {
        statusBox.textContent = message;
        statusBox.className = `status show ${type}`;
    }

    function clearStatus() {
        statusBox.textContent = "";
        statusBox.className = "status";
    }

    function resetForm() {
        form.reset();

        itemId.value = "";
        orderNumber.value = "1";
        isActive.value = "true";

        formTitle.textContent =
            "إضافة عنصر جديد";

        clearStatus();
    }

    function safeText(value) {
        return String(value ?? "");
    }

    async function requireOwner() {
        try {
            const user =
                await getCurrentUser();

            if (!user) {
                window.location.href =
                    "login.html?redirect=curriculum-admin.html";

                return false;
            }

            isOwnerAccount =
                await isOwner();

            if (!isOwnerAccount) {

                editorCard.style.display = "none";

                accessMessage.textContent =
                    "هذا القسم متاح لحساب Owner فقط.";

                accessMessage.className =
                    "status error show";

                return false;
            }

            accessMessage.textContent =
                "تم التحقق: لديك صلاحيات Owner الكاملة.";

            accessMessage.className =
                "status success show";

            editorCard.style.display = "block";

            return true;

        } catch (error) {

            console.error(error);

            accessMessage.textContent =
                "تعذر التحقق من الصلاحيات.";

            accessMessage.className =
                "status error show";

            return false;
        }
    }

    async function loadCurriculum() {

        tableContainer.innerHTML =
            '<div class="loading">جارِ تحميل المنهاج...</div>';

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
                order_number,
                is_active,
                created_at,
                updated_at
            `)
            .order("level", {
                ascending: true
            })
            .order("subject", {
                ascending: true
            })
            .order("order_number", {
                ascending: true
            })
            .order("topic", {
                ascending: true
            });

        if (error) {
            console.error(error);

            tableContainer.innerHTML = "";

            const errorBox =
                document.createElement("div");

            errorBox.className =
                "status error show";

            errorBox.textContent =
                "خطأ في تحميل المنهاج: " +
                error.message;

            tableContainer.appendChild(errorBox);

            return;
        }

        curriculum = data || [];

        fillLevelFilter();
        renderTable();
    }

    function fillLevelFilter() {

        const current =
            levelFilter.value;

        while (levelFilter.options.length > 1) {
            levelFilter.remove(1);
        }

        const levels = [
            ...new Set(
                curriculum
                    .map(item => item.level)
                    .filter(Boolean)
            )
        ].sort((a, b) =>
            a.localeCompare(b, "ar")
        );

        for (const value of levels) {

            const option =
                document.createElement("option");

            option.value = value;
            option.textContent = value;

            levelFilter.appendChild(option);
        }

        if (
            levels.includes(current)
        ) {
            levelFilter.value = current;
        }
    }

    function getFilteredItems() {

        const query =
            searchInput.value
                .trim()
                .toLowerCase();

        const selectedLevel =
            levelFilter.value;

        const selectedStatus =
            statusFilter.value;

        return curriculum.filter(item => {

            const haystack = [
                item.level,
                item.subject,
                item.unit,
                item.topic,
                item.description
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !query ||
                haystack.includes(query);

            const matchesLevel =
                !selectedLevel ||
                item.level === selectedLevel;

            const matchesStatus =
                !selectedStatus ||
                String(item.is_active) ===
                selectedStatus;

            return (
                matchesSearch &&
                matchesLevel &&
                matchesStatus
            );
        });
    }

    function renderTable() {

        const items =
            getFilteredItems();

        if (!items.length) {

            tableContainer.innerHTML =
                '<div class="empty">لا توجد عناصر مطابقة.</div>';

            return;
        }

        const table =
            document.createElement("table");

        const thead =
            document.createElement("thead");

        const headerRow =
            document.createElement("tr");

        [
            "#",
            "المستوى",
            "المادة",
            "الوحدة",
            "الموضوع",
            "الحالة",
            "الإجراءات"
        ].forEach(text => {

            const th =
                document.createElement("th");

            th.textContent = text;

            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody =
            document.createElement("tbody");

        items.forEach((item, index) => {

            const tr =
                document.createElement("tr");

            // ترتيب
            const orderTd =
                document.createElement("td");

            orderTd.textContent =
                safeText(item.order_number);

            tr.appendChild(orderTd);

            // المستوى
            const levelTd =
                document.createElement("td");

            levelTd.textContent =
                safeText(item.level);

            tr.appendChild(levelTd);

            // المادة
            const subjectTd =
                document.createElement("td");

            subjectTd.textContent =
                safeText(item.subject);

            tr.appendChild(subjectTd);

            // الوحدة
            const unitTd =
                document.createElement("td");

            unitTd.textContent =
                safeText(item.unit);

            tr.appendChild(unitTd);

            // الموضوع
            const topicTd =
                document.createElement("td");

            topicTd.textContent =
                safeText(item.topic);

            tr.appendChild(topicTd);

            // الحالة
            const statusTd =
                document.createElement("td");

            const badge =
                document.createElement("span");

            badge.className =
                item.is_active
                    ? "badge badge-active"
                    : "badge badge-off";

            badge.textContent =
                item.is_active
                    ? "نشط"
                    : "مخفي";

            statusTd.appendChild(badge);
            tr.appendChild(statusTd);

            // الإجراءات
            const actionTd =
                document.createElement("td");

            const actionWrap =
                document.createElement("div");

            actionWrap.className =
                "mini-actions";

            // تعديل
            const editBtn =
                document.createElement("button");

            editBtn.className =
                "btn-secondary";

            editBtn.textContent =
                "تعديل";

            editBtn.addEventListener(
                "click",
                () => editItem(item)
            );

            actionWrap.appendChild(editBtn);

            // أعلى
            const upBtn =
                document.createElement("button");

            upBtn.className =
                "btn-secondary";

            upBtn.textContent =
                "↑";

            upBtn.title =
                "رفع في الترتيب";

            upBtn.addEventListener(
                "click",
                () => moveItem(item, -1)
            );

            actionWrap.appendChild(upBtn);

            // أسفل
            const downBtn =
                document.createElement("button");

            downBtn.className =
                "btn-secondary";

            downBtn.textContent =
                "↓";

            downBtn.title =
                "خفض في الترتيب";

            downBtn.addEventListener(
                "click",
                () => moveItem(item, 1)
            );

            actionWrap.appendChild(downBtn);

            // تفعيل / إخفاء
            const toggleBtn =
                document.createElement("button");

            toggleBtn.className =
                item.is_active
                    ? "btn-danger"
                    : "btn-success";

            toggleBtn.textContent =
                item.is_active
                    ? "إخفاء"
                    : "تفعيل";

            toggleBtn.addEventListener(
                "click",
                () => toggleActive(item)
            );

            actionWrap.appendChild(toggleBtn);

            // حذف
            const deleteBtn =
                document.createElement("button");

            deleteBtn.className =
                "btn-danger";

            deleteBtn.textContent =
                "حذف";

            deleteBtn.addEventListener(
                "click",
                () => deleteItem(item)
            );

            actionWrap.appendChild(deleteBtn);

            actionTd.appendChild(actionWrap);
            tr.appendChild(actionTd);

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);

        tableContainer.innerHTML = "";
        tableContainer.appendChild(table);
    }

    function editItem(item) {

        itemId.value =
            item.id;

        level.value =
            item.level || "";

        subject.value =
            item.subject || "";

        unit.value =
            item.unit || "";

        topic.value =
            item.topic || "";

        description.value =
            item.description || "";

        orderNumber.value =
            item.order_number || 1;

        isActive.value =
            String(item.is_active);

        formTitle.textContent =
            "تعديل عنصر المنهاج";

        clearStatus();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    async function saveItem(event) {

        event.preventDefault();

        if (!isOwnerAccount) {
            showStatus(
                "ليس لديك صلاحية الإدارة.",
                "error"
            );
            return;
        }

        const payload = {
            level: level.value.trim(),
            subject: subject.value.trim(),
            unit: unit.value.trim(),
            topic: topic.value.trim(),
            description:
                description.value.trim() || null,
            order_number:
                Number(orderNumber.value),
            is_active:
                isActive.value === "true"
        };

        if (
            !payload.level ||
            !payload.subject ||
            !payload.unit ||
            !payload.topic
        ) {
            showStatus(
                "املأ الحقول المطلوبة.",
                "error"
            );
            return;
        }

        if (
            !Number.isInteger(
                payload.order_number
            ) ||
            payload.order_number < 1
        ) {
            showStatus(
                "الترتيب يجب أن يكون رقمًا صحيحًا أكبر من 0.",
                "error"
            );
            return;
        }

        let response;

        if (itemId.value) {

            response =
                await supabaseClient
                    .from("curriculum")
                    .update(payload)
                    .eq("id", itemId.value);

        } else {

            response =
                await supabaseClient
                    .from("curriculum")
                    .insert(payload);
        }

        if (response.error) {

            console.error(response.error);

            showStatus(
                "تعذر الحفظ: " +
                response.error.message,
                "error"
            );

            return;
        }

        showStatus(
            itemId.value
                ? "تم تعديل عنصر المنهاج بنجاح."
                : "تمت إضافة عنصر المنهاج بنجاح.",
            "success"
        );

        resetForm();

        await loadCurriculum();
    }

    async function deleteItem(item) {

        if (!isOwnerAccount) {
            return;
        }

        const confirmed =
            window.confirm(
                `هل تريد حذف "${item.topic}" نهائيًا؟`
            );

        if (!confirmed) {
            return;
        }

        const {
            error
        } = await supabaseClient
            .from("curriculum")
            .delete()
            .eq("id", item.id);

        if (error) {

            console.error(error);

            showStatus(
                "تعذر الحذف: " +
                error.message,
                "error"
            );

            return;
        }

        showStatus(
            "تم حذف العنصر.",
            "success"
        );

        await loadCurriculum();
    }

    async function toggleActive(item) {

        if (!isOwnerAccount) {
            return;
        }

        const {
            error
        } = await supabaseClient
            .from("curriculum")
            .update({
                is_active:
                    !item.is_active
            })
            .eq("id", item.id);

        if (error) {

            console.error(error);

            showStatus(
                "تعذر تغيير الحالة: " +
                error.message,
                "error"
            );

            return;
        }

        await loadCurriculum();
    }

    async function moveItem(item, direction) {

        if (!isOwnerAccount) {
            return;
        }

        const sameGroup =
            curriculum
                .filter(other =>
                    other.level === item.level &&
                    other.subject === item.subject
                )
                .sort((a, b) =>
                    Number(a.order_number) -
                    Number(b.order_number)
                );

        const currentIndex =
            sameGroup.findIndex(
                x => x.id === item.id
            );

        const targetIndex =
            currentIndex + direction;

        if (
            currentIndex < 0 ||
            targetIndex < 0 ||
            targetIndex >= sameGroup.length
        ) {
            return;
        }

        const target =
            sameGroup[targetIndex];

        const currentOrder =
            item.order_number;

        const targetOrder =
            target.order_number;

        // تبديل آمن للترتيب باستخدام
        // قيمة مؤقتة
        const temporaryOrder =
            999999;

        const first =
            await supabaseClient
                .from("curriculum")
                .update({
                    order_number:
                        temporaryOrder
                })
                .eq("id", item.id);

        if (first.error) {
            showStatus(
                "تعذر إعادة الترتيب.",
                "error"
            );
            return;
        }

        const second =
            await supabaseClient
                .from("curriculum")
                .update({
                    order_number:
                        currentOrder
                })
                .eq("id", target.id);

        if (second.error) {
            showStatus(
                "تعذر إعادة الترتيب.",
                "error"
            );
            return;
        }

        const third =
            await supabaseClient
                .from("curriculum")
                .update({
                    order_number:
                        targetOrder
                })
                .eq("id", item.id);

        if (third.error) {
            showStatus(
                "تعذر إكمال إعادة الترتيب.",
                "error"
            );
            return;
        }

        await loadCurriculum();
    }

    form.addEventListener(
        "submit",
        saveItem
    );

    resetBtn.addEventListener(
        "click",
        resetForm
    );

    searchInput.addEventListener(
        "input",
        renderTable
    );

    levelFilter.addEventListener(
        "change",
        renderTable
    );

    statusFilter.addEventListener(
        "change",
        renderTable
    );

    async function start() {

        const allowed =
            await requireOwner();

        await loadCurriculum();

        if (allowed) {
            resetForm();
        }
    }

    start();

})();
