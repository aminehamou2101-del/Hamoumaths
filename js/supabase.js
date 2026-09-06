(function () {
  "use strict";

  const cfg = window.HAMOU_CONFIG || {};

  window.HAMOU_SUPABASE = null;

  if (
    !window.supabase ||
    !cfg.supabaseUrl ||
    !cfg.supabasePublishableKey
  ) {
    console.warn(
      "HAMOU MATH: Supabase configuration is missing."
    );
    return;
  }

  try {
    window.HAMOU_SUPABASE =
      window.supabase.createClient(
        cfg.supabaseUrl,
        cfg.supabasePublishableKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );
  } catch (error) {
    console.error(
      "HAMOU MATH Supabase initialization failed:",
      error
    );
  }
})();
