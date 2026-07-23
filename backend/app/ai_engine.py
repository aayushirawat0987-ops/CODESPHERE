"""
Claude AI Triage Reasoning Engine (Python Backend - Bilingual EN/HI)
--------------------------------------------------------------------
Uses Anthropic's Claude API or local dynamic multi-symptom engine fallback.
Generates BOTH detailed clinical rationale for staff AND simple, reassuring explanations for patients
in English and Hindi (Devanagari script) with zero unnecessary medical jargon.
"""

import json
import re
import logging
from typing import Dict, Any, List
import anthropic

from app.config import ANTHROPIC_API_KEY, CLAUDE_MODEL
from app.models import PatientIntake, TriageReasoning

logger = logging.getLogger("triage_ai")

SYSTEM_PROMPT = """You are Vitalis, an AI Clinical Intake Decision-Support Assistant for hospital ER and Urgent Care triage staff and patients.
Your role is to dynamically analyze ANY combination of patient symptoms, vital sign anomalies, age, pain levels, medical history, and clinical inputs without limiting your assessment to predefined conditions.

IMPORTANT CONSTRAINTS & CLINICAL GUIDELINES:
1. THIS IS A CLINICAL DECISION-SUPPORT TOOL, NOT A MEDICAL DIAGNOSIS. Never state a definitive medical diagnosis.
2. ALWAYS use safe, non-definitive clinical language such as "may indicate", "suggests the possibility of", "requires evaluation for", "could present risk of", or "warrants clinical screening for".
3. Assess urgency score strictly on a scale of 1 to 10:
   - 1-3: Low Urgency / Non-Urgent
   - 4-7: Moderate Urgency
   - 8-10: High / Critical Urgency

4. DUAL AUDIENCE OUTPUT FORMAT:
   - CLINICIAN MODE: Provide detailed professional clinical rationale, extracted symptoms, vital sign anomalies, red flags, and recommended department.
   - PATIENT MODE (English & Hindi): Provide short, simple, reassuring explanations using everyday language with ZERO medical jargon. Explain what was observed and what the patient should do next using bullet points.

5. You MUST reply ONLY with a raw, valid JSON object matching this EXACT schema:
{
  "urgency_score": <integer 1 to 10>,
  "extracted_symptoms": [<string>, ...],
  "symptom_urgency_contributions": [<string>, ...],
  "possible_clinical_concerns": [<string>, ...],
  "recommended_department": "<string>",
  "recommended_next_steps": [<string>, ...],
  "red_flags": [<string>, ...],
  "confidence_level": "High" | "Medium" | "Low",
  "rationale": "<technical clinical rationale in English>",
  "clinician_rationale_hi": "<technical clinical rationale in Hindi>",
  "patient_summary_en": "<simple, reassuring explanation in English for elderly/non-medical patients>",
  "patient_summary_hi": "<simple, reassuring explanation in Hindi in Devanagari script for non-medical patients>",
  "patient_next_steps_en": ["<simple action step 1>", "<simple action step 2>"],
  "patient_next_steps_hi": ["<simple action step 1 in Hindi>", "<simple action step 2 in Hindi>"],
  "disclaimer": "Clinical Decision Support Only - Not a Medical Diagnosis"
}
6. Do NOT include any markdown formatting, preambles, explanations, or commentary outside of the raw JSON object.
"""

CLINICAL_DICTIONARY = [
    {
        "name": "Chest Pain / Pressure",
        "keywords": ["chest pain", "chest pressure", "substernal", "angina", "tightness in chest", "squeezing chest", "chest discomfort", "chest"],
        "scoreAdd": 4,
        "dept": "Cardiology / Emergency Department",
        "concerns": ["May indicate Acute Coronary Syndrome (ACS) or Myocardial Ischemia", "Suggests possibility of Pericarditis or Angina Pectoris"],
        "steps": ["Stat 12-lead ECG", "Cardiac biomarker panel (Troponin I/T)", "Continuous telemetry monitoring"],
        "patientEn": "You may have a heart-related problem. Please visit the emergency department as soon as possible and avoid any physical exertion.",
        "patientHi": "आपको दिल से जुड़ी समस्या हो सकती है। कृपया जल्द से जल्द अस्पताल के आपातकालीन (इमरजेंसी) विभाग में जाएं और कोई शारीरिक मेहनत न करें।",
        "patientStepsEn": ["Please report to the emergency room immediately.", "Sit down, rest quietly, and stay calm."],
        "patientStepsHi": ["कृपया तुरंत इमरजेंसी कक्ष में रिपोर्ट करें।", "शांति से बैठें, आराम करें और शांत रहें।"]
    },
    {
        "name": "Shortness of Breath / Respiratory Distress",
        "keywords": ["shortness of breath", "breathlessness", "difficulty breathing", "dyspnea", "wheezing", "gasping", "stridor", "can't breathe", "suffocating", "breath"],
        "scoreAdd": 3,
        "dept": "Emergency Respiratory / Critical Care",
        "concerns": ["May indicate Acute Respiratory Distress or Asthma Exacerbation", "Suggests possibility of Pneumonia or Pulmonary Embolism"],
        "steps": ["Immediate Pulse Oximetry (SpO2) check", "Supplemental oxygen administration", "Chest Radiograph (X-Ray) / ABG"],
        "patientEn": "You are having trouble breathing normally. Our medical team needs to check your oxygen level and help you breathe comfortably.",
        "patientHi": "आपको सांस लेने में तकलीफ हो रही है। हमारी मेडिकल टीम को आपके ऑक्सीजन स्तर की जांच करने और आराम से सांस लेने में मदद करने की आवश्यकता है।",
        "patientStepsEn": ["Sit upright in a comfortable position.", "Take slow, gentle breaths."],
        "patientStepsHi": ["आरामदायक स्थिति में सीधे बैठें।", "धीरे-धीरे और आराम से सांस लें।"]
    },
    {
        "name": "Fever / Hyperthermia",
        "keywords": ["fever", "high temperature", "pyrexia", "chills", "febrile", "burning up", "hot flashes", "feverish"],
        "scoreAdd": 2,
        "dept": "Internal Medicine / Infectious Disease",
        "concerns": ["May indicate Systemic Viral or Bacterial Infection", "Suggests possibility of Sepsis when presenting with tachycardia"],
        "steps": ["Full blood count (CBC) with differential", "Blood cultures and urinalysis", "Antipyretic administration"],
        "patientEn": "Your body temperature is higher than normal, which means your body is fighting off an infection. Drink plenty of water and rest.",
        "patientHi": "आपके शरीर का तापमान सामान्य से अधिक है, जिसका मतलब है कि आपका शरीर किसी संक्रमण से लड़ रहा है। भरपूर पानी पीएं और आराम करें।",
        "patientStepsEn": ["Drink plenty of fluids and water.", "Rest in a cool, comfortable room."],
        "patientStepsHi": ["भरपूर मात्रा में पानी और तरल पदार्थ पीएं।", "ठंडे और आरामदायक कमरे में आराम करें।"]
    },
    {
        "name": "Headache / Migraine",
        "keywords": ["headache", "migraine", "head pain", "throbbing head", "cephalea", "temple pain", "pounding head", "headache"],
        "scoreAdd": 2,
        "dept": "Neurology / Urgent Care",
        "concerns": ["May indicate Severe Vascular Migraine or Tension Cephalea", "Suggests possibility of Elevated Intracranial Pressure"],
        "steps": ["Targeted neurological screen", "Blood pressure assessment", "Analgesic protocol administration"],
        "patientEn": "You are experiencing a strong headache. A doctor will evaluate you to make sure you get the right pain relief.",
        "patientHi": "आपको तेज़ सिरदर्द हो रहा है। डॉक्टर आपकी जांच करेंगे ताकि आपको दर्द से सही राहत मिल सके।",
        "patientStepsEn": ["Rest in a quiet, dim room.", "Stay hydrated by drinking water."],
        "patientStepsHi": ["शांत और हल्के अंधेरे कमरे में आराम करें।", "पानी पीकर शरीर में पानी की कमी न होने दें।"]
    },
    {
        "name": "Dizziness / Vertigo / Syncope",
        "keywords": ["dizziness", "dizzy", "vertigo", "lightheaded", "fainting", "fainted", "syncope", "passed out", "unsteady", "off balance"],
        "scoreAdd": 2,
        "dept": "Neurology / Emergency Department",
        "concerns": ["May indicate Orthostatic Hypotension or Benign Paroxysmal Positional Vertigo", "Suggests possibility of Cardiac Arrhythmia or TIA"],
        "steps": ["Orthostatic vital signs check", "ECG screening", "Neurological balance testing"],
        "patientEn": "You are feeling dizzy or lightheaded. Please sit or lie down right away to prevent falling.",
        "patientHi": "आपको चक्कर आ रहे हैं या सिर हल्का महसूस हो रहा है। गिरने से बचने के लिए कृपया तुरंत बैठ जाएं या लेट जाएं।",
        "patientStepsEn": ["Sit or lie down immediately.", "Avoid standing up quickly."],
        "patientStepsHi": ["तुरंत बैठ जाएं या लेट जाएं।", "अचानक जल्दी से खड़े होने से बचें।"]
    },
    {
        "name": "Vomiting / Nausea",
        "keywords": ["vomiting", "vomit", "nausea", "nauseous", "throwing up", "emesis", "retching"],
        "scoreAdd": 2,
        "dept": "Gastroenterology / Urgent Care",
        "concerns": ["May indicate Acute Gastroenteritis or Gastric Intolerance", "Suggests possibility of Dehydration & Electrolyte Imbalance"],
        "steps": ["Hydration status assessment", "Antiemetic therapy administration", "Abdominal physical palpation"],
        "patientEn": "Your stomach is upset and you are throwing up. Taking small sips of water will help prevent dehydration.",
        "patientHi": "आपका पेट खराब है और आपको उल्टी हो रही है। पानी के छोटे-छोटे घूंट लेने से शरीर में पानी की कमी नहीं होगी।",
        "patientStepsEn": ["Take small sips of clean water or oral rehydration fluids.", "Rest quietly."],
        "patientStepsHi": ["साफ़ पानी या ओआरएस (ORS) के छोटे-छोटे घूंट लें।", "शांति से आराम करें।"]
    },
    {
        "name": "Abdominal Pain / Stomach Ache",
        "keywords": ["abdominal pain", "belly pain", "stomach ache", "stomach pain", "cramping", "rlq pain", "luq pain", "epigastric", "stomach"],
        "scoreAdd": 2,
        "dept": "General Surgery / Gastroenterology",
        "concerns": ["May indicate Acute Appendicitis or Cholecystitis", "Suggests possibility of Peptic Ulcer Disease or Diverticulitis"],
        "steps": ["Abdominal ultrasound or CT scan", "NPO status protocol", "Targeted abdominal palpation"],
        "patientEn": "You have belly pain that needs to be examined by a healthcare provider to find out the exact cause.",
        "patientHi": "आपके पेट में दर्द है जिसकी सही वजह जानने के लिए स्वास्थ्य देखभाल प्रदाता द्वारा जांच की जानी चाहिए।",
        "patientStepsEn": ["Avoid eating heavy meals until evaluated.", "Rest in a comfortable position."],
        "patientStepsHi": ["जांच होने तक भारी भोजन खाने से बचें।", "आरामदायक स्थिति में लेटे रहें।"]
    },
    {
        "name": "Skin Rash / Hives / Swelling",
        "keywords": ["rash", "hives", "skin redness", "itching", "pruritus", "urticaria", "facial swelling", "lip swelling", "edema"],
        "scoreAdd": 2,
        "dept": "Dermatology / Allergy & Immunology",
        "concerns": ["May indicate Dermatitis or Allergic Cutaneous Reaction", "Suggests possibility of Impending Anaphylaxis if facial swelling is present"],
        "steps": ["Airway and breathing assessment", "Antihistamine / Steroid protocol", "Allergen exposure history review"],
        "patientEn": "We noticed skin irritation or swelling. If you feel any tightness in your throat or difficulty breathing, tell a nurse immediately.",
        "patientHi": "हमने आपकी त्वचा पर लालिमा या सूजन देखी है। यदि आपको गले में जकड़न या सांस लेने में परेशानी महसूस हो, तो तुरंत नर्स को बताएं।",
        "patientStepsEn": ["Do not scratch irritated skin.", "Alert medical staff if swelling increases or breathing changes."],
        "patientStepsHi": ["त्वचा की खुजली न खरोंचें।", "यदि सूजन बढ़े या सांस में बदलाव हो तो तुरंत कर्मचारियों को सूचित करें।"]
    },
    {
        "name": "Trauma / Fractures / Bleeding",
        "keywords": ["trauma", "fracture", "broken bone", "bleeding", "hemorrhage", "cut", "laceration", "fall", "wound", "accident", "contusion"],
        "scoreAdd": 3,
        "dept": "Trauma Center / Orthopedics",
        "concerns": ["May indicate Musculoskeletal Fracture or Deep Laceration", "Suggests possibility of Active Hemorrhage"],
        "steps": ["Radiographic X-Ray / CT imaging", "Hemostasis and direct pressure", "Neurovascular distal status check"],
        "patientEn": "You have an injury or bleeding that requires prompt medical care and imaging.",
        "patientHi": "आपको चोट लगी है या खून बह रहा है जिसके लिए तुरंत चिकित्सकीय देखभाल और एक्स-रे की आवश्यकता है।",
        "patientStepsEn": ["Keep the injured area still and supported.", "Apply clean pressure if bleeding."],
        "patientStepsHi": ["चोट वाली जगह को स्थिर रखें।", "यदि खून बह रहा हो तो साफ़ कपड़े से दबाव बनाएं।"]
    }
]

def extract_json_from_text(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        text = text[start_idx : end_idx + 1]
    return text.strip()


def mock_triage_fallback(intake: PatientIntake, reason: str = "Fallback AI Reasoning") -> TriageReasoning:
    complaint_str = intake.complaint.lower() if intake.complaint else ""
    history_str = intake.medical_history.lower() if intake.medical_history else ""
    vitals = intake.vitals
    pain_scale = intake.pain_scale or 1
    age = intake.age

    extracted_symptoms = []
    urgency_contributions = []
    possible_concerns = []
    recommended_steps = []
    red_flags = []
    departments = set()

    score = 2
    primary_match = None

    for item in CLINICAL_DICTIONARY:
        matched = [kw for kw in item["keywords"] if kw in complaint_str]
        if matched:
            if not primary_match:
                primary_match = item
            extracted_symptoms.append(item["name"])
            score += item["scoreAdd"]
            urgency_contributions.append(f"{item['name']} (+{item['scoreAdd']} urgency score)")
            departments.add(item["dept"])
            possible_concerns.extend(item["concerns"])
            recommended_steps.extend(item["steps"])

    if not extracted_symptoms:
        if complaint_str.strip():
            extracted_symptoms.append(intake.complaint.strip())
        else:
            extracted_symptoms.append("Generalized Clinical Complaint")
        urgency_contributions.append("Symptom presentation requires clinical intake assessment (+2 urgency)")
        possible_concerns.append("May indicate non-specific illness or localized discomfort")
        possible_concerns.append("Requires clinical evaluation for accurate triage classification")
        departments.add("General Triage / Outpatient Clinic")
        recommended_steps.append("Perform primary clinical history and physical examination")
        recommended_steps.append("Obtain complete set of vital signs")

    if pain_scale >= 8:
        score = max(score + 3, 7)
        urgency_contributions.append(f"Severe acute pain level reported ({pain_scale}/10) (+3 score factor)")
        red_flags.append(f"Severe acute pain reported ({pain_scale}/10)")
        recommended_steps.append("Initiate acute pain management protocol")
    elif pain_scale >= 6:
        score = max(score + 2, 5)
        urgency_contributions.append(f"Moderate-to-high pain score ({pain_scale}/10) (+2 score factor)")
    elif pain_scale >= 4:
        score = max(score + 1, 4)
        urgency_contributions.append(f"Moderate pain score ({pain_scale}/10) (+1 score factor)")

    if vitals:
        if vitals.heart_rate:
            hr = vitals.heart_rate
            if hr > 120 and vitals.temperature and vitals.temperature > 101.0:
                score += 2
                urgency_contributions.append(f"Tachycardia ({hr} bpm) combined with Fever ({vitals.temperature}°F) (+2 score: Sepsis Risk)")
                red_flags.append(f"🚨 SAFETY ALERT: High HR ({hr} bpm) + Fever ({vitals.temperature}°F) indicates potential Sepsis")
                possible_concerns.append("Suggests high risk of Systemic Inflammatory Response / Sepsis")
                recommended_steps.append("Draw blood cultures x 2 and serum lactate stat")
            elif hr >= 120:
                score += 1
                urgency_contributions.append(f"Elevated resting heart rate ({hr} bpm) (+1 score)")
                red_flags.append(f"Resting Tachycardia detected ({hr} bpm)")
            elif hr < 50:
                score += 2
                urgency_contributions.append(f"Bradycardia ({hr} bpm) (+2 score)")
                red_flags.append(f"Sinus Bradycardia detected ({hr} bpm)")

        if vitals.temperature and vitals.temperature >= 103.0:
            score += 2
            urgency_contributions.append(f"Severe High Fever ({vitals.temperature}°F) (+2 score)")
            red_flags.append(f"Hyperpyrexia alert (Temperature: {vitals.temperature}°F)")

        if vitals.blood_pressure and "/" in vitals.blood_pressure:
            try:
                parts = vitals.blood_pressure.split("/")
                sys = int(parts[0].strip())
                dia = int(parts[1].strip())
                if sys >= 180 or dia >= 120:
                    score += 2
                    urgency_contributions.append(f"Hypertensive Crisis Blood Pressure ({vitals.blood_pressure}) (+2 score)")
                    red_flags.append(f"🚨 SAFETY ALERT: Hypertensive Crisis Threshold (BP: {vitals.blood_pressure})")
                    possible_concerns.append("May indicate Hypertensive Emergency / Target Organ Damage")
                elif sys < 90 or dia < 60:
                    score += 2
                    urgency_contributions.append(f"Hypotension ({vitals.blood_pressure}) (+2 score)")
                    red_flags.append(f"Hypotensive state detected (BP: {vitals.blood_pressure})")
                    possible_concerns.append("Suggests possibility of Circulatory Volume Depletion or Shock")
            except Exception:
                pass

    if age is not None:
        if age >= 65:
            score += 1
            urgency_contributions.append(f"Geriatric patient age ({age} y/o) (+1 score factor)")
        elif age <= 2:
            score += 1
            urgency_contributions.append(f"Infant age group ({age} y/o) (+1 score factor)")

    if history_str:
        if any(k in history_str for k in ["heart", "cardiac", "stroke", "diabetes", "asthma", "copd", "cancer"]):
            score += 1
            urgency_contributions.append(f"Significant medical history of ({intake.medical_history}) (+1 risk factor)")

    score = min(10, max(1, score))

    unique_concerns = list(dict.fromkeys(possible_concerns))[:4]
    unique_steps = list(dict.fromkeys(recommended_steps))[:4]
    primary_dept = list(departments)[0] if departments else "Emergency Department"

    if not red_flags:
        red_flags.append("Standard clinical monitoring and routine vitals screening recommended")

    pat_summary_en = primary_match["patientEn"] if primary_match else f'You reported feeling: "{intake.complaint}". Our healthcare team is reviewing your symptoms to provide care.'
    pat_summary_hi = primary_match["patientHi"] if primary_match else f'आपने बताया कि आप महसूस कर रहे हैं: "{intake.complaint}"। हमारी मेडिकल टीम आपकी जांच कर रही है।'
    pat_next_en = primary_match["patientStepsEn"] if primary_match else ["Please rest quietly until called by the medical team.", "Tell a nurse if your pain gets worse."]
    pat_next_hi = primary_match["patientStepsHi"] if primary_match else ["कृपया मेडिकल टीम द्वारा बुलाए जाने तक आराम से बैठें।", "यदि दर्द बढ़े तो नर्स को सूचित करें।"]

    if vitals and vitals.heart_rate and vitals.heart_rate > 110:
        pat_summary_en += " Your heartbeat is faster than normal."
        pat_summary_hi += " आपकी धड़कन सामान्य से तेज़ है।"
    if vitals and vitals.temperature and vitals.temperature > 100.4:
        pat_summary_en += " You also have a fever."
        pat_summary_hi += " आपको बुखार भी है।"

    rationale = f"Patient presents with an urgency score of {score}/10 based on identified symptoms ({', '.join(extracted_symptoms)}) and pain level {pain_scale}/10. Input parameters suggest potential clinical risk factors that require tailored evaluation."
    clinician_rationale_hi = f"मरीज़ का तात्कालिकता स्कोर {score}/10 है जो प्राथमिक लक्षणों ({', '.join(extracted_symptoms)}) और दर्द स्तर {pain_scale}/10 पर आधारित है।"

    return TriageReasoning(
        urgency_score=score,
        extracted_symptoms=extracted_symptoms,
        symptom_urgency_contributions=urgency_contributions,
        possible_clinical_concerns=unique_concerns,
        recommended_department=primary_dept,
        recommended_next_steps=unique_steps,
        red_flags=red_flags,
        confidence_level="High" if len(extracted_symptoms) > 1 else "Medium",
        rationale=rationale,
        clinician_rationale_hi=clinician_rationale_hi,
        patient_summary_en=pat_summary_en,
        patient_summary_hi=pat_summary_hi,
        patient_next_steps_en=pat_next_en,
        patient_next_steps_hi=pat_next_hi,
        disclaimer="Clinical Decision Support Only - Not a Medical Diagnosis"
    )


def evaluate_patient_ai(intake: PatientIntake) -> TriageReasoning:
    if not ANTHROPIC_API_KEY:
        logger.info("No ANTHROPIC_API_KEY set. Operating in local multi-symptom decision engine mode.")
        return mock_triage_fallback(intake)

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        
        vitals_text = "Not provided"
        if intake.vitals:
            v_parts = []
            if intake.vitals.heart_rate: v_parts.append(f"Heart Rate: {intake.vitals.heart_rate} bpm")
            if intake.vitals.temperature: v_parts.append(f"Temperature: {intake.vitals.temperature}°F")
            if intake.vitals.blood_pressure: v_parts.append(f"Blood Pressure: {intake.vitals.blood_pressure}")
            if v_parts: vitals_text = ", ".join(v_parts)

        age_text = f"{intake.age} years old" if intake.age else "Not provided"
        gender_text = intake.gender if intake.gender else "Not provided"
        history_text = intake.medical_history if intake.medical_history else "None reported"
        allergies_text = intake.allergies if intake.allergies else "None reported"
        meds_text = intake.current_medications if intake.current_medications else "None reported"

        user_content = f"""Patient Intake Details:
- Name: {intake.name}
- Age: {age_text}
- Gender: {gender_text}
- Chief Complaint: {intake.complaint}
- Pain Scale: {intake.pain_scale}/10
- Vital Signs: {vitals_text}
- Past Medical History: {history_text}
- Allergies: {allergies_text}
- Current Medications: {meds_text}

Analyze ALL entered symptoms and vitals. Return JSON triage decision-support object following the system instructions. Include simple, reassuring patient-friendly explanations in English and Hindi."""

        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=800,
            system=SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": user_content}
            ]
        )

        response_text = response.content[0].text
        clean_json_str = extract_json_from_text(response_text)
        data = json.loads(clean_json_str)

        score = int(data.get("urgency_score", 5))
        score = min(10, max(1, score))

        return TriageReasoning(
            urgency_score=score,
            extracted_symptoms=data.get("extracted_symptoms") if isinstance(data.get("extracted_symptoms"), list) else [intake.complaint],
            symptom_urgency_contributions=data.get("symptom_urgency_contributions") if isinstance(data.get("symptom_urgency_contributions"), list) else [f"Complaint: {intake.complaint}"],
            possible_clinical_concerns=data.get("possible_clinical_concerns") if isinstance(data.get("possible_clinical_concerns"), list) else ["Requires clinical evaluation"],
            recommended_department=data.get("recommended_department") or "General Triage",
            recommended_next_steps=data.get("recommended_next_steps") if isinstance(data.get("recommended_next_steps"), list) else ["Complete triage screening"],
            red_flags=data.get("red_flags") if isinstance(data.get("red_flags"), list) else [],
            confidence_level=data.get("confidence_level") or "High",
            rationale=data.get("rationale") or "Patient intake evaluation completed.",
            clinician_rationale_hi=data.get("clinician_rationale_hi") or data.get("rationale") or "मरीज़ का मूल्यांकन पूरा हो गया है।",
            patient_summary_en=data.get("patient_summary_en") or f'You reported feeling: "{intake.complaint}". Our healthcare team is reviewing your symptoms to provide care.',
            patient_summary_hi=data.get("patient_summary_hi") or f'आपने बताया कि आप महसूस कर रहे हैं: "{intake.complaint}"। हमारी मेडिकल टीम आपकी जांच कर रही है।',
            patient_next_steps_en=data.get("patient_next_steps_en") if isinstance(data.get("patient_next_steps_en"), list) else ["Please rest quietly until called by the medical team."],
            patient_next_steps_hi=data.get("patient_next_steps_hi") if isinstance(data.get("patient_next_steps_hi"), list) else ["कृपया डॉक्टर द्वारा बुलाए जाने तक आराम से बैठें।"],
            disclaimer="Clinical Decision Support Only - Not a Medical Diagnosis"
        )

    except Exception as e:
        logger.warning(f"Claude API evaluation error: {e}. Falling back to local engine.")
        return mock_triage_fallback(intake)
