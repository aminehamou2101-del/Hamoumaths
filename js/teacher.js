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
