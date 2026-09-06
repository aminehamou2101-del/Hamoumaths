const SUPABASE_URL = "ضع رابط مشروعك هنا";

const SUPABASE_ANON_KEY = "ضع المفتاح العام هنا";


const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
