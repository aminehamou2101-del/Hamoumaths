(function () {
  "use strict";

  const translations = {
    ar: {
      home: "الرئيسية",
      library: "المكتبة",
      tools: "الأدوات",
      games: "التحديات",
      teacher: "الأستاذ",
      login: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      search: "ابحث في الرياضيات...",
      lessons: "الدروس",
      exercises: "التمارين",
      exams: "الفروض والاختبارات",
      bac: "البكالوريا",
      calculator: "الحاسبة",
      graph: "الرسم البياني",
      ai: "HAMOU AI",
      premium: "Premium",
      welcome: "مرحبًا بك في HAMOU MATH",
      language: "اللغة"
    },

    fr: {
      home: "Accueil",
      library: "Bibliothèque",
      tools: "Outils",
      games: "Défis",
      teacher: "Professeur",
      login: "Connexion",
      logout: "Déconnexion",
      search: "Rechercher en mathématiques...",
      lessons: "Cours",
      exercises: "Exercices",
      exams: "Devoirs et examens",
      bac: "Baccalauréat",
      calculator: "Calculatrice",
      graph: "Graphe",
      ai: "HAMOU AI",
      premium: "Premium",
      welcome: "Bienvenue sur HAMOU MATH",
      language: "Langue"
    },

    en: {
      home: "Home",
      library: "Library",
      tools: "Tools",
      games: "Challenges",
      teacher: "Teacher",
      login: "Login",
      logout: "Logout",
      search: "Search mathematics...",
      lessons: "Lessons",
      exercises: "Exercises",
      exams: "Tests & Exams",
      bac: "Baccalaureate",
      calculator: "Calculator",
      graph: "Graph",
      ai: "HAMOU AI",
      premium: "Premium",
      welcome: "Welcome to HAMOU MATH",
      language: "Language"
    },

    es: {
      home: "Inicio",
      library: "Biblioteca",
      tools: "Herramientas",
      games: "Desafíos",
      teacher: "Profesor",
      login: "Iniciar sesión",
      logout: "Cerrar sesión",
      search: "Buscar matemáticas...",
      lessons: "Lecciones",
      exercises: "Ejercicios",
      exams: "Exámenes",
      bac: "Bachillerato",
      calculator: "Calculadora",
      graph: "Gráfica",
      ai: "HAMOU AI",
      premium: "Premium",
      welcome: "Bienvenido a HAMOU MATH",
      language: "Idioma"
    },

    de: {
      home: "Startseite",
      library: "Bibliothek",
      tools: "Werkzeuge",
      games: "Herausforderungen",
      teacher: "Lehrer",
      login: "Anmelden",
      logout: "Abmelden",
      search: "Mathematik suchen...",
      lessons: "Lektionen",
      exercises: "Übungen",
      exams: "Tests & Prüfungen",
      bac: "Abitur",
      calculator: "Rechner",
      graph: "Diagramm",
      ai: "HAMOU AI",
      premium: "Premium",
      welcome: "Willkommen bei HAMOU MATH",
      language: "Sprache"
    }
  };

  let currentLanguage =
    localStorage.getItem("hamou_language") || "ar";

  function applyLanguage(language) {
    if (!translations[language]) {
      language = "ar";
    }

    currentLanguage = language;

    localStorage.setItem(
      "hamou_language",
      language
    );

    document.documentElement.lang = language;

    document.documentElement.dir =
      language === "ar" ? "rtl" : "ltr";

    document
      .querySelectorAll("[data-i18n]")
      .forEach((element) => {
        const key = element.dataset.i18n;

        if (
          translations[language] &&
          translations[language][key]
        ) {
          element.textContent =
            translations[language][key];
        }
      });

    document
      .querySelectorAll("[data-i18n-placeholder]")
      .forEach((element) => {
        const key =
          element.dataset.i18nPlaceholder;

        if (
          translations[language] &&
          translations[language][key]
        ) {
          element.placeholder =
            translations[language][key];
        }
      });

    window.dispatchEvent(
      new CustomEvent("hamou:language", {
        detail: { language }
      })
    );
  }

  window.HAMOU_I18N = {
    translations,
    get language() {
      return currentLanguage;
    },
    setLanguage: applyLanguage,
    t(key) {
      return (
        translations[currentLanguage]?.[key] ||
        translations.ar[key] ||
        key
      );
    }
  };
const translations = {


ar: {

home:"الرئيسية",

library:"المكتبة",

lessons:"الدروس",

exercises:"التمارين",

tools:"أدوات الرياضيات",

login:"تسجيل الدخول",

logout:"خروج",

welcome:"مرحبا بك في HAMOU MATH"

},


fr: {

home:"Accueil",

library:"Bibliothèque",

lessons:"Cours",

exercises:"Exercices",

tools:"Outils mathématiques",

login:"Connexion",

logout:"Déconnexion",

welcome:"Bienvenue dans HAMOU MATH"

},


en: {

home:"Home",

library:"Library",

lessons:"Lessons",

exercises:"Exercises",

tools:"Math Tools",

login:"Login",

logout:"Logout",

welcome:"Welcome to HAMOU MATH"

}


};



function changeLanguage(lang){


localStorage.setItem(
"language",
lang
);


applyLanguage();


}



function applyLanguage(){


let lang =
localStorage.getItem("language")
||"ar";



document
.querySelectorAll("[data-i18n]")
.forEach(el=>{


let key =
el.dataset.i18n;



if(translations[lang][key]){

el.innerHTML =
translations[lang][key];

}


});


}



applyLanguage();
  document.addEventListener(
    "DOMContentLoaded",
    () => applyLanguage(currentLanguage)
  );
})();
const translations = {


ar:{

home:"الرئيسية",

library:"المكتبة",

exercises:"التمارين",

tools:"الأدوات",

login:"تسجيل الدخول",

register:"إنشاء حساب",

welcome:"مرحبا بك في HAMOU MATH",

start:"ابدأ التعلم مجانا"

},



fr:{

home:"Accueil",

library:"Bibliothèque",

exercises:"Exercices",

tools:"Outils",

login:"Connexion",

register:"Créer un compte",

welcome:"Bienvenue dans HAMOU MATH",

start:"Commencer gratuitement"

},



en:{

home:"Home",

library:"Library",

exercises:"Exercises",

tools:"Tools",

login:"Login",

register:"Create Account",

welcome:"Welcome to HAMOU MATH",

start:"Start Learning Free"

}

};





function changeLanguage(lang){


localStorage.setItem(
"language",
lang
);


applyLanguage();


}




function applyLanguage(){


let lang =
localStorage.getItem(
"language"
)
||"ar";



document
.querySelectorAll("[data-i18n]")
.forEach(
element=>{


let key =
element
.getAttribute(
"data-i18n"
);



if(translations[lang][key]){

element.innerHTML =
translations[lang][key];

}



});


}



document.addEventListener(
"DOMContentLoaded",
applyLanguage
);
