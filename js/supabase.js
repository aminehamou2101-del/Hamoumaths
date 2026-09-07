// =====================================================
// HAMOU MATH
// Supabase Client Configuration
// =====================================================


// رابط مشروع Supabase
const SUPABASE_URL = "https://ifurlsucekmaynuhsfva.supabase.co";


// المفتاح العام فقط (anon public key)
const SUPABASE_ANON_KEY = "sb_publishable_WRvn0kt8kJ3SSy2WG1ca4w_dzZQBrBUنا";


// إنشاء الاتصال
const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);



// =====================================================
// AUTH
// =====================================================


// المستخدم الحالي
async function getCurrentUser(){

    const {
        data:{
            user
        }
    } = await supabaseClient
        .auth
        .getUser();


    return user || null;

}



// تسجيل الخروج
async function logout(){

    await supabaseClient
        .auth
        .signOut();

    window.location.href="/";

}



// =====================================================
// PROFILE
// =====================================================


// جلب بيانات المستخدم
async function getProfile(){

    const user = await getCurrentUser();


    if(!user)
        return null;


    const {
        data,
        error
    } = await supabaseClient

    .from("profiles")

    .select("*")

    .eq(
        "id",
        user.id
    )

    .single();



    if(error){

        console.error(error);

        return null;

    }


    return data;

}



// =====================================================
// PERMISSIONS
// =====================================================


// هل هو Owner
async function isOwner(){

    const profile =
        await getProfile();


    return profile?.role === "owner";

}



// هل هو Admin
async function isAdmin(){

    const profile =
        await getProfile();


    return (
        profile?.role === "admin"
        ||
        profile?.role === "owner"
    );

}



// هل هو أستاذ
async function isTeacher(){

    const profile =
        await getProfile();


    return (
        profile?.role === "teacher"
        ||
        profile?.role === "admin"
        ||
        profile?.role === "owner"
    );

}



// =====================================================
// RESOURCES
// =====================================================


// جلب الكتب والدروس والملفات

async function getResources(){


    const {
        data,
        error
    } = await supabaseClient

    .from("resources")

    .select("*")

    .order(
        "created_at",
        {
            ascending:false
        }
    );


    if(error){

        console.error(error);

        return [];

    }


    return data;

}



// =====================================================
// XP SYSTEM
// =====================================================


// إضافة نقاط

async function addXP(
    userId,
    amount
){


    const {
        error
    } = await supabaseClient

    .rpc(
        "add_xp",
        {
            p_user:userId,
            p_amount:amount
        }
    );


    if(error)
        console.error(error);

}



// =====================================================
// STORAGE
// =====================================================


// رفع ملف PDF

async function uploadFile(
file
){


    const fileName =
    Date.now()
    +
    "-"
    +
    file.name;



    const {
        data,
        error
    } =
    await supabaseClient

    .storage

    .from("hamou-files")

    .upload(
        fileName,
        file
    );



    if(error){

        console.error(error);

        return null;

    }



    const {
        data:urlData
    } =
    supabaseClient

    .storage

    .from("hamou-files")

    .getPublicUrl(
        fileName
    );



    return urlData.publicUrl;

}
async function getNotifications() {
  const user = await getCurrentUser();

  if (!user) return [];

  const { data, error } = await supabaseClient
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Notifications error:", error);
    return [];
  }

  return data || [];
}


async function markNotificationAsRead(id) {
  const { error } = await supabaseClient
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) {
    console.error("Notification update error:", error);
    return false;
  }

  return true;
}
