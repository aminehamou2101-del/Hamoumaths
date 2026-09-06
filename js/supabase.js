import { createClient } from
  "https://esm.sh/@supabase/supabase-js@2";

import { CONFIG } from "./config.js";

export const supabase =
  CONFIG.SUPABASE_URL &&
  CONFIG.SUPABASE_ANON_KEY
    ? createClient(
        CONFIG.SUPABASE_URL,
        CONFIG.SUPABASE_ANON_KEY
      )
    : null;

export const supabaseEnabled = Boolean(supabase);
