from langchain_core.messages import SystemMessage, HumanMessage

SYSTEM_FR = """\
Tu es une assistante médicale spécialisée en soins prénataux pour les femmes enceintes au Maroc.
Réponds en français de manière claire, bienveillante et rassurante.
Fournis des informations précises et fondées sur les recommandations de l'OMS concernant la grossesse et les soins prénataux.
Rappelle toujours à la patiente de consulter son médecin ou sa sage-femme pour tout conseil médical personnalisé.
{patient_section}{alert_section}{rag_section}"""

SYSTEM_AR = """\
أنت مساعدة طبية متخصصة في رعاية الحوامل في المغرب.
أجيبي بالعربية أو الدارجة المغربية بحسب لغة السؤال.
قدمي معلومات دقيقة وآمنة حول الحمل والرعاية السابقة للولادة استناداً إلى إرشادات منظمة الصحة العالمية.
تذكري دائماً المرأة بضرورة استشارة طبيبها أو قابلتها للحصول على مشورة طبية شخصية.
{patient_section}{alert_section}{rag_section}"""

SYSTEM_AMAZIGH = """\
D anelmad aselkim i tɣuri n tmeɣra deg Lmɣrib.
Err tirrit s tmaziɣt.
Fk talɣut tameqqrant d taɣellist ɣef tmeɣra, siɣef isental n tɣawsiwin n WHO.
Ẓer tabibat-ik akken ad d-yaɣ tiririt taselkimt.
{patient_section}{alert_section}{rag_section}"""


def _is_arabic(language: str) -> bool:
    return language.lower() in ("ar", "arabic", "darija")


def _get_system_template(language: str) -> str:
    lang = language.lower()
    if lang in ("ar", "arabic", "darija"):
        return SYSTEM_AR
    if lang in ("amazigh", "tamazight"):
        return SYSTEM_AMAZIGH
    return SYSTEM_FR


def build_messages(x: dict) -> list:
    language = x.get("language", "fr")
    system_content = _get_system_template(language).format(
        patient_section=format_patient_section(x.get("patient_context"), language),
        alert_section=format_alert_section(x.get("alert_context"), language),
        rag_section=format_rag_section(x.get("rag_context", ""), language),
    )
    return [SystemMessage(content=system_content), HumanMessage(content=x["question"])]


def format_patient_section(ctx: dict | None, language: str) -> str:
    if not ctx:
        return ""
    ar = _is_arabic(language)
    none_val = "غير محدد" if ar else "non renseigné"
    none_f = "لا شيء" if ar else "aucun"

    week = ctx.get("pregnancy_week")
    week_str = (f"{week} {'أسبوع' if ar else 'SA'}") if week is not None else none_val
    due = ctx.get("due_date") or none_val
    blood = ctx.get("blood_type") or none_val
    weight = ctx.get("weight")
    height = ctx.get("height")
    w_str = f"{weight} kg" if weight else none_val
    h_str = f"{height} cm" if height else none_val
    bmi = _bmi(weight, height)
    g = ctx.get("number_of_previous_pregnancies")
    p = ctx.get("number_of_children")
    gp = (("G" + str(g) if g is not None else "G?") + " " + ("P" + str(p) if p is not None else "P?")) \
        if (g is not None or p is not None) else none_val
    multiple = ctx.get("multiple_pregnancy")
    multi_str = (("نعم" if ar else "Oui") if multiple else ("لا" if ar else "Non")) \
        if multiple is not None else none_val
    follow_up = ctx.get("follow_up_type") or none_val
    supplements = ctx.get("supplements") or []
    suppl_str = ", ".join(supplements) if supplements else none_f
    history = ctx.get("medical_history") or none_f
    allergies = ctx.get("allergies") or none_f

    if ar:
        return f"""
--- ملف المريضة ---
أسبوع الحمل : {week_str} | تاريخ الولادة المتوقع : {due}
فصيلة الدم : {blood}
الوزن : {w_str} | الطول : {h_str} | مؤشر كتلة الجسم : {bmi}
عدد الحمل السابقة / الأطفال : {gp}
حمل متعدد : {multi_str}
نوع المتابعة الطبية : {follow_up}
المكملات الغذائية : {suppl_str}
التاريخ الطبي : {history}
الحساسية : {allergies}
"""
    return f"""
--- Profil de la patiente ---
Semaine de grossesse : {week_str} | DPA : {due}
Groupe sanguin : {blood}
Poids : {w_str} | Taille : {h_str} | IMC : {bmi}
Gestité / Parité : {gp}
Grossesse multiple : {multi_str}
Suivi médical : {follow_up}
Suppléments pris : {suppl_str}
Antécédents médicaux : {history}
Allergies : {allergies}
"""


def format_alert_section(ctx: dict | None, language: str) -> str:
    if not ctx or not ctx.get("has_red_alert"):
        return ""
    ar = _is_arabic(language)
    date = ctx.get("alert_date", "récemment")
    bp = f"{ctx['systolic_bp']}/{ctx['diastolic_bp']} mmHg" if ctx.get("systolic_bp") else "—"
    temp = f"{ctx['temperature']}°C" if ctx.get("temperature") else "—"
    hr = f"{ctx['heart_rate']} bpm" if ctx.get("heart_rate") else "—"
    sugar = f"{ctx['blood_sugar']} mmol/L" if ctx.get("blood_sugar") else "—"
    if ar:
        return f"""
⚠️ تحذير عاجل : سُجِّل تنبيه أحمر بتاريخ {date}.
ضغط الدم : {bp} | الحرارة : {temp} | نبضات القلب : {hr} | السكر : {sugar}
أخبريها بالتوجه فوراً إلى الطبيب أو المستشفى إذا استمر أي من هذه الأعراض.
"""
    return f"""
⚠️ ALERTE ROUGE enregistrée le {date} :
TA : {bp} | Température : {temp} | FC : {hr} | Glycémie : {sugar}
Oriente-la immédiatement vers son médecin ou les urgences obstétricales si ces symptômes persistent.
"""


def format_rag_section(context: str, language: str) -> str:
    if not context:
        return ""
    if _is_arabic(language):
        return f"\n\n--- معلومات طبية مرجعية ---\n{context}\n"
    return f"\n\n--- Documentation médicale de référence ---\n{context}\n"


def _bmi(weight: float | None, height: float | None) -> str:
    if not weight or not height or height == 0:
        return "—"
    return f"{weight / (height / 100) ** 2:.1f}"