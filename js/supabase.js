"use strict";

/* =========================================================
   HAMOU MATH
   Supabase Browser Client
   ========================================================= */

const SUPABASE_URL =
    "https://ifurlsucekmaynuhsfva.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_WRvn0kt8kJ3SSy2WG1ca4w_dzZQBrBU";

if (typeof supabase === "undefined") {
    throw new Error(
        "Supabase JS library غير محملة."
    );
}

const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );

/* =========================================================
   AUTH
   ========================================================= */

async function getCurrentUser() {
    const {
        data,
        error
    } = await supabaseClient.auth.getUser();

    if (error) {
        console.error(
            "getCurrentUser:",
            error
        );
        return null;
    }

    return data?.user || null;
}

async function getSession() {
    const {
        data,
        error
    } = await supabaseClient.auth.getSession();

    if (error) {
        console.error(
            "getSession:",
            error
        );
        return null;
    }

    return data?.session || null;
}

async function logout() {
    const {
        error
    } = await supabaseClient.auth.signOut();

    if (error) {
        console.error(
            "logout:",
            error
        );
        throw error;
    }

    window.location.href = "../index.html";
}

/* =========================================================
   PROFILE
   ========================================================= */

async function getProfile() {
    const user =
        await getCurrentUser();

    if (!user) {
        return null;
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("profiles")
        .select(`
            id,
            email,
            full_name,
            avatar_url,
            role,
            xp,
            level
        `)
        .eq(
            "id",
            user.id
        )
        .maybeSingle();

    if (error) {
        console.error(
            "getProfile:",
            error
        );
        return null;
    }

    return data;
}

/* =========================================================
   ROLES
   ========================================================= */

async function isOwner() {
    const profile =
        await getProfile();

    return profile?.role === "owner";
}

async function isAdmin() {
    const profile =
        await getProfile();

    return (
        profile?.role === "admin" ||
        profile?.role === "owner"
    );
}

async function isTeacher() {
    const profile =
        await getProfile();

    return (
        profile?.role === "teacher" ||
        profile?.role === "admin" ||
        profile?.role === "owner"
    );
}

/* =========================================================
   XP
   ========================================================= */

async function addXP(
    userId,
    amount
) {
    if (!userId) {
        throw new Error(
            "معرف المستخدم غير موجود."
        );
    }

    const {
        data,
        error
    } = await supabaseClient.rpc(
        "add_xp",
        {
            p_user: userId,
            p_amount: amount
        }
    );

    if (error) {
        throw error;
    }

    return data;
}

/* =========================================================
   RESOURCES
   ========================================================= */

async function getResources() {
    const {
        data,
        error
    } = await supabaseClient
        .from("resources")
        .select("*")
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
        console.error(
            "getResources:",
            error
        );

        return [];
    }

    return data || [];
}

/* =========================================================
   STORAGE
   ========================================================= */

async function uploadFile(file) {

    if (!file) {
        throw new Error(
            "لم يتم اختيار ملف."
        );
    }

    const user =
        await getCurrentUser();

    if (!user) {
        throw new Error(
            "يجب تسجيل الدخول أولًا."
        );
    }

    const safeName =
        file.name
            .normalize("NFKD")
            .replace(
                /[^\w.\-]+/g,
                "_"
            )
            .replace(
                /_+/g,
                "_"
            )
            .slice(0, 120);

    const path =
        `teacher/${user.id}/${crypto.randomUUID()}-${safeName}`;

    const {
        error
    } = await supabaseClient.storage
        .from("hamou-files")
        .upload(
            path,
            file,
            {
                upsert: false,
                contentType:
                    file.type ||
                    "application/octet-stream"
            }
        );

    if (error) {
        throw error;
    }

    const {
        data
    } = supabaseClient.storage
        .from("hamou-files")
        .getPublicUrl(path);

    return {
        path,
        url: data.publicUrl
    };
}
