window.HAMOU_CONFIG = Object.freeze({
  appName: "HAMOU MATH",
  version: "31.0.0",

  apiBase: "/api",

  supabaseUrl:
    window.__SUPABASE_URL__ || "",

  supabasePublishableKey:
    window.__SUPABASE_PUBLISHABLE_KEY__ || "",

  ownerEmail:
    "aminehamou2101@gmail.com",

  defaultLanguage: "ar",

  supportedLanguages: [
    "ar",
    "fr",
    "en",
    "es",
    "de"
  ]
});
