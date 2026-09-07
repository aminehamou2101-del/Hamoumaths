"use strict";

/*
 * ============================================================
 * HAMOU MATH - Internationalization System
 * js/i18n.js
 *
 * اللغات:
 *   ar = العربية
 *   fr = Français
 *   en = English
 *
 * المزايا:
 * - تبديل اللغة في جميع الصفحات
 * - حفظ اللغة في localStorage
 * - RTL للعربية / LTR للفرنسية والإنجليزية
 * - data-i18n للنصوص
 * - data-i18n-placeholder للـ placeholders
 * - data-i18n-title للـ title
 * - data-i18n-aria-label للـ aria-label
 * - data-i18n-value لقيم بعض عناصر النماذج
 * - ترجمة النصوص الديناميكية عبر HAMOU_I18N.t()
 * - حدث hamou:languageChanged عند تغيير اللغة
 * ============================================================
 */

(function () {
    const STORAGE_KEY = "hamou_math_language";
    const DEFAULT_LANGUAGE = "ar";

    const SUPPORTED_LANGUAGES = ["ar", "fr", "en"];

    const LANGUAGE_META = {
        ar: {
            code: "ar",
            name: "العربية",
            nativeName: "العربية",
            dir: "rtl",
            locale: "ar-DZ"
        },
        fr: {
            code: "fr",
            name: "Français",
            nativeName: "Français",
            dir: "ltr",
            locale: "fr-FR"
        },
        en: {
            code: "en",
            name: "English",
            nativeName: "English",
            dir: "ltr",
            locale: "en-US"
        }
    };

    /*
     * ============================================================
     * قاموس الترجمة
     * ============================================================
     */

    const TRANSLATIONS = {
        ar: {
            // General
            "app.name": "HAMOU MATH",
            "app.tagline": "منصة الرياضيات الذكية",
            "general.loading": "جارٍ التحميل...",
            "general.save": "حفظ",
            "general.cancel": "إلغاء",
            "general.close": "إغلاق",
            "general.confirm": "تأكيد",
            "general.delete": "حذف",
            "general.edit": "تعديل",
            "general.add": "إضافة",
            "general.search": "بحث",
            "general.filter": "تصفية",
            "general.reset": "إعادة ضبط",
            "general.back": "رجوع",
            "general.next": "التالي",
            "general.previous": "السابق",
            "general.open": "فتح",
            "general.download": "تحميل",
            "general.preview": "معاينة",
            "general.submit": "إرسال",
            "general.details": "التفاصيل",
            "general.view": "عرض",
            "general.all": "الكل",
            "general.none": "لا شيء",
            "general.yes": "نعم",
            "general.no": "لا",
            "general.refresh": "تحديث",
            "general.retry": "إعادة المحاولة",
            "general.copy": "نسخ",
            "general.copied": "تم النسخ",
            "general.required": "هذا الحقل مطلوب",
            "general.optional": "اختياري",
            "general.error": "حدث خطأ",
            "general.success": "تمت العملية بنجاح",
            "general.noResults": "لا توجد نتائج",
            "general.notAvailable": "غير متوفر",
            "general.unknown": "غير معروف",

            // Navbar
            "nav.home": "الرئيسية",
            "nav.levels": "المستويات",
            "nav.curriculum": "المنهاج",
            "nav.library": "المكتبة",
            "nav.exercises": "التمارين",
            "nav.tools": "الأدوات",
            "nav.bac": "البكالوريا",
            "nav.leaderboard": "المتصدرون",
            "nav.achievements": "الإنجازات",
            "nav.search": "بحث",
            "nav.dashboard": "لوحة التحكم",
            "nav.teacher": "فضاء الأستاذ",
            "nav.review": "مراجعة المحتوى",
            "nav.owner": "الإدارة",
            "nav.curriculumAdmin": "إدارة المنهاج",
            "nav.profile": "الملف الشخصي",
            "nav.login": "تسجيل الدخول",
            "nav.register": "إنشاء حساب",
            "nav.logout": "تسجيل الخروج",
            "nav.menu": "القائمة",
            "nav.language": "اللغة",
            "nav.theme": "المظهر",
            "nav.light": "الوضع الفاتح",
            "nav.dark": "الوضع الداكن",
            "nav.system": "تلقائي",

            // Home
            "home.title": "HAMOU MATH",
            "home.subtitle": "منصة تعليم الرياضيات للطلاب والأساتذة",
            "home.description": "تعلم، تدرب، حل التمارين وطوّر مستواك في الرياضيات.",
            "home.startLearning": "ابدأ التعلم",
            "home.exploreLibrary": "استكشف المكتبة",
            "home.solveExercises": "حل التمارين",
            "home.useTools": "استخدم الأدوات",
            "home.statistics": "إحصائيات المنصة",
            "home.resources": "موارد تعليمية",
            "home.lessons": "دروس",
            "home.exercises": "تمارين",
            "home.students": "طلاب",
            "home.features": "مميزات HAMOU MATH",
            "home.featureLibrary": "مكتبة تعليمية كبيرة",
            "home.featureLibraryText": "دروس وكتب وتمارين وموارد منظمة وقابلة للبحث.",
            "home.featureExercises": "تمارين تفاعلية",
            "home.featureExercisesText": "حل التمارين واحصل على التصحيح والنقاط.",
            "home.featureCalculator": "حاسبة علمية",
            "home.featureCalculatorText": "أدوات حسابية متقدمة وسهلة الاستخدام.",
            "home.featureGraph": "رسم الدوال",
            "home.featureGraphText": "ارسم الدوال الرياضية وتفاعل مع المنحنيات.",
            "home.featureProgress": "تقدمك الدراسي",
            "home.featureProgressText": "تابع XP والمستوى والإنجازات والتحديات.",
            "home.featureMultilingual": "ثلاث لغات",
            "home.featureMultilingualText": "العربية والفرنسية والإنجليزية.",

            // Auth
            "auth.login": "تسجيل الدخول",
            "auth.register": "إنشاء حساب",
            "auth.email": "البريد الإلكتروني",
            "auth.password": "كلمة المرور",
            "auth.confirmPassword": "تأكيد كلمة المرور",
            "auth.fullName": "الاسم الكامل",
            "auth.rememberMe": "تذكرني",
            "auth.forgotPassword": "نسيت كلمة المرور؟",
            "auth.noAccount": "ليس لديك حساب؟",
            "auth.haveAccount": "لديك حساب بالفعل؟",
            "auth.createAccount": "إنشاء حساب",
            "auth.loginNow": "سجل الدخول الآن",
            "auth.registerNow": "أنشئ حسابك الآن",
            "auth.logout": "تسجيل الخروج",
            "auth.loginSuccess": "تم تسجيل الدخول بنجاح.",
            "auth.registerSuccess": "تم إنشاء الحساب بنجاح.",
            "auth.logoutSuccess": "تم تسجيل الخروج.",
            "auth.invalidCredentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
            "auth.emailConfirmation": "تحقق من بريدك الإلكتروني لتأكيد الحساب.",
            "auth.resetPassword": "إعادة تعيين كلمة المرور",
            "auth.sendResetLink": "إرسال رابط إعادة التعيين",
            "auth.resetSuccess": "تم تحديث كلمة المرور بنجاح.",
            "auth.passwordUpdated": "تم تغيير كلمة المرور.",
            "auth.newPassword": "كلمة المرور الجديدة",
            "auth.updatePassword": "تحديث كلمة المرور",

            // Profile
            "profile.title": "الملف الشخصي",
            "profile.account": "الحساب",
            "profile.email": "البريد الإلكتروني",
            "profile.name": "الاسم",
            "profile.role": "الدور",
            "profile.student": "طالب",
            "profile.teacher": "أستاذ",
            "profile.researcher": "باحث",
            "profile.admin": "مدير",
            "profile.owner": "المالك",
            "profile.xp": "الخبرة",
            "profile.level": "المستوى",

            // Dashboard
            "dashboard.title": "لوحة التحكم",
            "dashboard.welcome": "مرحبًا",
            "dashboard.myProgress": "تقدمي",
            "dashboard.myXp": "نقاط XP",
            "dashboard.myLevel": "مستواي",
            "dashboard.attempts": "المحاولات",
            "dashboard.successRate": "نسبة النجاح",
            "dashboard.recentResults": "النتائج الأخيرة",
            "dashboard.recommendations": "اقتراحات لك",
            "dashboard.recentLessons": "الدروس الأخيرة",
            "dashboard.achievements": "الإنجازات",
            "dashboard.noResults": "لا توجد نتائج بعد.",
            "dashboard.noRecommendations": "لا توجد اقتراحات حاليًا.",

            // Library
            "library.title": "المكتبة التعليمية",
            "library.subtitle": "اكتشف الدروس والكتب والملخصات والتمارين والموارد التعليمية.",
            "library.search": "ابحث في المكتبة...",
            "library.level": "المستوى",
            "library.subject": "المادة",
            "library.unit": "الوحدة",
            "library.topic": "الموضوع",
            "library.type": "النوع",
            "library.difficulty": "الصعوبة",
            "library.allLevels": "كل المستويات",
            "library.allSubjects": "كل المواد",
            "library.allUnits": "كل الوحدات",
            "library.allTopics": "كل المواضيع",
            "library.allTypes": "كل الأنواع",
            "library.allDifficulties": "كل مستويات الصعوبة",
            "library.book": "كتاب",
            "library.pdf": "PDF",
            "library.lesson": "درس",
            "library.summary": "ملخص",
            "library.exercise": "تمرين",
            "library.solution": "حل",
            "library.test": "اختبار",
            "library.document": "وثيقة",
            "library.resource": "مورد",
            "library.noResources": "لا توجد موارد مطابقة.",
            "library.preview": "معاينة الملف",
            "library.openFile": "فتح الملف",
            "library.downloadFile": "تحميل الملف",
            "library.views": "مشاهدة",
            "library.files": "ملفات",
            "library.totalResources": "إجمالي الموارد",

            // Exercises
            "exercise.title": "التمارين",
            "exercise.subtitle": "تدرب واختبر مستواك واحصل على نقاط XP.",
            "exercise.search": "ابحث عن تمرين...",
            "exercise.start": "ابدأ التمرين",
            "exercise.solve": "حل التمرين",
            "exercise.submitAnswer": "إرسال الإجابة",
            "exercise.checkAnswer": "تحقق من الإجابة",
            "exercise.correct": "إجابة صحيحة!",
            "exercise.incorrect": "إجابة غير صحيحة.",
            "exercise.tryAgain": "حاول مرة أخرى.",
            "exercise.explanation": "الحل والتفسير",
            "exercise.solution": "الحل",
            "exercise.xpEarned": "XP المكتسبة",
            "exercise.alreadySolved": "لقد حصلت على مكافأة هذا التمرين مسبقًا.",
            "exercise.noExercises": "لا توجد تمارين متاحة.",
            "exercise.easy": "سهل",
            "exercise.medium": "متوسط",
            "exercise.hard": "صعب",

            // Tools
            "tools.title": "الأدوات الرياضية",
            "tools.calculator": "الحاسبة العلمية",
            "tools.graph": "رسم الدوال",
            "tools.equation": "حل المعادلات",
            "tools.calculatorDescription": "احسب العمليات والدوال الرياضية بسهولة.",
            "tools.graphDescription": "ارسم الدوال الرياضية على المستوى البياني.",
            "tools.equationDescription": "حل المعادلات الرياضية.",
            "tools.expression": "التعبير الرياضي",
            "tools.function": "الدالة",
            "tools.solve": "حل",
            "tools.draw": "رسم",
            "tools.clear": "مسح",
            "tools.result": "النتيجة",
            "tools.xAxis": "محور x",
            "tools.yAxis": "محور y",

            // Curriculum
            "curriculum.title": "المنهاج الدراسي",
            "curriculum.level": "المستوى",
            "curriculum.subject": "المادة",
            "curriculum.unit": "الوحدة",
            "curriculum.topic": "الموضوع",
            "curriculum.description": "الوصف",
            "curriculum.lessons": "الدروس",
            "curriculum.exercises": "التمارين",
            "curriculum.resources": "الموارد",
            "curriculum.explore": "استكشف",

            // Teacher
            "teacher.title": "فضاء الأستاذ",
            "teacher.dashboard": "لوحة الأستاذ",
            "teacher.createLesson": "إضافة درس",
            "teacher.createExercise": "إضافة تمرين",
            "teacher.createResource": "إضافة مورد",
            "teacher.myContent": "محتواي",
            "teacher.contentTitle": "عنوان المحتوى",
            "teacher.description": "الوصف",
            "teacher.videoUrl": "رابط الفيديو",
            "teacher.file": "الملف",
            "teacher.create": "إنشاء",
            "teacher.saveDraft": "حفظ كمسودة",
            "teacher.submitReview": "إرسال للمراجعة",
            "teacher.status": "الحالة",
            "teacher.draft": "مسودة",
            "teacher.pending": "قيد المراجعة",
            "teacher.published": "منشور",
            "teacher.rejected": "مرفوض",

            // Review
            "review.title": "مراجعة المحتوى",
            "review.approve": "موافقة ونشر",
            "review.reject": "رفض",
            "review.unpublish": "إلغاء النشر",
            "review.note": "ملاحظة المراجع",
            "review.noPending": "لا يوجد محتوى بانتظار المراجعة.",

            // Owner / Admin
            "admin.title": "لوحة الإدارة",
            "admin.users": "المستخدمون",
            "admin.content": "المحتوى",
            "admin.statistics": "الإحصائيات",
            "admin.settings": "الإعدادات",
            "admin.manage": "إدارة",
            "admin.ownerControl": "تحكم المالك",
            "admin.changeRole": "تغيير الدور",
            "admin.deleteUser": "حذف المستخدم",

            // Curriculum Admin
            "curriculumAdmin.title": "إدارة المنهاج",
            "curriculumAdmin.add": "إضافة عنصر",
            "curriculumAdmin.create": "إنشاء",
            "curriculumAdmin.update": "تحديث",
            "curriculumAdmin.delete": "حذف",
            "curriculumAdmin.active": "نشط",
            "curriculumAdmin.inactive": "غير نشط",

            // Leaderboard
            "leaderboard.title": "لوحة المتصدرين",
            "leaderboard.rank": "الترتيب",
            "leaderboard.user": "المستخدم",
            "leaderboard.xp": "XP",
            "leaderboard.level": "المستوى",
            "leaderboard.you": "أنت",

            // Achievements
            "achievements.title": "الإنجازات",
            "achievements.unlocked": "تم فتحه",
            "achievements.locked": "مقفل",
            "achievements.progress": "التقدم",

            // Search
            "search.title": "البحث",
            "search.placeholder": "ابحث في HAMOU MATH...",
            "search.results": "نتائج البحث",
            "search.lessons": "دروس",
            "search.exercises": "تمارين",
            "search.resources": "موارد",
            "search.noResults": "لم نجد نتائج مطابقة لبحثك.",

            // Levels
            "levels.title": "المستويات الدراسية",
            "levels.middle": "التعليم المتوسط",
            "levels.secondary": "التعليم الثانوي",
            "levels.bac": "البكالوريا",
            "levels.university": "الجامعة",

            // Notifications
            "message.loading": "جارٍ التحميل...",
            "message.saved": "تم الحفظ بنجاح.",
            "message.deleted": "تم الحذف بنجاح.",
            "message.updated": "تم التحديث بنجاح.",
            "message.created": "تم الإنشاء بنجاح.",
            "message.loginRequired": "يجب تسجيل الدخول أولًا.",
            "message.teacherRequired": "هذا القسم مخصص للأساتذة.",
            "message.adminRequired": "ليس لديك صلاحية الوصول.",
            "message.ownerRequired": "هذا القسم مخصص للمالك.",

            // Footer
            "footer.about": "عن HAMOU MATH",
            "footer.aboutText": "منصة تعليمية تهدف إلى تسهيل تعلم الرياضيات وجعلها أكثر تفاعلية.",
            "footer.quickLinks": "روابط سريعة",
            "footer.contact": "اتصل بنا",
            "footer.rights": "جميع الحقوق محفوظة.",
            "footer.madeWith": "صنع من أجل تعليم أفضل.",

            // Units / common labels
            "unit.chapter": "الفصل",
            "unit.lesson": "الدرس",
            "unit.exercise": "التمرين",
            "unit.question": "السؤال",
            "unit.answer": "الإجابة",
            "unit.score": "العلامة",
            "unit.points": "النقاط",
            "unit.date": "التاريخ",
            "unit.author": "المؤلف",
            "unit.teacher": "الأستاذ",
            "unit.student": "الطالب"
        },

        fr: {
            // Général
            "app.name": "HAMOU MATH",
            "app.tagline": "Plateforme intelligente de mathématiques",
            "general.loading": "Chargement...",
            "general.save": "Enregistrer",
            "general.cancel": "Annuler",
            "general.close": "Fermer",
            "general.confirm": "Confirmer",
            "general.delete": "Supprimer",
            "general.edit": "Modifier",
            "general.add": "Ajouter",
            "general.search": "Rechercher",
            "general.filter": "Filtrer",
            "general.reset": "Réinitialiser",
            "general.back": "Retour",
            "general.next": "Suivant",
            "general.previous": "Précédent",
            "general.open": "Ouvrir",
            "general.download": "Télécharger",
            "general.preview": "Aperçu",
            "general.submit": "Envoyer",
            "general.details": "Détails",
            "general.view": "Voir",
            "general.all": "Tous",
            "general.none": "Aucun",
            "general.yes": "Oui",
            "general.no": "Non",
            "general.refresh": "Actualiser",
            "general.retry": "Réessayer",
            "general.copy": "Copier",
            "general.copied": "Copié",
            "general.required": "Ce champ est obligatoire",
            "general.optional": "Facultatif",
            "general.error": "Une erreur est survenue",
            "general.success": "Opération réussie",
            "general.noResults": "Aucun résultat",
            "general.notAvailable": "Non disponible",
            "general.unknown": "Inconnu",

            // Navigation
            "nav.home": "Accueil",
            "nav.levels": "Niveaux",
            "nav.curriculum": "Programme",
            "nav.library": "Bibliothèque",
            "nav.exercises": "Exercices",
            "nav.tools": "Outils",
            "nav.bac": "Baccalauréat",
            "nav.leaderboard": "Classement",
            "nav.achievements": "Réalisations",
            "nav.search": "Recherche",
            "nav.dashboard": "Tableau de bord",
            "nav.teacher": "Espace enseignant",
            "nav.review": "Révision du contenu",
            "nav.owner": "Administration",
            "nav.curriculumAdmin": "Gestion du programme",
            "nav.profile": "Profil",
            "nav.login": "Connexion",
            "nav.register": "Créer un compte",
            "nav.logout": "Déconnexion",
            "nav.menu": "Menu",
            "nav.language": "Langue",
            "nav.theme": "Apparence",
            "nav.light": "Mode clair",
            "nav.dark": "Mode sombre",
            "nav.system": "Automatique",

            // Accueil
            "home.title": "HAMOU MATH",
            "home.subtitle": "Plateforme d'apprentissage des mathématiques pour élèves et enseignants",
            "home.description": "Apprenez, entraînez-vous, résolvez des exercices et améliorez votre niveau en mathématiques.",
            "home.startLearning": "Commencer à apprendre",
            "home.exploreLibrary": "Explorer la bibliothèque",
            "home.solveExercises": "Résoudre des exercices",
            "home.useTools": "Utiliser les outils",
            "home.statistics": "Statistiques de la plateforme",
            "home.resources": "Ressources pédagogiques",
            "home.lessons": "Cours",
            "home.exercises": "Exercices",
            "home.students": "Élèves",
            "home.features": "Fonctionnalités HAMOU MATH",
            "home.featureLibrary": "Grande bibliothèque pédagogique",
            "home.featureLibraryText": "Cours, livres, exercices et ressources organisés et consultables.",
            "home.featureExercises": "Exercices interactifs",
            "home.featureExercisesText": "Résolvez les exercices et gagnez des points.",
            "home.featureCalculator": "Calculatrice scientifique",
            "home.featureCalculatorText": "Des outils de calcul avancés et faciles à utiliser.",
            "home.featureGraph": "Tracé de fonctions",
            "home.featureGraphText": "Tracez les fonctions mathématiques et interagissez avec les courbes.",
            "home.featureProgress": "Votre progression",
            "home.featureProgressText": "Suivez votre XP, votre niveau, vos réalisations et vos défis.",
            "home.featureMultilingual": "Trois langues",
            "home.featureMultilingualText": "Arabe, français et anglais.",

            // Auth
            "auth.login": "Connexion",
            "auth.register": "Créer un compte",
            "auth.email": "Adresse e-mail",
            "auth.password": "Mot de passe",
            "auth.confirmPassword": "Confirmer le mot de passe",
            "auth.fullName": "Nom complet",
            "auth.rememberMe": "Se souvenir de moi",
            "auth.forgotPassword": "Mot de passe oublié ?",
            "auth.noAccount": "Vous n'avez pas de compte ?",
            "auth.haveAccount": "Vous avez déjà un compte ?",
            "auth.createAccount": "Créer un compte",
            "auth.loginNow": "Connectez-vous maintenant",
            "auth.registerNow": "Créez votre compte maintenant",
            "auth.logout": "Déconnexion",
            "auth.loginSuccess": "Connexion réussie.",
            "auth.registerSuccess": "Compte créé avec succès.",
            "auth.logoutSuccess": "Déconnexion réussie.",
            "auth.invalidCredentials": "E-mail ou mot de passe incorrect.",
            "auth.emailConfirmation": "Vérifiez votre e-mail pour confirmer votre compte.",
            "auth.resetPassword": "Réinitialiser le mot de passe",
            "auth.sendResetLink": "Envoyer le lien de réinitialisation",
            "auth.resetSuccess": "Mot de passe mis à jour avec succès.",
            "auth.passwordUpdated": "Mot de passe modifié.",
            "auth.newPassword": "Nouveau mot de passe",
            "auth.updatePassword": "Mettre à jour le mot de passe",

            // Profil
            "profile.title": "Profil",
            "profile.account": "Compte",
            "profile.email": "E-mail",
            "profile.name": "Nom",
            "profile.role": "Rôle",
            "profile.student": "Élève",
            "profile.teacher": "Enseignant",
            "profile.researcher": "Chercheur",
            "profile.admin": "Administrateur",
            "profile.owner": "Propriétaire",
            "profile.xp": "XP",
            "profile.level": "Niveau",

            // Dashboard
            "dashboard.title": "Tableau de bord",
            "dashboard.welcome": "Bienvenue",
            "dashboard.myProgress": "Ma progression",
            "dashboard.myXp": "Points XP",
            "dashboard.myLevel": "Mon niveau",
            "dashboard.attempts": "Tentatives",
            "dashboard.successRate": "Taux de réussite",
            "dashboard.recentResults": "Résultats récents",
            "dashboard.recommendations": "Recommandations",
            "dashboard.recentLessons": "Cours récents",
            "dashboard.achievements": "Réalisations",
            "dashboard.noResults": "Aucun résultat pour le moment.",
            "dashboard.noRecommendations": "Aucune recommandation pour le moment.",

            // Bibliothèque
            "library.title": "Bibliothèque pédagogique",
            "library.subtitle": "Découvrez les cours, livres, résumés, exercices et ressources pédagogiques.",
            "library.search": "Rechercher dans la bibliothèque...",
            "library.level": "Niveau",
            "library.subject": "Matière",
            "library.unit": "Unité",
            "library.topic": "Thème",
            "library.type": "Type",
            "library.difficulty": "Difficulté",
            "library.allLevels": "Tous les niveaux",
            "library.allSubjects": "Toutes les matières",
            "library.allUnits": "Toutes les unités",
            "library.allTopics": "Tous les thèmes",
            "library.allTypes": "Tous les types",
            "library.allDifficulties": "Toutes les difficultés",
            "library.book": "Livre",
            "library.pdf": "PDF",
            "library.lesson": "Cours",
            "library.summary": "Résumé",
            "library.exercise": "Exercice",
            "library.solution": "Solution",
            "library.test": "Test",
            "library.document": "Document",
            "library.resource": "Ressource",
            "library.noResources": "Aucune ressource correspondante.",
            "library.preview": "Aperçu du fichier",
            "library.openFile": "Ouvrir le fichier",
            "library.downloadFile": "Télécharger le fichier",
            "library.views": "Vues",
            "library.files": "Fichiers",
            "library.totalResources": "Total des ressources",

            // Exercices
            "exercise.title": "Exercices",
            "exercise.subtitle": "Entraînez-vous, testez votre niveau et gagnez des points XP.",
            "exercise.search": "Rechercher un exercice...",
            "exercise.start": "Commencer l'exercice",
            "exercise.solve": "Résoudre l'exercice",
            "exercise.submitAnswer": "Envoyer la réponse",
            "exercise.checkAnswer": "Vérifier la réponse",
            "exercise.correct": "Bonne réponse !",
            "exercise.incorrect": "Réponse incorrecte.",
            "exercise.tryAgain": "Réessayez.",
            "exercise.explanation": "Solution et explication",
            "exercise.solution": "Solution",
            "exercise.xpEarned": "XP gagnés",
            "exercise.alreadySolved": "Vous avez déjà reçu la récompense pour cet exercice.",
            "exercise.noExercises": "Aucun exercice disponible.",
            "exercise.easy": "Facile",
            "exercise.medium": "Moyen",
            "exercise.hard": "Difficile",

            // Outils
            "tools.title": "Outils mathématiques",
            "tools.calculator": "Calculatrice scientifique",
            "tools.graph": "Tracé de fonctions",
            "tools.equation": "Résolution d'équations",
            "tools.calculatorDescription": "Calculez facilement des opérations et fonctions mathématiques.",
            "tools.graphDescription": "Tracez les fonctions mathématiques sur le plan.",
            "tools.equationDescription": "Résolvez les équations mathématiques.",
            "tools.expression": "Expression mathématique",
            "tools.function": "Fonction",
            "tools.solve": "Résoudre",
            "tools.draw": "Tracer",
            "tools.clear": "Effacer",
            "tools.result": "Résultat",
            "tools.xAxis": "Axe x",
            "tools.yAxis": "Axe y",

            // Programme
            "curriculum.title": "Programme scolaire",
            "curriculum.level": "Niveau",
            "curriculum.subject": "Matière",
            "curriculum.unit": "Unité",
            "curriculum.topic": "Thème",
            "curriculum.description": "Description",
            "curriculum.lessons": "Cours",
            "curriculum.exercises": "Exercices",
            "curriculum.resources": "Ressources",
            "curriculum.explore": "Explorer",

            // Enseignant
            "teacher.title": "Espace enseignant",
            "teacher.dashboard": "Tableau de bord enseignant",
            "teacher.createLesson": "Ajouter un cours",
            "teacher.createExercise": "Ajouter un exercice",
            "teacher.createResource": "Ajouter une ressource",
            "teacher.myContent": "Mon contenu",
            "teacher.contentTitle": "Titre du contenu",
            "teacher.description": "Description",
            "teacher.videoUrl": "URL de la vidéo",
            "teacher.file": "Fichier",
            "teacher.create": "Créer",
            "teacher.saveDraft": "Enregistrer comme brouillon",
            "teacher.submitReview": "Envoyer pour révision",
            "teacher.status": "Statut",
            "teacher.draft": "Brouillon",
            "teacher.pending": "En révision",
            "teacher.published": "Publié",
            "teacher.rejected": "Rejeté",

            // Révision
            "review.title": "Révision du contenu",
            "review.approve": "Approuver et publier",
            "review.reject": "Rejeter",
            "review.unpublish": "Dépublier",
            "review.note": "Note du réviseur",
            "review.noPending": "Aucun contenu en attente de révision.",

            // Administration
            "admin.title": "Administration",
            "admin.users": "Utilisateurs",
            "admin.content": "Contenu",
            "admin.statistics": "Statistiques",
            "admin.settings": "Paramètres",
            "admin.manage": "Gérer",
            "admin.ownerControl": "Contrôle du propriétaire",
            "admin.changeRole": "Changer le rôle",
            "admin.deleteUser": "Supprimer l'utilisateur",

            // Gestion programme
            "curriculumAdmin.title": "Gestion du programme",
            "curriculumAdmin.add": "Ajouter un élément",
            "curriculumAdmin.create": "Créer",
            "curriculumAdmin.update": "Mettre à jour",
            "curriculumAdmin.delete": "Supprimer",
            "curriculumAdmin.active": "Actif",
            "curriculumAdmin.inactive": "Inactif",

            // Classement
            "leaderboard.title": "Classement",
            "leaderboard.rank": "Rang",
            "leaderboard.user": "Utilisateur",
            "leaderboard.xp": "XP",
            "leaderboard.level": "Niveau",
            "leaderboard.you": "Vous",

            // Réalisations
            "achievements.title": "Réalisations",
            "achievements.unlocked": "Déverrouillé",
            "achievements.locked": "Verrouillé",
            "achievements.progress": "Progression",

            // Recherche
            "search.title": "Recherche",
            "search.placeholder": "Rechercher dans HAMOU MATH...",
            "search.results": "Résultats de recherche",
            "search.lessons": "Cours",
            "search.exercises": "Exercices",
            "search.resources": "Ressources",
            "search.noResults": "Aucun résultat correspondant à votre recherche.",

            // Niveaux
            "levels.title": "Niveaux scolaires",
            "levels.middle": "Enseignement moyen",
            "levels.secondary": "Enseignement secondaire",
            "levels.bac": "Baccalauréat",
            "levels.university": "Université",

            // Messages
            "message.loading": "Chargement...",
            "message.saved": "Enregistré avec succès.",
            "message.deleted": "Supprimé avec succès.",
            "message.updated": "Mis à jour avec succès.",
            "message.created": "Créé avec succès.",
            "message.loginRequired": "Vous devez d'abord vous connecter.",
            "message.teacherRequired": "Cette section est réservée aux enseignants.",
            "message.adminRequired": "Vous n'avez pas les autorisations nécessaires.",
            "message.ownerRequired": "Cette section est réservée au propriétaire.",

            // Footer
            "footer.about": "À propos de HAMOU MATH",
            "footer.aboutText": "Une plateforme éducative destinée à faciliter l'apprentissage des mathématiques et à le rendre plus interactif.",
            "footer.quickLinks": "Liens rapides",
            "footer.contact": "Contact",
            "footer.rights": "Tous droits réservés.",
            "footer.madeWith": "Conçu pour une meilleure éducation.",

            // Commun
            "unit.chapter": "Chapitre",
            "unit.lesson": "Cours",
            "unit.exercise": "Exercice",
            "unit.question": "Question",
            "unit.answer": "Réponse",
            "unit.score": "Note",
            "unit.points": "Points",
            "unit.date": "Date",
            "unit.author": "Auteur",
            "unit.teacher": "Enseignant",
            "unit.student": "Élève"
        },

        en: {
            // General
            "app.name": "HAMOU MATH",
            "app.tagline": "Smart Mathematics Platform",
            "general.loading": "Loading...",
            "general.save": "Save",
            "general.cancel": "Cancel",
            "general.close": "Close",
            "general.confirm": "Confirm",
            "general.delete": "Delete",
            "general.edit": "Edit",
            "general.add": "Add",
            "general.search": "Search",
            "general.filter": "Filter",
            "general.reset": "Reset",
            "general.back": "Back",
            "general.next": "Next",
            "general.previous": "Previous",
            "general.open": "Open",
            "general.download": "Download",
            "general.preview": "Preview",
            "general.submit": "Submit",
            "general.details": "Details",
            "general.view": "View",
            "general.all": "All",
            "general.none": "None",
            "general.yes": "Yes",
            "general.no": "No",
            "general.refresh": "Refresh",
            "general.retry": "Retry",
            "general.copy": "Copy",
            "general.copied": "Copied",
            "general.required": "This field is required",
            "general.optional": "Optional",
            "general.error": "An error occurred",
            "general.success": "Operation completed successfully",
            "general.noResults": "No results",
            "general.notAvailable": "Not available",
            "general.unknown": "Unknown",

            // Navigation
            "nav.home": "Home",
            "nav.levels": "Levels",
            "nav.curriculum": "Curriculum",
            "nav.library": "Library",
            "nav.exercises": "Exercises",
            "nav.tools": "Tools",
            "nav.bac": "Baccalaureate",
            "nav.leaderboard": "Leaderboard",
            "nav.achievements": "Achievements",
            "nav.search": "Search",
            "nav.dashboard": "Dashboard",
            "nav.teacher": "Teacher Area",
            "nav.review": "Content Review",
            "nav.owner": "Administration",
            "nav.curriculumAdmin": "Curriculum Management",
            "nav.profile": "Profile",
            "nav.login": "Login",
            "nav.register": "Create Account",
            "nav.logout": "Logout",
            "nav.menu": "Menu",
            "nav.language": "Language",
            "nav.theme": "Theme",
            "nav.light": "Light Mode",
            "nav.dark": "Dark Mode",
            "nav.system": "System",

            // Home
            "home.title": "HAMOU MATH",
            "home.subtitle": "Mathematics learning platform for students and teachers",
            "home.description": "Learn, practice, solve exercises and improve your mathematics skills.",
            "home.startLearning": "Start Learning",
            "home.exploreLibrary": "Explore Library",
            "home.solveExercises": "Solve Exercises",
            "home.useTools": "Use Tools",
            "home.statistics": "Platform Statistics",
            "home.resources": "Educational Resources",
            "home.lessons": "Lessons",
            "home.exercises": "Exercises",
            "home.students": "Students",
            "home.features": "HAMOU MATH Features",
            "home.featureLibrary": "Large Educational Library",
            "home.featureLibraryText": "Lessons, books, exercises and organized searchable resources.",
            "home.featureExercises": "Interactive Exercises",
            "home.featureExercisesText": "Solve exercises and earn points.",
            "home.featureCalculator": "Scientific Calculator",
            "home.featureCalculatorText": "Advanced and easy-to-use calculation tools.",
            "home.featureGraph": "Function Graphing",
            "home.featureGraphText": "Plot mathematical functions and interact with graphs.",
            "home.featureProgress": "Your Progress",
            "home.featureProgressText": "Track XP, levels, achievements and challenges.",
            "home.featureMultilingual": "Three Languages",
            "home.featureMultilingualText": "Arabic, French and English.",

            // Auth
            "auth.login": "Login",
            "auth.register": "Create Account",
            "auth.email": "Email",
            "auth.password": "Password",
            "auth.confirmPassword": "Confirm Password",
            "auth.fullName": "Full Name",
            "auth.rememberMe": "Remember me",
            "auth.forgotPassword": "Forgot password?",
            "auth.noAccount": "Don't have an account?",
            "auth.haveAccount": "Already have an account?",
            "auth.createAccount": "Create Account",
            "auth.loginNow": "Login now",
            "auth.registerNow": "Create your account now",
            "auth.logout": "Logout",
            "auth.loginSuccess": "Login successful.",
            "auth.registerSuccess": "Account created successfully.",
            "auth.logoutSuccess": "Logged out successfully.",
            "auth.invalidCredentials": "Incorrect email or password.",
            "auth.emailConfirmation": "Check your email to confirm your account.",
            "auth.resetPassword": "Reset Password",
            "auth.sendResetLink": "Send Reset Link",
            "auth.resetSuccess": "Password updated successfully.",
            "auth.passwordUpdated": "Password changed.",
            "auth.newPassword": "New Password",
            "auth.updatePassword": "Update Password",

            // Profile
            "profile.title": "Profile",
            "profile.account": "Account",
            "profile.email": "Email",
            "profile.name": "Name",
            "profile.role": "Role",
            "profile.student": "Student",
            "profile.teacher": "Teacher",
            "profile.researcher": "Researcher",
            "profile.admin": "Admin",
            "profile.owner": "Owner",
            "profile.xp": "XP",
            "profile.level": "Level",

            // Dashboard
            "dashboard.title": "Dashboard",
            "dashboard.welcome": "Welcome",
            "dashboard.myProgress": "My Progress",
            "dashboard.myXp": "XP Points",
            "dashboard.myLevel": "My Level",
            "dashboard.attempts": "Attempts",
            "dashboard.successRate": "Success Rate",
            "dashboard.recentResults": "Recent Results",
            "dashboard.recommendations": "Recommendations",
            "dashboard.recentLessons": "Recent Lessons",
            "dashboard.achievements": "Achievements",
            "dashboard.noResults": "No results yet.",
            "dashboard.noRecommendations": "No recommendations right now.",

            // Library
            "library.title": "Educational Library",
            "library.subtitle": "Discover lessons, books, summaries, exercises and educational resources.",
            "library.search": "Search the library...",
            "library.level": "Level",
            "library.subject": "Subject",
            "library.unit": "Unit",
            "library.topic": "Topic",
            "library.type": "Type",
            "library.difficulty": "Difficulty",
            "library.allLevels": "All Levels",
            "library.allSubjects": "All Subjects",
            "library.allUnits": "All Units",
            "library.allTopics": "All Topics",
            "library.allTypes": "All Types",
            "library.allDifficulties": "All Difficulties",
            "library.book": "Book",
            "library.pdf": "PDF",
            "library.lesson": "Lesson",
            "library.summary": "Summary",
            "library.exercise": "Exercise",
            "library.solution": "Solution",
            "library.test": "Test",
            "library.document": "Document",
            "library.resource": "Resource",
            "library.noResources": "No matching resources found.",
            "library.preview": "File Preview",
            "library.openFile": "Open File",
            "library.downloadFile": "Download File",
            "library.views": "Views",
            "library.files": "Files",
            "library.totalResources": "Total Resources",

            // Exercises
            "exercise.title": "Exercises",
            "exercise.subtitle": "Practice, test your level and earn XP points.",
            "exercise.search": "Search for an exercise...",
            "exercise.start": "Start Exercise",
            "exercise.solve": "Solve Exercise",
            "exercise.submitAnswer": "Submit Answer",
            "exercise.checkAnswer": "Check Answer",
            "exercise.correct": "Correct answer!",
            "exercise.incorrect": "Incorrect answer.",
            "exercise.tryAgain": "Try again.",
            "exercise.explanation": "Solution and Explanation",
            "exercise.solution": "Solution",
            "exercise.xpEarned": "XP Earned",
            "exercise.alreadySolved": "You have already received the reward for this exercise.",
            "exercise.noExercises": "No exercises available.",
            "exercise.easy": "Easy",
            "exercise.medium": "Medium",
            "exercise.hard": "Hard",

            // Tools
            "tools.title": "Mathematics Tools",
            "tools.calculator": "Scientific Calculator",
            "tools.graph": "Function Graphing",
            "tools.equation": "Equation Solver",
            "tools.calculatorDescription": "Easily calculate mathematical operations and functions.",
            "tools.graphDescription": "Plot mathematical functions on the coordinate plane.",
            "tools.equationDescription": "Solve mathematical equations.",
            "tools.expression": "Mathematical Expression",
            "tools.function": "Function",
            "tools.solve": "Solve",
            "tools.draw": "Plot",
            "tools.clear": "Clear",
            "tools.result": "Result",
            "tools.xAxis": "X Axis",
            "tools.yAxis": "Y Axis",

            // Curriculum
            "curriculum.title": "School Curriculum",
            "curriculum.level": "Level",
            "curriculum.subject": "Subject",
            "curriculum.unit": "Unit",
            "curriculum.topic": "Topic",
            "curriculum.description": "Description",
            "curriculum.lessons": "Lessons",
            "curriculum.exercises": "Exercises",
            "curriculum.resources": "Resources",
            "curriculum.explore": "Explore",

            // Teacher
            "teacher.title": "Teacher Area",
            "teacher.dashboard": "Teacher Dashboard",
            "teacher.createLesson": "Add Lesson",
            "teacher.createExercise": "Add Exercise",
            "teacher.createResource": "Add Resource",
            "teacher.myContent": "My Content",
            "teacher.contentTitle": "Content Title",
            "teacher.description": "Description",
            "teacher.videoUrl": "Video URL",
            "teacher.file": "File",
            "teacher.create": "Create",
            "teacher.saveDraft": "Save as Draft",
            "teacher.submitReview": "Submit for Review",
            "teacher.status": "Status",
            "teacher.draft": "Draft",
            "teacher.pending": "Under Review",
            "teacher.published": "Published",
            "teacher.rejected": "Rejected",

            // Review
            "review.title": "Content Review",
            "review.approve": "Approve and Publish",
            "review.reject": "Reject",
            "review.unpublish": "Unpublish",
            "review.note": "Reviewer Note",
            "review.noPending": "No content is waiting for review.",

            // Admin
            "admin.title": "Administration",
            "admin.users": "Users",
            "admin.content": "Content",
            "admin.statistics": "Statistics",
            "admin.settings": "Settings",
            "admin.manage": "Manage",
            "admin.ownerControl": "Owner Control",
            "admin.changeRole": "Change Role",
            "admin.deleteUser": "Delete User",

            // Curriculum Admin
            "curriculumAdmin.title": "Curriculum Management",
            "curriculumAdmin.add": "Add Item",
            "curriculumAdmin.create": "Create",
            "curriculumAdmin.update": "Update",
            "curriculumAdmin.delete": "Delete",
            "curriculumAdmin.active": "Active",
            "curriculumAdmin.inactive": "Inactive",

            // Leaderboard
            "leaderboard.title": "Leaderboard",
            "leaderboard.rank": "Rank",
            "leaderboard.user": "User",
            "leaderboard.xp": "XP",
            "leaderboard.level": "Level",
            "leaderboard.you": "You",

            // Achievements
            "achievements.title": "Achievements",
            "achievements.unlocked": "Unlocked",
            "achievements.locked": "Locked",
            "achievements.progress": "Progress",

            // Search
            "search.title": "Search",
            "search.placeholder": "Search HAMOU MATH...",
            "search.results": "Search Results",
            "search.lessons": "Lessons",
            "search.exercises": "Exercises",
            "search.resources": "Resources",
            "search.noResults": "No matching results found.",

            // Levels
            "levels.title": "School Levels",
            "levels.middle": "Middle School",
            "levels.secondary": "Secondary School",
            "levels.bac": "Baccalaureate",
            "levels.university": "University",

            // Messages
            "message.loading": "Loading...",
            "message.saved": "Saved successfully.",
            "message.deleted": "Deleted successfully.",
            "message.updated": "Updated successfully.",
            "message.created": "Created successfully.",
            "message.loginRequired": "You must log in first.",
            "message.teacherRequired": "This section is for teachers only.",
            "message.adminRequired": "You do not have permission to access this section.",
            "message.ownerRequired": "This section is for the owner only.",

            // Footer
            "footer.about": "About HAMOU MATH",
            "footer.aboutText": "An educational platform designed to make mathematics learning easier and more interactive.",
            "footer.quickLinks": "Quick Links",
            "footer.contact": "Contact",
            "footer.rights": "All rights reserved.",
            "footer.madeWith": "Built for better education.",

            // Common
            "unit.chapter": "Chapter",
            "unit.lesson": "Lesson",
            "unit.exercise": "Exercise",
            "unit.question": "Question",
            "unit.answer": "Answer",
            "unit.score": "Score",
            "unit.points": "Points",
            "unit.date": "Date",
            "unit.author": "Author",
            "unit.teacher": "Teacher",
            "unit.student": "Student"
        }
    };

    /*
     * ============================================================
     * وظائف داخلية
     * ============================================================
     */

    function isSupportedLanguage(language) {
        return SUPPORTED_LANGUAGES.includes(language);
    }

    function normalizeLanguage(language) {
        if (!language) return DEFAULT_LANGUAGE;

        const value = String(language).trim().toLowerCase();

        if (isSupportedLanguage(value)) {
            return value;
        }

        if (value.startsWith("ar")) return "ar";
        if (value.startsWith("fr")) return "fr";
        if (value.startsWith("en")) return "en";

        return DEFAULT_LANGUAGE;
    }

    function getStoredLanguage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return normalizeLanguage(stored);
        } catch (error) {
            console.warn("HAMOU MATH i18n: localStorage unavailable.", error);
            return DEFAULT_LANGUAGE;
        }
    }

    function saveLanguage(language) {
        try {
            localStorage.setItem(STORAGE_KEY, language);
        } catch (error) {
            console.warn("HAMOU MATH i18n: cannot save language.", error);
        }
    }

    function getBrowserLanguage() {
        const languages = Array.isArray(navigator.languages)
            ? navigator.languages
            : [navigator.language];

        for (const language of languages) {
            const normalized = normalizeLanguage(language);

            if (isSupportedLanguage(normalized)) {
                return normalized;
            }
        }

        return DEFAULT_LANGUAGE;
    }

    function getPathTranslation(object, key) {
        if (!object || !key) return null;

        const parts = String(key).split(".");
        let current = object;

        for (const part of parts) {
            if (
                current &&
                Object.prototype.hasOwnProperty.call(current, part)
            ) {
                current = current[part];
            } else {
                return null;
            }
        }

        return current;
    }

    /*
     * ============================================================
     * اللغة الحالية
     * ============================================================
     */

    let currentLanguage = getStoredLanguage();

    /*
     * ============================================================
     * الترجمة
     * ============================================================
     */

    function translate(key, fallback) {
        const languageDictionary =
            TRANSLATIONS[currentLanguage] || TRANSLATIONS[DEFAULT_LANGUAGE];

        let value = getPathTranslation(languageDictionary, key);

        if (value === null || value === undefined) {
            value = getPathTranslation(
                TRANSLATIONS[DEFAULT_LANGUAGE],
                key
            );
        }

        if (value === null || value === undefined) {
            return fallback !== undefined ? fallback : key;
        }

        return String(value);
    }

    /*
     * دعم:
     * t("hello")
     * t("hello", "Fallback")
     */

    function t(key, fallback) {
        return translate(key, fallback);
    }

    /*
     * ============================================================
     * تطبيق اتجاه اللغة على الصفحة
     * ============================================================
     */

    function applyDocumentLanguage() {
        const meta = LANGUAGE_META[currentLanguage];

        document.documentElement.lang = meta.code;
        document.documentElement.dir = meta.dir;

        document.body?.setAttribute("dir", meta.dir);
        document.body?.setAttribute("data-language", meta.code);

        document.documentElement.setAttribute(
            "data-language",
            meta.code
        );

        document.documentElement.setAttribute(
            "data-direction",
            meta.dir
        );

        document.body?.classList.toggle(
            "lang-ar",
            currentLanguage === "ar"
        );

        document.body?.classList.toggle(
            "lang-fr",
            currentLanguage === "fr"
        );

        document.body?.classList.toggle(
            "lang-en",
            currentLanguage === "en"
        );

        updateDocumentTitle();

        /*
         * إعلام بقية النظام باللغة الحالية
         */
        document.dispatchEvent(
            new CustomEvent("hamou:i18nApplied", {
                detail: {
                    language: currentLanguage,
                    direction: meta.dir,
                    locale: meta.locale
                }
            })
        );
    }

    /*
     * ============================================================
     * تحديث عنوان الصفحة
     * ============================================================
     */

    function updateDocumentTitle() {
        const titleElement =
            document.querySelector("[data-i18n-title-page]");

        if (!titleElement) return;

        const key = titleElement.getAttribute("data-i18n-title-page");

        if (!key) return;

        document.title = t(key);
    }

    /*
     * ============================================================
     * ترجمة عناصر HTML
     * ============================================================
     *
     * data-i18n="nav.home"
     * data-i18n-placeholder="search.placeholder"
     * data-i18n-title="general.close"
     * data-i18n-aria-label="nav.menu"
     * data-i18n-value="general.search"
     * ============================================================
     */

    function translateElement(element) {
        if (!element || !(element instanceof Element)) {
            return;
        }

        // النص الداخلي
        if (element.hasAttribute("data-i18n")) {
            const key = element.getAttribute("data-i18n");
            const translated = t(key);

            /*
             * نستخدم textContent للسلامة،
             * ولا نستخدم innerHTML للنصوص العادية.
             */
            element.textContent = translated;
        }

        // placeholder
        if (element.hasAttribute("data-i18n-placeholder")) {
            const key = element.getAttribute(
                "data-i18n-placeholder"
            );

            element.setAttribute(
                "placeholder",
                t(key)
            );
        }

        // title
        if (element.hasAttribute("data-i18n-title")) {
            const key = element.getAttribute("data-i18n-title");

            element.setAttribute(
                "title",
                t(key)
            );
        }

        // aria-label
        if (element.hasAttribute("data-i18n-aria-label")) {
            const key = element.getAttribute(
                "data-i18n-aria-label"
            );

            element.setAttribute(
                "aria-label",
                t(key)
            );
        }

        // value
        if (element.hasAttribute("data-i18n-value")) {
            const key = element.getAttribute(
                "data-i18n-value"
            );

            if (
                element instanceof HTMLInputElement ||
                element instanceof HTMLButtonElement ||
                element instanceof HTMLTextAreaElement
            ) {
                element.value = t(key);
            }
        }
    }

    function translatePage(root = document) {
        if (!root) return;

        if (root instanceof Element) {
            translateElement(root);
        }

        const elements = root.querySelectorAll(
            "[data-i18n]," +
            "[data-i18n-placeholder]," +
            "[data-i18n-title]," +
            "[data-i18n-aria-label]," +
            "[data-i18n-value]"
        );

        elements.forEach(translateElement);

        updateDocumentTitle();
    }

    /*
     * ============================================================
     * تحديث خيارات Select
     * ============================================================
     */

    function updateLanguageSelects() {
        const selects = document.querySelectorAll(
            "[data-language-select]"
        );

        selects.forEach(select => {
            if (select.value !== currentLanguage) {
                select.value = currentLanguage;
            }
        });
    }

    /*
     * ============================================================
     * تبديل اللغة
     * ============================================================
     */

    function setLanguage(language, options = {}) {
        const normalized = normalizeLanguage(language);

        if (!isSupportedLanguage(normalized)) {
            return false;
        }

        const oldLanguage = currentLanguage;

        currentLanguage = normalized;

        saveLanguage(currentLanguage);

        applyDocumentLanguage();
        translatePage();
        updateLanguageSelects();

        /*
         * تحديث أزرار اللغة الموجودة في الصفحة
         */
        document
            .querySelectorAll("[data-language]")
            .forEach(button => {
                const buttonLanguage =
                    normalizeLanguage(
                        button.getAttribute("data-language")
                    );

                button.classList.toggle(
                    "active",
                    buttonLanguage === currentLanguage
                );

                button.setAttribute(
                    "aria-pressed",
                    buttonLanguage === currentLanguage
                        ? "true"
                        : "false"
                );
            });

        /*
         * حدث مخصص يمكن لبقية ملفات الموقع الاستماع إليه
         */
        document.dispatchEvent(
            new CustomEvent("hamou:languageChanged", {
                detail: {
                    language: currentLanguage,
                    previousLanguage: oldLanguage,
                    direction:
                        LANGUAGE_META[currentLanguage].dir,
                    locale:
                        LANGUAGE_META[currentLanguage].locale,
                    silent: !!options.silent
                }
            })
        );

        /*
         * بعض الصفحات قد تحتاج إلى إعادة رسمها.
         * نرسل أيضًا حدثًا عامًا.
         */
        window.dispatchEvent(
            new CustomEvent("hamou-language-changed", {
                detail: {
                    language: currentLanguage,
                    previousLanguage: oldLanguage
                }
            })
        );

        return true;
    }

    /*
     * ============================================================
     * اللغات المتاحة
     * ============================================================
     */

    function getLanguages() {
        return SUPPORTED_LANGUAGES.map(code => ({
            ...LANGUAGE_META[code]
        }));
    }

    function getLanguage() {
        return currentLanguage;
    }

    function getLanguageMeta(language = currentLanguage) {
        const normalized = normalizeLanguage(language);

        return {
            ...LANGUAGE_META[normalized]
        };
    }

    function getDirection(language = currentLanguage) {
        return getLanguageMeta(language).dir;
    }

    function getLocale(language = currentLanguage) {
        return getLanguageMeta(language).locale;
    }

    /*
     * ============================================================
     * إنشاء زر/قائمة اللغات تلقائيًا
     * ============================================================
     *
     * تستطيع الصفحة استعمال:
     *
     * <div data-language-switcher></div>
     *
     * وسيتم إنشاء:
     * العربية | Français | English
     *
     * ============================================================
     */

    function createLanguageSwitcher(container) {
        if (!container) return;

        const labels = {
            ar: "العربية",
            fr: "Français",
            en: "English"
        };

        const shortLabels = {
            ar: "AR",
            fr: "FR",
            en: "EN"
        };

        container.innerHTML = "";

        const wrapper = document.createElement("div");

        wrapper.className = "hamou-language-switcher";

        wrapper.setAttribute(
            "role",
            "group"
        );

        wrapper.setAttribute(
            "aria-label",
            t("nav.language")
        );

        SUPPORTED_LANGUAGES.forEach(code => {
            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "hamou-language-button";

            button.setAttribute(
                "data-language",
                code
            );

            button.setAttribute(
                "title",
                labels[code]
            );

            button.setAttribute(
                "aria-label",
                labels[code]
            );

            button.setAttribute(
                "aria-pressed",
                code === currentLanguage
                    ? "true"
                    : "false"
            );

            button.classList.toggle(
                "active",
                code === currentLanguage
            );

            button.innerHTML =
                "<span class=\"hamou-language-short\">" +
                escapeHtml(shortLabels[code]) +
                "</span>" +
                "<span class=\"hamou-language-full\">" +
                escapeHtml(labels[code]) +
                "</span>";

            button.addEventListener(
                "click",
                () => {
                    setLanguage(code);
                }
            );

            wrapper.appendChild(button);
        });

        container.appendChild(wrapper);
    }

    /*
     * ============================================================
     * تهيئة جميع Language Switchers
     * ============================================================
     */

    function initLanguageSwitchers() {
        document
            .querySelectorAll("[data-language-switcher]")
            .forEach(createLanguageSwitcher);

        /*
         * دعم الأزرار الجاهزة:
         * <button data-language="ar">AR</button>
         */

        document
            .querySelectorAll(
                "button[data-language]," +
                "[role=\"button\"][data-language]"
            )
            .forEach(button => {

                /*
                 * منع إضافة Listener مرتين.
                 */
                if (
                    button.dataset.i18nBound === "true"
                ) {
                    return;
                }

                button.dataset.i18nBound = "true";

                const code =
                    normalizeLanguage(
                        button.getAttribute(
                            "data-language"
                        )
                    );

                button.classList.toggle(
                    "active",
                    code === currentLanguage
                );

                button.setAttribute(
                    "aria-pressed",
                    code === currentLanguage
                        ? "true"
                        : "false"
                );

                button.addEventListener(
                    "click",
                    event => {
                        event.preventDefault();

                        setLanguage(code);
                    }
                );
            });

        /*
         * Select خاص باللغة
         */
        document
            .querySelectorAll(
                "select[data-language-select]"
            )
            .forEach(select => {

                if (
                    select.dataset.i18nBound === "true"
                ) {
                    return;
                }

                select.dataset.i18nBound = "true";

                select.value = currentLanguage;

                select.addEventListener(
                    "change",
                    () => {
                        setLanguage(select.value);
                    }
                );
            });
    }

    /*
     * ============================================================
     * مراقبة DOM للعناصر التي تتم إضافتها ديناميكيًا
     * ============================================================
     *
     * مفيد للـ navbar والمكتبة والتمارين وغيرها.
     * ============================================================
     */

    function observeDynamicContent() {
        if (
            typeof MutationObserver === "undefined"
        ) {
            return;
        }

        const observer =
            new MutationObserver(
                mutations => {

                    let shouldTranslate = false;

                    for (const mutation of mutations) {
                        if (
                            mutation.type === "childList" &&
                            mutation.addedNodes.length > 0
                        ) {
                            shouldTranslate = true;
                            break;
                        }
                    }

                    if (!shouldTranslate) {
                        return;
                    }

                    /*
                     * نؤجل التنفيذ حتى لا نكرر
                     * عمليات الترجمة أثناء عدة تغييرات.
                     */
                    requestAnimationFrame(() => {
                        translatePage();
                        initLanguageSwitchers();
                    });
                }
            );

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );
    }

    /*
     * ============================================================
     * escaping آمن
     * ============================================================
     */

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /*
     * ============================================================
     * تهيئة النظام
     * ============================================================
     */

    function init() {
        /*
         * عند عدم وجود لغة محفوظة،
         * نحاول الاستفادة من لغة المتصفح.
         */
        let storedLanguage = null;

        try {
            storedLanguage =
                localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            storedLanguage = null;
        }

        if (!storedLanguage) {
            currentLanguage = getBrowserLanguage();

            saveLanguage(currentLanguage);
        } else {
            currentLanguage =
                normalizeLanguage(storedLanguage);
        }

        applyDocumentLanguage();
        translatePage();
        initLanguageSwitchers();

        /*
         * إعادة تطبيق بسيطة بعد اكتمال DOM.
         */
        requestAnimationFrame(() => {
            applyDocumentLanguage();
            translatePage();
            initLanguageSwitchers();
        });

        /*
         * مراقبة المحتوى الديناميكي.
         */
        observeDynamicContent();

        /*
         * السماح للصفحات باستخدام عناصر
         * تحتوي data-i18n يتم إضافتها لاحقًا.
         */
        document.dispatchEvent(
            new CustomEvent("hamou:i18nReady", {
                detail: {
                    language: currentLanguage,
                    direction:
                        LANGUAGE_META[currentLanguage].dir,
                    locale:
                        LANGUAGE_META[currentLanguage].locale
                }
            })
        );
    }

    /*
     * ============================================================
     * API عامة
     * ============================================================
     */

    window.HAMOU_I18N = {
        t,
        translate,
        translatePage,
        setLanguage,
        getLanguage,
        getLanguages,
        getLanguageMeta,
        getDirection,
        getLocale,
        initLanguageSwitchers,
        createLanguageSwitcher,
        storageKey: STORAGE_KEY,
        supportedLanguages: [...SUPPORTED_LANGUAGES]
    };

    /*
     * اختصار عالمي إضافي
     */
    window.hamouT = t;

    /*
     * ============================================================
     * تشغيل
     * ============================================================
     */

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            { once: true }
        );
    } else {
        init();
    }

})();
