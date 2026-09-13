export type UILang = 'FR' | 'AR'

interface Translations {
  // Layout
  navProfile: string; navCheckup: string; navAssistant: string; navAppointments: string; navLogout: string
  // Auth common
  home: string; about: string
  // LoginPage
  loginWelcome: string; loginSubtitle: string; loginEmail: string; loginPassword: string
  loginEmailPlaceholder: string; loginForgotPassword: string; loginButton: string
  loginLoading: string; loginNoAccount: string; loginCreateAccount: string
  loginRegisterButton: string; loginHidePassword: string; loginShowPassword: string
  loginError: string
  // RegisterPage
  registerHeroLabel: string; registerHeroTitle: string; registerHeroDesc: string
  registerSecureData: string; registerWebApp: string
  registerCardTitle: string; registerCardSubtitle: string
  registerEmail: string; registerEmailPlaceholder: string
  registerPassword: string; registerPasswordPlaceholder: string
  registerConfirmPassword: string; registerConfirmPlaceholder: string
  registerPhone: string; registerPhoneOptional: string; registerReceiveCode: string
  registerButton: string; registerLoading: string
  registerAlreadyAccount: string; registerLoginLink: string; registerSignupButton: string
  // OtpPage
  otpBack: string; otpEmailTitle: string; otpPhoneTitle: string; otpSecureAccount: string
  otpVerificationCode: string; otpEmailSent: string; otpPhoneSent: string
  otpExpiresIn: string; otpCodeSent: string
  otpVerifyButton: string; otpVerifying: string
  otpNoCode: string; otpResend: string; otpResending: string; otpSecurityNote: string
  // ForgotPasswordPage
  forgotBackToLogin: string; forgotStep1Title: string; forgotStep2Title: string
  forgotStep1Subtitle: string; forgotStep2Subtitle: string
  forgotEmailLabel: string; forgotReceiveCode: string
  forgotSendCode: string; forgotSending: string
  forgotRemember: string; forgotLoginLink: string
  forgotOtpLabel: string; forgotExpired: string
  forgotNewPassword: string; forgotPasswordPlaceholder: string
  forgotConfirmPassword: string; forgotResetButton: string; forgotResetting: string
  forgotBackStep: string
  // ProfilePage
  profileTitle: string; profileNewTitle: string; profileSubtitle: string
  profileFullName: string; profileNamePlaceholder: string
  profileAge: string; profileAgePlaceholder: string
  profileWeight: string; profileWeightPlaceholder: string
  profileHeight: string; profileHeightPlaceholder: string
  profileRegion: string; profileRegionPlaceholder: string
  profileVille: string; profileVillePlaceholder: string
  profilePrefecture: string; profilePrefecturePlaceholder: string
  profileMilieu: string; profileRural: string; profileUrban: string
  profileLMP: string; profileDPAFromLMP: string
  profilePregnancyWeek: string; profileWeekComputed: string; profileDPAFromWeek: string
  profileWeekPrefix: string
  profileTrimester1: string; profileTrimester2: string; profileTrimester3: string
  profileWeekDiffNote: string
  profilePreviousPreg: string; profileChildren: string; profileMultiplePreg: string
  profileMedicalHistory: string; profileFollowUp: string
  profileBloodType: string; profileSupplements: string
  profileAllergies: string; profileAllergiesPlaceholder: string
  profileSaveNew: string; profileUpdate: string; profileSaving: string
  // Medical conditions
  condDiabetes: string; condHypertension: string; condPreeclampsia: string
  condPremature: string; condMiscarriage: string; condCesarean: string
  condAnemia: string; condThyroid: string; condNone: string
  // Follow-up types
  followGyneco: string; followMidwife: string; followGP: string; followNone: string
  // Supplements
  suppFolicAcid: string; suppIron: string; suppVitD: string; suppCalcium: string
  suppIodine: string; suppOmega3: string; suppMagnesium: string
  suppB12: string; suppVitC: string; suppZinc: string
  // CheckupPage
  checkupTitle: string; checkupNumber: string; checkupVitals: string
  checkupBP: string; checkupBPUnit: string
  checkupSugar: string; checkupSugarUnit: string
  checkupTemp: string; checkupTempUnit: string
  checkupHR: string; checkupHRUnit: string
  checkupSymptoms: string; checkupNotes: string; checkupNotesPlaceholder: string
  checkupResultEmpty: string; checkupResultEmptyHint: string
  checkupFactors: string; checkupFactorBP: string; checkupFactorSymptoms: string
  checkupFactorSugar: string; checkupFactorTemp: string
  checkupSubmit: string; checkupSubmitting: string; checkupChat: string
  checkupGreen: string; checkupYellow: string; checkupRed: string; checkupNoData: string
  // Symptoms
  symptomHeadache: string; symptomBlurry: string; symptomNausea: string
  symptomEdema: string; symptomAbdominal: string; symptomNone: string
  // ChatPage
  chatSidebarTitle: string; chatSidebarSub: string
  chatHeaderTitle: string; chatOnline: string; chatHistory: string
  chatPrevious: string; chatCurrent: string
  chatEmptyTitle: string; chatEmptySubtitle: string; chatDisclaimer: string
  chatPlaceholder: string; chatStopRecording: string; chatStartRecording: string
  chatSend: string; chatNoHistory: string; chatVoiceMessage: string
  chatError: string; chatNoAnswer: string; chatFrequent: string
  // Quick prompts
  promptBP: string; promptAlerts: string; promptBirth: string
  promptNutrition: string; promptCesarean: string; promptPostpartum: string
  // TTS
  chatSpeak: string; chatStopSpeaking: string
}

const FR: Translations = {
  navProfile: 'Mon profil', navCheckup: 'Suivi', navAssistant: 'Assistant', navAppointments: 'Rendez-vous', navLogout: 'Déconnexion',
  home: 'Accueil', about: 'À propos',
  loginWelcome: 'Bon retour parmi nous', loginSubtitle: 'Votre suivi vous attend',
  loginEmail: 'Email', loginPassword: 'Mot de passe',
  loginEmailPlaceholder: 'votre@email.com', loginForgotPassword: 'Mot de passe oublié ?',
  loginButton: 'Se connecter', loginLoading: 'Connexion…',
  loginNoAccount: 'Pas encore inscrite ?', loginCreateAccount: 'Créer un compte',
  loginRegisterButton: "S'inscrire",
  loginHidePassword: 'Masquer le mot de passe', loginShowPassword: 'Afficher le mot de passe',
  loginError: 'Email ou mot de passe incorrect.',
  registerHeroLabel: 'Rejoignez Mama Salama · انضمي إلى ماما سلامة',
  registerHeroTitle: 'Votre grossesse,\naccompagnée avec soin',
  registerHeroDesc: "Créez votre compte et bénéficiez d'un suivi prénatal intelligent, multilingue, et pensé pour les femmes marocaines.",
  registerSecureData: 'Données sécurisées', registerWebApp: 'Application web',
  registerCardTitle: 'Créer un compte', registerCardSubtitle: 'Gratuit · Confidentiel · Sans publicité',
  registerEmail: 'Adresse email', registerEmailPlaceholder: 'vous@exemple.com',
  registerPassword: 'Mot de passe', registerPasswordPlaceholder: 'Minimum 8 caractères',
  registerConfirmPassword: 'Confirmer le mot de passe', registerConfirmPlaceholder: 'Répétez votre mot de passe',
  registerPhone: 'Téléphone', registerPhoneOptional: '(optionnel)', registerReceiveCode: 'Recevoir le code par',
  registerButton: 'Créer mon compte →', registerLoading: 'Inscription…',
  registerAlreadyAccount: 'Déjà inscrite ?', registerLoginLink: 'Se connecter', registerSignupButton: "S'inscrire",
  otpBack: '← Retour', otpEmailTitle: 'Vérification de votre email', otpPhoneTitle: 'Vérification de votre numéro',
  otpSecureAccount: 'Sécurisez votre compte Mama Salama', otpVerificationCode: 'Code de vérification',
  otpEmailSent: 'Un code à 6 chiffres a été envoyé à votre adresse email',
  otpPhoneSent: 'Un code à 6 chiffres a été envoyé à votre numéro',
  otpExpiresIn: 'Expire dans', otpCodeSent: 'Nouveau code envoyé !',
  otpVerifyButton: 'Vérifier ✓', otpVerifying: 'Vérification…',
  otpNoCode: 'Code non reçu ?', otpResend: 'Renvoyer', otpResending: 'Envoi…',
  otpSecurityNote: 'Code valable 5 min · Données chiffrées',
  forgotBackToLogin: 'Retour à la connexion', forgotStep1Title: 'Réinitialiser le mot de passe',
  forgotStep2Title: 'Nouveau mot de passe',
  forgotStep1Subtitle: 'Renseignez votre email pour recevoir un code',
  forgotStep2Subtitle: 'Code envoyé à',
  forgotEmailLabel: 'Email', forgotReceiveCode: 'Recevoir le code par',
  forgotSendCode: 'Envoyer le code →', forgotSending: 'Envoi en cours…',
  forgotRemember: 'Vous vous souvenez ?', forgotLoginLink: 'Se connecter',
  forgotOtpLabel: 'Code de vérification à 6 chiffres', forgotExpired: 'Code expiré',
  forgotNewPassword: 'Nouveau mot de passe', forgotPasswordPlaceholder: 'Minimum 8 caractères',
  forgotConfirmPassword: 'Confirmer le mot de passe',
  forgotResetButton: 'Réinitialiser le mot de passe ✓', forgotResetting: 'Réinitialisation…',
  forgotBackStep: "← Modifier l'email ou le canal",
  profileTitle: 'Mon profil de grossesse', profileNewTitle: 'Complétez votre profil de grossesse',
  profileSubtitle: 'Ces informations nous permettent de personnaliser votre accompagnement',
  profileFullName: 'Nom complet', profileNamePlaceholder: 'Votre nom et prénom',
  profileAge: 'Âge', profileAgePlaceholder: 'ex : 28',
  profileWeight: 'Poids (kg)', profileWeightPlaceholder: 'ex : 65',
  profileHeight: 'Taille (cm)', profileHeightPlaceholder: 'ex : 165',
  profileRegion: 'Région', profileRegionPlaceholder: 'Choisir…',
  profileVille: 'Ville', profileVillePlaceholder: 'Choisir…',
  profilePrefecture: 'Préfecture', profilePrefecturePlaceholder: 'Choisir…',
  profileMilieu: 'Milieu', profileRural: 'Rural', profileUrban: 'Urbain',
  profileLMP: 'Date des dernières règles (DDR)', profileDPAFromLMP: 'DPA (selon DDR)',
  profilePregnancyWeek: 'Semaine de grossesse (SA)', profileWeekComputed: 'SA calculée',
  profileDPAFromWeek: 'DPA (selon SA saisie)', profileWeekPrefix: 'Semaine',
  profileTrimester1: '1er trimestre', profileTrimester2: '2ème trimestre', profileTrimester3: '3ème trimestre',
  profileWeekDiffNote: 'La SA calculée depuis la DDR ({calc}) diffère de votre saisie manuelle ({manual}).',
  profilePreviousPreg: 'Grossesses précédentes', profileChildren: "Nombre d'enfants",
  profileMultiplePreg: 'Grossesse multiple (jumeaux, triplés…)',
  profileMedicalHistory: 'Antécédents médicaux', profileFollowUp: 'Type de suivi médical',
  profileBloodType: 'Groupe sanguin', profileSupplements: 'Suppléments pris',
  profileAllergies: 'Allergies', profileAllergiesPlaceholder: 'Pénicilline, arachides…',
  profileSaveNew: 'Enregistrer et continuer →', profileUpdate: 'Mettre à jour →', profileSaving: 'Enregistrement…',
  condDiabetes: 'Diabète gestationnel', condHypertension: 'Hypertension artérielle',
  condPreeclampsia: 'Pré-éclampsie antérieure', condPremature: 'Prématurité',
  condMiscarriage: 'Fausse couche', condCesarean: 'Césarienne précédente',
  condAnemia: 'Anémie', condThyroid: 'Thyroïde', condNone: 'Aucun antécédent',
  followGyneco: 'Gynécologue', followMidwife: 'Sage-femme',
  followGP: 'Médecin généraliste', followNone: 'Aucun suivi',
  suppFolicAcid: 'Acide folique', suppIron: 'Fer', suppVitD: 'Vitamine D',
  suppCalcium: 'Calcium', suppIodine: 'Iode', suppOmega3: 'Oméga-3',
  suppMagnesium: 'Magnésium', suppB12: 'Vitamine B12', suppVitC: 'Vitamine C', suppZinc: 'Zinc',
  checkupTitle: 'Bilan du jour', checkupNumber: 'Bilan n°', checkupVitals: 'Constantes vitales',
  checkupBP: 'Tension artérielle', checkupBPUnit: 'mmHg · sys / dia',
  checkupSugar: 'Glycémie', checkupSugarUnit: 'mmol/L · à jeun',
  checkupTemp: 'Température', checkupTempUnit: '°C · corporelle',
  checkupHR: 'Fréquence cardiaque', checkupHRUnit: 'bpm · battements/min',
  checkupSymptoms: 'Symptômes ressentis', checkupNotes: 'Notes supplémentaires',
  checkupNotesPlaceholder: 'Remarques, contexte…',
  checkupResultEmpty: "Résultat d'évaluation",
  checkupResultEmptyHint: 'Remplissez vos constantes et soumettez pour obtenir une analyse',
  checkupFactors: 'Facteurs influençant le résultat',
  checkupFactorBP: 'Tension systolique', checkupFactorSymptoms: 'Symptômes',
  checkupFactorSugar: 'Glycémie', checkupFactorTemp: 'Température',
  checkupSubmit: 'Enregistrer ce bilan ✓', checkupSubmitting: 'Analyse en cours…',
  checkupChat: "💬 En parler avec l'assistant",
  checkupGreen: 'Vos constantes sont normales ✓ Continuez votre suivi régulier.',
  checkupYellow: 'Tension proche du seuil ou symptômes présents. Une consultation dans les 24–48h est conseillée.',
  checkupRed: "Signes d'alerte détectés. Consultez un médecin ou une sage-femme immédiatement. Appelez le 15.",
  checkupNoData: 'Aucune donnée',
  symptomHeadache: 'Maux de tête', symptomBlurry: 'Vision floue', symptomNausea: 'Nausées',
  symptomEdema: 'Oedèmes', symptomAbdominal: 'Douleurs abdominales', symptomNone: 'Aucun symptôme',
  chatSidebarTitle: 'Assistant Mama Salama', chatSidebarSub: 'Réponses sourcées · RAG médical',
  chatHeaderTitle: 'Assistant Mama Salama · Santé maternelle',
  chatOnline: 'En ligne · Réponses générées par IA', chatHistory: 'Historique',
  chatPrevious: 'Conversations précédentes', chatCurrent: 'Session actuelle',
  chatEmptyTitle: "Bonjour ! Je suis l'assistant Mama Salama",
  chatEmptySubtitle: "Je peux répondre à vos questions sur la grossesse, l'accouchement et le post-partum en français ou en arabe.",
  chatDisclaimer: "🔒 Cet assistant fournit de l'information générale uniquement. Il ne remplace pas un avis médical professionnel.",
  chatPlaceholder: 'Posez votre question en français, arabe ou darija…',
  chatStopRecording: "Arrêter l'enregistrement", chatStartRecording: 'Enregistrer un message vocal',
  chatSend: 'Envoyer', chatNoHistory: 'Aucun historique disponible',
  chatVoiceMessage: 'Message vocal…', chatError: "Une erreur s'est produite. Veuillez réessayer.",
  chatNoAnswer: 'Désolé, aucune réponse reçue.', chatFrequent: 'Sujets fréquents',
  promptBP: 'Ma tension est-elle dangereuse ?', promptAlerts: "Signes d'alerte au 2e trimestre",
  promptBirth: "Préparation à l'accouchement", promptNutrition: 'Alimentation pendant la grossesse',
  promptCesarean: 'Césarienne : que savoir ?', promptPostpartum: 'Soins post-partum',
  chatSpeak: 'Écouter la réponse', chatStopSpeaking: 'Arrêter la lecture',
}

const AR: Translations = {
  navProfile: 'ملفي', navCheckup: 'متابعة', navAssistant: 'المساعد', navAppointments: 'المواعيد', navLogout: 'تسجيل الخروج',
  home: 'الرئيسية', about: 'حول',
  loginWelcome: 'مرحباً بعودتك', loginSubtitle: 'متابعتك بانتظارك',
  loginEmail: 'البريد الإلكتروني', loginPassword: 'كلمة المرور',
  loginEmailPlaceholder: 'بريدك@مثال.com', loginForgotPassword: 'نسيتِ كلمة المرور؟',
  loginButton: 'تسجيل الدخول', loginLoading: 'جارٍ الاتصال…',
  loginNoAccount: 'لم تسجلي بعد؟', loginCreateAccount: 'إنشاء حساب',
  loginRegisterButton: 'التسجيل',
  loginHidePassword: 'إخفاء كلمة المرور', loginShowPassword: 'إظهار كلمة المرور',
  loginError: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  registerHeroLabel: 'انضمي إلى ماما سلامة · Rejoignez Mama Salama',
  registerHeroTitle: 'حملك،\nمرافَق بعناية',
  registerHeroDesc: 'أنشئي حسابك واستفيدي من متابعة ما قبل الولادة الذكية، متعددة اللغات، والمصممة للمرأة المغربية.',
  registerSecureData: 'بيانات آمنة', registerWebApp: 'تطبيق ويب',
  registerCardTitle: 'إنشاء حساب', registerCardSubtitle: 'مجاني · سري · بدون إعلانات',
  registerEmail: 'البريد الإلكتروني', registerEmailPlaceholder: 'أنت@مثال.com',
  registerPassword: 'كلمة المرور', registerPasswordPlaceholder: '8 أحرف على الأقل',
  registerConfirmPassword: 'تأكيد كلمة المرور', registerConfirmPlaceholder: 'أعيدي كتابة كلمة المرور',
  registerPhone: 'الهاتف', registerPhoneOptional: '(اختياري)', registerReceiveCode: 'استلام الرمز عبر',
  registerButton: 'إنشاء حسابي ←', registerLoading: 'جارٍ التسجيل…',
  registerAlreadyAccount: 'مسجلة بالفعل؟', registerLoginLink: 'تسجيل الدخول', registerSignupButton: 'التسجيل',
  otpBack: 'رجوع →', otpEmailTitle: 'التحقق من بريدك الإلكتروني', otpPhoneTitle: 'التحقق من رقمك',
  otpSecureAccount: 'أمّني حسابك في ماما سلامة', otpVerificationCode: 'رمز التحقق',
  otpEmailSent: 'تم إرسال رمز مكون من 6 أرقام إلى بريدك الإلكتروني',
  otpPhoneSent: 'تم إرسال رمز مكون من 6 أرقام إلى رقمك',
  otpExpiresIn: 'ينتهي خلال', otpCodeSent: 'تم إرسال رمز جديد!',
  otpVerifyButton: 'تحقق ✓', otpVerifying: 'جارٍ التحقق…',
  otpNoCode: 'لم تستلمي الرمز؟', otpResend: 'إعادة الإرسال', otpResending: 'جارٍ الإرسال…',
  otpSecurityNote: 'الرمز صالح 5 دقائق · بيانات مشفرة',
  forgotBackToLogin: 'العودة إلى تسجيل الدخول', forgotStep1Title: 'إعادة تعيين كلمة المرور',
  forgotStep2Title: 'كلمة مرور جديدة',
  forgotStep1Subtitle: 'أدخلي بريدك الإلكتروني لاستلام الرمز',
  forgotStep2Subtitle: 'تم إرسال الرمز إلى',
  forgotEmailLabel: 'البريد الإلكتروني', forgotReceiveCode: 'استلام الرمز عبر',
  forgotSendCode: 'إرسال الرمز ←', forgotSending: 'جارٍ الإرسال…',
  forgotRemember: 'تتذكرين كلمة المرور؟', forgotLoginLink: 'تسجيل الدخول',
  forgotOtpLabel: 'رمز التحقق المكون من 6 أرقام', forgotExpired: 'انتهت صلاحية الرمز',
  forgotNewPassword: 'كلمة المرور الجديدة', forgotPasswordPlaceholder: '8 أحرف على الأقل',
  forgotConfirmPassword: 'تأكيد كلمة المرور',
  forgotResetButton: 'إعادة تعيين كلمة المرور ✓', forgotResetting: 'جارٍ الإعادة التعيين…',
  forgotBackStep: '→ تعديل البريد أو القناة',
  profileTitle: 'ملف حملي', profileNewTitle: 'أكملي ملف حملك',
  profileSubtitle: 'هذه المعلومات تتيح لنا تخصيص مرافقتك',
  profileFullName: 'الاسم الكامل', profileNamePlaceholder: 'اسمك ولقبك',
  profileAge: 'العمر', profileAgePlaceholder: 'مثال: 28',
  profileWeight: 'الوزن (كغ)', profileWeightPlaceholder: 'مثال: 65',
  profileHeight: 'الطول (سم)', profileHeightPlaceholder: 'مثال: 165',
  profileRegion: 'المنطقة', profileRegionPlaceholder: 'اختاري…',
  profileVille: 'المدينة', profileVillePlaceholder: 'اختاري…',
  profilePrefecture: 'العمالة', profilePrefecturePlaceholder: 'اختاري…',
  profileMilieu: 'الوسط', profileRural: 'قروي', profileUrban: 'حضري',
  profileLMP: 'تاريخ آخر دورة شهرية', profileDPAFromLMP: 'تاريخ الولادة المتوقع (حسب الدورة)',
  profilePregnancyWeek: 'أسبوع الحمل', profileWeekComputed: 'الأسبوع المحسوب',
  profileDPAFromWeek: 'تاريخ الولادة المتوقع (حسب الأسبوع)', profileWeekPrefix: 'الأسبوع',
  profileTrimester1: 'الثلث الأول', profileTrimester2: 'الثلث الثاني', profileTrimester3: 'الثلث الثالث',
  profileWeekDiffNote: 'الأسبوع المحسوب من الدورة ({calc}) يختلف عن الإدخال اليدوي ({manual}).',
  profilePreviousPreg: 'حمل سابق', profileChildren: 'عدد الأطفال',
  profileMultiplePreg: 'حمل متعدد (توأم، ثلاثة توائم…)',
  profileMedicalHistory: 'السوابق الطبية', profileFollowUp: 'نوع المتابعة الطبية',
  profileBloodType: 'فصيلة الدم', profileSupplements: 'المكملات المتناولة',
  profileAllergies: 'الحساسية', profileAllergiesPlaceholder: 'البنسلين، الفول السوداني…',
  profileSaveNew: 'حفظ والمتابعة ←', profileUpdate: 'تحديث ←', profileSaving: 'جارٍ الحفظ…',
  condDiabetes: 'سكري الحمل', condHypertension: 'ارتفاع ضغط الدم',
  condPreeclampsia: 'تسمم الحمل السابق', condPremature: 'ولادة مبكرة',
  condMiscarriage: 'إجهاض', condCesarean: 'قيصرية سابقة',
  condAnemia: 'فقر الدم', condThyroid: 'الغدة الدرقية', condNone: 'لا سوابق طبية',
  followGyneco: 'طبيب نساء', followMidwife: 'قابلة', followGP: 'طبيب عام', followNone: 'بدون متابعة',
  suppFolicAcid: 'حمض الفوليك', suppIron: 'الحديد', suppVitD: 'فيتامين د',
  suppCalcium: 'الكالسيوم', suppIodine: 'اليود', suppOmega3: 'أوميجا-3',
  suppMagnesium: 'المغنيسيوم', suppB12: 'فيتامين ب12', suppVitC: 'فيتامين ج', suppZinc: 'الزنك',
  checkupTitle: 'بيان اليوم', checkupNumber: 'بيان رقم', checkupVitals: 'المؤشرات الحيوية',
  checkupBP: 'ضغط الدم', checkupBPUnit: 'مم زئبق · انقباضي / انبساطي',
  checkupSugar: 'سكر الدم', checkupSugarUnit: 'مم ول/ل · صائمة',
  checkupTemp: 'درجة الحرارة', checkupTempUnit: '°م · جسدية',
  checkupHR: 'نبضات القلب', checkupHRUnit: 'نبضة/دقيقة',
  checkupSymptoms: 'الأعراض المشعور بها', checkupNotes: 'ملاحظات إضافية',
  checkupNotesPlaceholder: 'ملاحظات، سياق…',
  checkupResultEmpty: 'نتيجة التقييم',
  checkupResultEmptyHint: 'أدخلي مؤشراتك الحيوية وأرسلي للحصول على تحليل',
  checkupFactors: 'العوامل المؤثرة على النتيجة',
  checkupFactorBP: 'الضغط الانقباضي', checkupFactorSymptoms: 'الأعراض',
  checkupFactorSugar: 'سكر الدم', checkupFactorTemp: 'درجة الحرارة',
  checkupSubmit: 'حفظ هذا البيان ✓', checkupSubmitting: 'جارٍ التحليل…',
  checkupChat: '💬 مناقشة مع المساعد',
  checkupGreen: 'مؤشراتك طبيعية ✓ واصلي متابعتك المنتظمة.',
  checkupYellow: 'الضغط قريب من الحد أو توجد أعراض. يُنصح بالاستشارة خلال 24–48 ساعة.',
  checkupRed: 'تم رصد علامات تحذيرية. استشيري طبيبة أو قابلة فوراً.',
  checkupNoData: 'لا توجد بيانات',
  symptomHeadache: 'صداع', symptomBlurry: 'ضبابية البصر', symptomNausea: 'غثيان',
  symptomEdema: 'تورم', symptomAbdominal: 'آلام البطن', symptomNone: 'لا أعراض',
  chatSidebarTitle: 'مساعد ماما سلامة', chatSidebarSub: 'إجابات موثقة · RAG طبي',
  chatHeaderTitle: 'مساعد ماما سلامة · صحة الأمومة',
  chatOnline: 'متصل · إجابات مولّدة بالذكاء الاصطناعي', chatHistory: 'السجل',
  chatPrevious: 'المحادثات السابقة', chatCurrent: 'الجلسة الحالية',
  chatEmptyTitle: 'مرحباً! أنا مساعد ماما سلامة',
  chatEmptySubtitle: 'يمكنني الإجابة على أسئلتك حول الحمل والولادة وما بعدها بالعربية أو الفرنسية.',
  chatDisclaimer: '🔒 يوفر هذا المساعد معلومات عامة فقط. لا يُغني عن الاستشارة الطبية المتخصصة.',
  chatPlaceholder: 'اطرحي سؤالك بالعربية أو الفرنسية أو الدارجة…',
  chatStopRecording: 'إيقاف التسجيل', chatStartRecording: 'تسجيل رسالة صوتية',
  chatSend: 'إرسال', chatNoHistory: 'لا يوجد سجل',
  chatVoiceMessage: 'رسالة صوتية…', chatError: 'حدث خطأ. الرجاء المحاولة مرة أخرى.',
  chatNoAnswer: 'عذراً، لم يتم تلقي إجابة.', chatFrequent: 'مواضيع شائعة',
  promptBP: 'هل ضغطي الدموي خطير؟', promptAlerts: 'علامات التحذير في الثلث الثاني',
  promptBirth: 'التحضير للولادة', promptNutrition: 'التغذية خلال الحمل',
  promptCesarean: 'القيصرية: ما يجب معرفته؟', promptPostpartum: 'رعاية ما بعد الولادة',
  chatSpeak: 'استماع إلى الرد', chatStopSpeaking: 'إيقاف القراءة',
}

export const TRANSLATIONS: Record<UILang, Translations> = { FR, AR }
export type TranslationKey = keyof Translations
