"""
Claude AI Triage Reasoning Engine (Python Backend)
--------------------------------------------------
Uses Anthropic's Claude API or local dynamic multi-symptom engine fallback.
Dynamically analyzes ANY combination of symptoms, vitals, history, and voice inputs.
Enforces strict JSON schema with safe non-definitive clinical decision support phrasing.
"""

import json
import re
import logging
from typing import Dict, Any, List
import anthropic

from app.config import ANTHROPIC_API_KEY, CLAUDE_MODEL
from app.models import PatientIntake, TriageReasoning

logger = logging.getLogger("triage_ai")

SYSTEM_PROMPT = """You are Vitalis, an AI Clinical Intake Decision-Support Assistant for hospital ER and Urgent Care triage staff.
Your role is to dynamically analyze ANY combination of patient symptoms, vital sign anomalies, age, pain levels, medical history, and clinical inputs without limiting your assessment to predefined conditions.

IMPORTANT CONSTRAINTS & CLINICAL GUIDELINES:
1. THIS IS A CLINICAL DECISION-SUPPORT TOOL, NOT A MEDICAL DIAGNOSIS. Never state a definitive medical diagnosis.
2. ALWAYS use safe, non-definitive clinical language such as "may indicate", "suggests the possibility of", "requires evaluation for", "could present risk of", or "warrants clinical screening for".
3. Assess urgency score strictly on a scale of 1 to 10:
   - 1-3: Low Urgency / Non-Urgent (minor localized complaints, mild cold symptoms, routine checks)
   - 4-7: Moderate Urgency (moderate pain, persistent fever, minor fractures, GI symptoms, respiratory distress without hypoxia)
   - 8-10: High / Critical Urgency (chest pain, acute neurological deficits, severe respiratory distress, acute trauma, sepsis risk, altered consciousness)
4. Extract ALL symptoms present in the complaint and profile, explain how each symptom/vital contributes to the urgency score, list ALL relevant possible clinical concerns (multi-item differential), suggest the most appropriate hospital department, and provide recommended next steps.
5. You MUST reply ONLY with a raw, valid JSON object matching this EXACT schema:
{
  "urgency_score": <integer 1 to 10>,
  "extracted_symptoms": [<string>, <string>, ...],
  "symptom_urgency_contributions": [<string>, ...],
  "possible_clinical_concerns": [<string>, ...],
  "recommended_department": "<string>",
  "recommended_next_steps": [<string>, ...],
  "red_flags": [<string>, ...],
  "confidence_level": "High" | "Medium" | "Low",
  "rationale": "<2-3 sentence clinical rationale using safe non-definitive language>",
  "disclaimer": "Clinical Decision Support Only - Not a Medical Diagnosis"
}
6. Do NOT include any markdown formatting, preambles, explanations, or commentary outside of the raw JSON object.
"""

CLINICAL_DICTIONARY = [
    {
        "name": "Chest Pain / Pressure",
        "keywords": ["chest pain", "chest pressure", "substernal", "angina", "tightness in chest", "squeezing chest", "chest discomfort"],
        "scoreAdd": 4,
        "dept": "Cardiology / Emergency Department",
        "concerns": ["May indicate Acute Coronary Syndrome (ACS) or Myocardial Ischemia", "Suggests possibility of Pericarditis or Angina Pectoris", "Requires evaluation for Aortic Dissection or Pulmonary Embolism"],
        "steps": ["Stat 12-lead ECG", "Cardiac biomarker panel (Troponin I/T)", "Continuous telemetry monitoring"]
    },
    {
        "name": "Shortness of Breath / Respiratory Distress",
        "keywords": ["shortness of breath", "breathlessness", "difficulty breathing", "dyspnea", "wheezing", "gasping", "stridor", "can't breathe", "suffocating"],
        "scoreAdd": 3,
        "dept": "Emergency Respiratory / Critical Care",
        "concerns": ["May indicate Acute Respiratory Distress or Asthma Exacerbation", "Suggests possibility of Pneumonia or COPD Exacerbation", "Requires evaluation for Pulmonary Edema or Airway Compromise"],
        "steps": ["Immediate Pulse Oximetry (SpO2) check", "Supplemental oxygen administration", "Chest Radiograph (X-Ray) / ABG"]
    },
    {
        "name": "Fever / Hyperthermia",
        "keywords": ["fever", "high temperature", "pyrexia", "chills", "febrile", "burning up", "hot flashes"],
        "scoreAdd": 2,
        "dept": "Internal Medicine / Infectious Disease",
        "concerns": ["May indicate Systemic Viral or Bacterial Infection", "Suggests possibility of Sepsis when presenting with tachycardia", "Requires evaluation for Inflammatory or Infectious Source"],
        "steps": ["Full blood count (CBC) with differential", "Blood cultures and urinalysis", "Antipyretic administration"]
    },
    {
        "name": "Headache / Migraine",
        "keywords": ["headache", "migraine", "head pain", "throbbing head", "cephalea", "temple pain", "pounding head"],
        "scoreAdd": 2,
        "dept": "Neurology / Urgent Care",
        "concerns": ["May indicate Severe Vascular Migraine or Tension Cephalea", "Suggests possibility of Elevated Intracranial Pressure", "Requires evaluation for Meningitis if neck stiffness is present"],
        "steps": ["Targeted neurological screen", "Blood pressure assessment", "Analgesic protocol administration"]
    },
    {
        "name": "Dizziness / Vertigo / Syncope",
        "keywords": ["dizziness", "dizzy", "vertigo", "lightheaded", "fainting", "fainted", "syncope", "passed out", "unsteady", "off balance"],
        "scoreAdd": 2,
        "dept": "Neurology / Emergency Department",
        "concerns": ["May indicate Orthostatic Hypotension or Benign Paroxysmal Positional Vertigo", "Suggests possibility of Cardiac Arrhythmia or Transient Ischemic Attack (TIA)", "Requires evaluation for Cerebellar Dysfunction or Dehydration"],
        "steps": ["Orthostatic vital signs check", "ECG screening", "Neurological balance testing"]
    },
    {
        "name": "Vomiting / Nausea",
        "keywords": ["vomiting", "vomit", "nausea", "nauseous", "throwing up", "emesis", "retching"],
        "scoreAdd": 2,
        "dept": "Gastroenterology / Urgent Care",
        "concerns": ["May indicate Acute Gastroenteritis or Gastric Intolerance", "Suggests possibility of Dehydration & Electrolyte Imbalance", "Requires evaluation for Bowel Obstruction if accompanied by distension"],
        "steps": ["Hydration status assessment", "Antiemetic therapy administration", "Abdominal physical palpation"]
    },
    {
        "name": "Diarrhea",
        "keywords": ["diarrhea", "diarrhoea", "loose stools", "watery stool"],
        "scoreAdd": 1,
        "dept": "Gastroenterology / General Medicine",
        "concerns": ["May indicate Infectious Enteritis or Dietary Intolerance", "Suggests possibility of Hypovolemia / Fluid Deficit"],
        "steps": ["Stool pathogen PCR culture", "Oral / IV rehydration therapy", "Electrolyte panel monitoring"]
    },
    {
        "name": "Abdominal Pain / Stomach Ache",
        "keywords": ["abdominal pain", "belly pain", "stomach ache", "stomach pain", "cramping", "rlq pain", "luq pain", "epigastric"],
        "scoreAdd": 2,
        "dept": "General Surgery / Gastroenterology",
        "concerns": ["May indicate Acute Appendicitis or Cholecystitis", "Suggests possibility of Peptic Ulcer Disease or Diverticulitis", "Requires evaluation for Visceral Perforation or Renal Colic"],
        "steps": ["Abdominal ultrasound or CT scan", "NPO status protocol", "Targeted abdominal palpation"]
    },
    {
        "name": "Cough / Sore Throat",
        "keywords": ["cough", "coughing", "sore throat", "pharyngitis", "throat pain", "hoarseness", "phlegm", "sputum"],
        "scoreAdd": 1,
        "dept": "Outpatient Clinic / Urgent Care",
        "concerns": ["May indicate Upper Respiratory Tract Infection (URTI)", "Suggests possibility of Streptococcal Pharyngitis or Bronchitis"],
        "steps": ["Rapid Strep / Swab testing", "Symptomatic throat lozenges / anti-inflammatories", "Auscultation of lung fields"]
    },
    {
        "name": "Back Pain / Flank Pain",
        "keywords": ["back pain", "flank pain", "lower back pain", "lumbar pain", "spine pain", "cva tenderness"],
        "scoreAdd": 2,
        "dept": "Orthopedics / Urology",
        "concerns": ["May indicate Acute Lumbar Strain or Musculoskeletal Trauma", "Suggests possibility of Nephrolithiasis (Kidney Stones) or Pyelonephritis"],
        "steps": ["Urinalysis for hematuria", "Renal tract imaging / ultrasound", "Pain relief and mobility check"]
    },
    {
        "name": "Joint Pain / Neck Pain / Muscle Pain",
        "keywords": ["joint pain", "neck pain", "stiff neck", "nuchal rigidity", "myalgia", "arthralgia", "knee pain", "shoulder pain"],
        "scoreAdd": 2,
        "dept": "Rheumatology / Neurology",
        "concerns": ["May indicate Inflammatory Arthropathy or Musculoskeletal Strain", "Suggests possibility of Meningeal Sign if presenting with nuchal rigidity"],
        "steps": ["Kernig's and Brudzinski's meningeal sign check", "Inflammatory markers (ESR, CRP)", "Joint immobilisation / analgesia"]
    },
    {
        "name": "Ear Pain / Eye Pain / Vision Changes",
        "keywords": ["ear pain", "eye pain", "blurred vision", "double vision", "otitis", "ocular pain", "photophobia", "eye redness"],
        "scoreAdd": 2,
        "dept": "Ophthalmology / ENT",
        "concerns": ["May indicate Acute Otitis Media or Corneal Abrasion", "Suggests possibility of Acute Angle-Closure Glaucoma or Optic Neuritis"],
        "steps": ["Ophthalmoscopic / Otoscopic exam", "Intraocular pressure check", "Targeted visual acuity evaluation"]
    },
    {
        "name": "Skin Rash / Hives / Swelling",
        "keywords": ["rash", "hives", "skin redness", "itching", "pruritus", "urticaria", "facial swelling", "lip swelling", "edema"],
        "scoreAdd": 2,
        "dept": "Dermatology / Allergy & Immunology",
        "concerns": ["May indicate Dermatitis or Allergic Cutaneous Reaction", "Suggests possibility of Impending Anaphylaxis if facial/lip swelling is present"],
        "steps": ["Airway and breathing assessment", "Antihistamine / Steroid protocol", "Allergen exposure history review"]
    },
    {
        "name": "Burns / Thermal Injury",
        "keywords": ["burn", "burns", "scald", "blisters", "skin singed", "thermal injury", "chemical burn"],
        "scoreAdd": 3,
        "dept": "Burn Unit / Trauma Center",
        "concerns": ["May indicate Dermal Thermal Injury requiring fluid resuscitation", "Suggests possibility of Inhalation Injury if facial burns are present"],
        "steps": ["Estimate Total Body Surface Area (TBSA)", "Sterile dressing and cooling", "Parkland formula fluid calculation"]
    },
    {
        "name": "Allergic Reaction / Anaphylaxis",
        "keywords": ["allergic reaction", "anaphylaxis", "allergy", "throat tight", "swollen tongue", "bee sting reaction"],
        "scoreAdd": 4,
        "dept": "Emergency Department / Resuscitation",
        "concerns": ["May indicate Severe Systemic Hypersensitivity / Anaphylaxis", "Suggests critical risk of Upper Airway Occlusion"],
        "steps": ["IM Epinephrine administration (stat)", "High-flow oxygen therapy", "Continuous vital airway monitoring"]
    },
    {
        "name": "Anxiety / Panic Attack / Palpitations",
        "keywords": ["anxiety", "panic attack", "palpitations", "racing heart", "hyperventilating", "nervousness", "trembling"],
        "scoreAdd": 2,
        "dept": "Psychiatry / Urgent Care",
        "concerns": ["May indicate Acute Panic Disorder or Hyperventilation Syndrome", "Suggests possibility of Cardiac Dysrhythmia presenting as anxiety"],
        "steps": ["12-lead ECG to rule out cardiac etiology", "Calm breathing re-training", "Basic metabolic panel"]
    },
    {
        "name": "Weakness / Lethargy / Fatigue",
        "keywords": ["weakness", "lethargy", "fatigue", "feeling weak", "generalized weakness", "prostration", "sluggish"],
        "scoreAdd": 2,
        "dept": "Internal Medicine / Geriatrics",
        "concerns": ["May indicate Systemic Debility or Electrolyte Imbalance", "Suggests possibility of Severe Anemia or Occult Infection"],
        "steps": ["Complete metabolic & electrolyte panel", "Hemoglobin / Hematocrit check", "Infection screening"]
    },
    {
        "name": "Loss of Consciousness / Seizures",
        "keywords": ["loss of consciousness", "unconscious", "passed out", "seizure", "convulsions", "epilepsy", "postictal", "blackout"],
        "scoreAdd": 4,
        "dept": "Neurology / Critical Care",
        "concerns": ["May indicate Status Epilepticus or Postictal State", "Suggests possibility of Intracranial Hemorrhage or Severe Hypoxia"],
        "steps": ["Airway protection and recovery position", "Stat Fingerstick Blood Glucose check", "Stat Head CT scan"]
    },
    {
        "name": "Trauma / Fractures / Bleeding",
        "keywords": ["trauma", "fracture", "broken bone", "bleeding", "hemorrhage", "cut", "laceration", "fall", "wound", "accident", "contusion"],
        "scoreAdd": 3,
        "dept": "Trauma Center / Orthopedics",
        "concerns": ["May indicate Musculoskeletal Fracture or Deep Laceration", "Suggests possibility of Active Hemorrhage or Compartment Syndrome"],
        "steps": ["Radiographic X-Ray / CT imaging", "Hemostasis and direct pressure", "Neurovascular distal status check"]
    },
    {
        "name": "Pregnancy-Related Complaints",
        "keywords": ["pregnant", "pregnancy", "spotting", "vaginal bleeding", "fetal movement", "contractions", "gestational"],
        "scoreAdd": 3,
        "dept": "Obstetrics & Gynecology (OB/GYN)",
        "concerns": ["May indicate Ectopic Pregnancy or Threatened Abortion", "Suggests possibility of Preeclampsia or Placental Abruption"],
        "steps": ["Pelvic ultrasound scan", "Bedside beta-hCG test", "Fetal heart tone auscultation"]
    },
    {
        "name": "Urinary Symptoms",
        "keywords": ["urinary", "dysuria", "burning urination", "frequent urination", "hematuria", "blood in urine", "urinary retention"],
        "scoreAdd": 2,
        "dept": "Urology / Urgent Care",
        "concerns": ["May indicate Lower Urinary Tract Infection (Cystitis)", "Suggests possibility of Acute Urinary Retention or Urolithiasis"],
        "steps": ["Urinalysis and urine dipstick", "Urine culture", "Bladder ultrasound scan if retained"]
    },
    {
        "name": "Blood Pressure / Blood Sugar Anomalies",
        "keywords": ["high blood pressure", "low blood pressure", "hypertension", "hypotension", "high blood sugar", "low blood sugar", "hyperglycemia", "hypoglycemia"],
        "scoreAdd": 3,
        "dept": "Endocrinology / Cardiology",
        "concerns": ["May indicate Hypertensive Urgency / Crisis or Hypotensive Shock", "Suggests possibility of Diabetic Ketoacidosis (DKA) or Hypoglycemic Stupor"],
        "steps": ["Serial BP monitoring", "Stat point-of-care capillary blood glucose", "Serum electrolytes and ketones"]
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

    for item in CLINICAL_DICTIONARY:
        matched = [kw for kw in item["keywords"] if kw in complaint_str]
        if matched:
            extracted_symptoms.append(item["name"])
            score += item["scoreAdd"]
            urgency_contributions.append(f"{item['name']} (+{item['scoreAdd']} urgency score)")
            departments.add(item["dept"])
            possible_concerns.extend(item["concerns"])
            recommended_steps.extend(item["steps"])

    if not extracted_symptoms:
        extracted_symptoms.append("Generalized Clinical Complaint")
        urgency_contributions.append("Unspecified symptoms require comprehensive physical intake assessment (+2 urgency)")
        possible_concerns.append("May indicate non-specific viral syndrome or localized discomfort")
        possible_concerns.append("Requires clinical evaluation for accurate triage classification")
        departments.add("General Triage / Outpatient Clinic")
        recommended_steps.append("Perform primary clinical history and physical examination")
        recommended_steps.append("Obtain complete set of vital signs")

    if pain_scale >= 8:
        score = max(score, score + 2)
        urgency_contributions.append(f"Elevated self-reported pain score ({pain_scale}/10) (+2 score)")
        red_flags.append(f"Severe acute pain level reported ({pain_scale}/10)")
        recommended_steps.append("Initiate acute pain management protocol")
    elif pain_scale >= 5:
        score = max(score, score + 1)
        urgency_contributions.append(f"Moderate pain level reported ({pain_scale}/10) (+1 score)")

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

    rationale = f"Patient presents with an urgency score of {score}/10 based on identified symptoms ({', '.join(extracted_symptoms)}) and pain level {pain_scale}/10. Input data suggests potential clinical risk factors that require tailored evaluation. ({reason})"

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
        disclaimer="Clinical Decision Support Only - Not a Medical Diagnosis"
    )


def evaluate_patient_ai(intake: PatientIntake) -> TriageReasoning:
    if not ANTHROPIC_API_KEY:
        logger.info("No ANTHROPIC_API_KEY set. Operating in local multi-symptom heuristic engine mode.")
        return mock_triage_fallback(intake, "Mock Multi-Symptom AI Engine - API Key Not Configured")

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

Analyze ALL entered symptoms and vitals. Return JSON triage decision-support object following the system instructions."""

        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=600,
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
            disclaimer="Clinical Decision Support Only - Not a Medical Diagnosis"
        )

    except Exception as e:
        logger.error(f"Claude API evaluation failed: {e}")
        return mock_triage_fallback(intake, f"AI Fallback active due to API issue: {str(e)[:150]}")
