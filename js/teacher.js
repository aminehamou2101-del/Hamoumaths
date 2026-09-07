(function () {
  "use strict";

  async function loadDashboard() {
    const state =
      window.HAMOU_AUTH_STATE;

    if (!state?.isLoggedIn) {
      return;
    }

    const role =
      state.profile?.role;

    const teacherRoles = [
      "teacher",
      "admin",
      "owner"
    ];

    if (!teacherRoles.includes(role)) {
      return;
    }

    document
      .querySelectorAll(
        "[data-teacher-only]"
      )
      .forEach((element) => {
        element.classList.remove(
          "hidden"
        );
      });
  }

  function generateDocument(type) {
    const title =
      document.querySelector(
        "#teacherTitle"
      )?.value || "";

    const level =
      document.querySelector(
        "#teacherLevel"
      )?.value || "";

    const output =
      document.querySelector(
        "#teacherOutput"
      );

    if (!output) {
      return;
    }

    output.textContent =
      `نوع الوثيقة: ${type}\n` +
      `العنوان: ${title}\n` +
      `المستوى: ${level}\n\n` +
      `سيتم إنشاء المحتوى عبر خدمة HAMOU MATH AI عند ربط مفتاح الخادم.`;
  }

  window.HAMOU_TEACHER = {
    loadDashboard,
    generateDocument
  };
async function checkTeacherAccess(){


const profile =
await getUserProfile();



if(!profile ||
(
profile.role!=="teacher" &&
profile.role!=="admin" &&
profile.role!=="owner"
))

{

alert("غير مسموح");

location.href="dashboard.html";

return false;

}


return profile;

}



async function addResource(){


const profile =
await checkTeacherAccess();


if(!profile)
return;



const title =
document.getElementById("title").value;


const description =
document.getElementById("description").value;


const type =
document.getElementById("type").value;


const fileUrl =
document.getElementById("fileUrl").value;



const {error}=

await supabaseClient

.from("resources")

.insert({

title:title,

description:description,

type:type,

file_url:fileUrl,

uploaded_by:profile.id

});



if(error){

alert(error.message);

return;

}


alert("تم إضافة المورد");


}



async function addLesson(){


const profile =
await checkTeacherAccess();



if(!profile)
return;



const title =
document.getElementById("lessonTitle").value;


const content =
document.getElementById("lessonContent").value;



const {error}=

await supabaseClient

.from("lessons")

.insert({

title:title,

content:content

});



if(error){

alert(error.message);

return;

}


alert("تم إضافة الدرس");


}




checkTeacherAccess();
  window.addEventListener(
    "hamou:auth",
    loadDashboard
  );
})();

async function uploadResource(){


const profile =
await getProfile();


if(!profile){

alert("يجب تسجيل الدخول");

return;

}



const file =
document
.getElementById("pdfFile")
.files[0];



if(!file){

alert("اختر ملف PDF");

return;

}




// اسم الملف

const fileName =

Date.now()
+
"-"
+
file.name;



// رفع إلى Storage

const {

data,

error

}= await supabaseClient

.storage

.from("hamou-files")

.upload(
fileName,
file
);



if(error){

alert(error.message);

return;

}



// الحصول على الرابط

const {

data:urlData

}=

supabaseClient

.storage

.from("hamou-files")

.getPublicUrl(
fileName
);



const fileUrl =
urlData.publicUrl;




// حفظ البيانات في جدول resources


const {

error:dbError

}= await supabaseClient

.from("resources")

.insert({

title:
document.getElementById("title").value,


description:
document.getElementById("description").value,


type:
document.getElementById("type").value,


file_url:fileUrl,


uploaded_by:profile.id

});




if(dbError){

alert(dbError.message);

return;

}



alert("✅ تم رفع الملف بنجاح");


location.reload();
  async function addExercise(){


const profile =
await getProfile();


if(!profile){

alert("يجب تسجيل الدخول");

return;

}



const title =
document.getElementById(
"exerciseTitle"
).value;


const question =
document.getElementById(
"exerciseQuestion"
).value;


const answer =
document.getElementById(
"exerciseAnswer"
).value;


const difficulty =
document.getElementById(
"exerciseDifficulty"
).value;



if(!title || !question || !answer){

alert("املأ جميع الحقول");

return;

}




const {error}=

await supabaseClient

.from("exercises")

.insert({

title:title,

question:question,

answer:answer,

difficulty:difficulty,

created_by:profile.id

});





if(error){

alert(error.message);

return;

}



alert("✅ تم إضافة التمرين بنجاح");


}
  const curriculumId =
    window.HamouCurriculum
        ?.getSelectedId();

if (!curriculumId) {
    throw new Error(
        "يجب اختيار موضوع من المنهاج."
    );
}
  const lessonData = {
    title: lessonTitle.value.trim(),
    content: lessonContent.value.trim(),
    video_url:
        lessonVideo.value.trim() || null,

    curriculum_id: curriculumId,

    level:
        document.getElementById(
            "curriculumLevel"
        ).value,

    subject:
        document.getElementById(
            "curriculumSubject"
        ).value,

    unit:
        document.getElementById(
            "curriculumUnit"
        ).value,

    topic:
        document.getElementById(
            "curriculumTopic"
        ).selectedOptions[0]?.textContent || "",

    order_number:
        Number(
            lessonOrder.value || 1
        )
};
  
const { data, error } =
    await supabaseClient
        .from("lessons")
        .insert(lessonData)
        .select()
        .single();

if (error) {
    throw error;
}

console.log(
    "تم إنشاء الدرس:",
    data
);

}
async function createResource(event) {
    event.preventDefault();

    clearStatus("resourceStatus");

    if (!requireCurriculum()) {
        return;
    }

    const file =
        $("resourceFile").files[0];

    if (!file) {
        showStatus(
            "resourceStatus",
            "اختر ملفًا أولًا.",
            false
        );
        return;
    }

    const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ];

    if (!allowedTypes.includes(file.type)) {
        showStatus(
            "resourceStatus",
            "نوع الملف غير مسموح.",
            false
        );
        return;
    }

    const maxSize =
        50 * 1024 * 1024;

    if (file.size > maxSize) {
        showStatus(
            "resourceStatus",
            "الحد الأقصى لحجم الملف هو 50MB.",
            false
        );
        return;
    }

    const safeName =
        file.name
            .normalize("NFKD")
            .replace(/[^\w.\-]+/g, "_")
            .replace(/_+/g, "_")
            .slice(0, 120);

    const storagePath =
        `teacher/${currentUser.id}/${crypto.randomUUID()}-${safeName}`;

    showStatus(
        "resourceStatus",
        "جارٍ رفع الملف...",
        true
    );

    const {
        error: uploadError
    } = await supabaseClient.storage
        .from("hamou-files")
        .upload(
            storagePath,
            file,
            {
                upsert: false,
                contentType: file.type
            }
        );

    if (uploadError) {
        console.error(uploadError);

        showStatus(
            "resourceStatus",
            "فشل رفع الملف: " +
            uploadError.message,
            false
        );

        return;
    }

    const {
        data: publicData
    } = supabaseClient.storage
        .from("hamou-files")
        .getPublicUrl(storagePath);

    const fileUrl =
        publicData.publicUrl;

    const topicOption =
        $("curriculumTopic")
            .selectedOptions[0];

    const payload = {
        title:
            $("resourceTitle")
                .value
                .trim(),

        description:
            $("resourceDescription")
                .value
                .trim() || null,

        type:
            $("resourceType").value,

        file_url:
            fileUrl,

        uploaded_by:
            currentUser.id,

        curriculum_id:
            $("curriculumId").value,

        level:
            $("curriculumLevel").value,

        subject:
            $("curriculumSubject").value,

        unit:
            $("curriculumUnit").value,

        topic:
            topicOption
                ? topicOption.textContent
                : null
    };

    const {
        error: resourceError
    } = await supabaseClient
        .from("resources")
        .insert(payload);

    if (resourceError) {

        console.error(resourceError);

        // تنظيف الملف الذي تم رفعه إذا فشل الإدخال
        await supabaseClient.storage
            .from("hamou-files")
            .remove([storagePath]);

        showStatus(
            "resourceStatus",
            "تعذر حفظ المورد، وتم تنظيف الملف المرفوع.",
            false
        );

        return;
    }

    showStatus(
        "resourceStatus",
        "تم رفع المورد وربطه بالمنهاج بنجاح.",
        true
    );

    $("resourceForm").reset();
    $("fileName").textContent = "";

    await loadOwnContent();
}
const topicOption =
    $("curriculumTopic")
        .selectedOptions[0];

const lessonData = {
    title:
        $("lessonTitle").value.trim(),

    content:
        $("lessonContent").value.trim(),

    video_url:
        $("lessonVideo").value.trim() || null,

    order_number:
        Number(
            $("lessonOrder").value || 1
        ),

    curriculum_id:
        $("curriculumId").value,

    level:
        $("curriculumLevel").value,

    subject:
        $("curriculumSubject").value,

    unit:
        $("curriculumUnit").value,

    topic:
        topicOption
            ? topicOption.textContent
            : null,

    created_by:
        currentUser.id
};

const { error } =
    await supabaseClient
        .from("lessons")
        .insert(lessonData);

if (error) {
    throw error;
}const topicOption =
    $("curriculumTopic")
        .selectedOptions[0];

const exerciseData = {
    title:
        $("exerciseTitle").value.trim(),

    question:
        $("exerciseQuestion").value.trim(),

    answer:
        $("exerciseAnswer").value.trim(),

    difficulty:
        $("exerciseDifficulty").value,

    curriculum_id:
        $("curriculumId").value,

    level:
        $("curriculumLevel").value,

    subject:
        $("curriculumSubject").value,

    unit:
        $("curriculumUnit").value,

    topic:
        topicOption
            ? topicOption.textContent
            : null,

    created_by:
        currentUser.id
};

const { error } =
    await supabaseClient
        .from("exercises")
        .insert(exerciseData);

if (error) {
    throw error;
}
const editBtn =
    document.createElement("button");

editBtn.className =
    "secondary";

editBtn.textContent =
    "تعديل";

editBtn.onclick = () => {

    window.location.href =
        `content-editor.html?type=${encodeURIComponent(
            item.contentType
        )}&id=${encodeURIComponent(
            item.id
        )}`;
};

actions.appendChild(
    editBtn
);const statusTd =
    document.createElement("td");

const statusLabels = {
    draft: "مسودة",
    review: "قيد المراجعة",
    published: "منشور"
};

statusTd.textContent =
    statusLabels[item.status] ||
    item.status ||
    "غير محدد";

tr.appendChild(statusTd);status,
published_at,
updated_at
