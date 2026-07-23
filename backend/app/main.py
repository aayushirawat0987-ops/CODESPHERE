"""
Vitalis / TriageAI - FastAPI Application Entry Point
---------------------------------------------------
Clinical Decision-Support Tool backend providing AI-driven intake evaluation,
deterministic safety rule checks, staff override controls, surge queue simulation,
voice-based symptom analysis, and multi-observation facial vision diagnostics.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import time
import logging
from pydantic import BaseModel, Field

from app.models import (
    PatientIntake, PatientRecord, OverrideRequest, Vitals,
    CalendarPatientIntake, CalendarPatientRecord,
    FaceAnalysisRequest, FaceAnalysisResult
)
from app.rule_engine import evaluate_clinical_rules
from app.ai_engine import evaluate_patient_ai
from app.face_engine import evaluate_face_image
from app.storage import db, calendar_db
from app.surge_data import SURGE_PATIENTS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vitalis_backend")

app = FastAPI(
    title="Vitalis / TriageAI Backend",
    description="Hackathon MVP Decision-Support Tool for ER/Urgent Care Intake",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Vitalis TriageAI Core"}

@app.get("/api/patients", response_model=List[PatientRecord])
def get_patients():
    return db.get_all_patients()

@app.post("/api/patients", response_model=PatientRecord, status_code=201)
def process_patient_intake(intake: PatientIntake):
    logger.info(f"Processing intake for patient: {intake.name}")

    rule_res = evaluate_clinical_rules(
        vitals=intake.vitals or Vitals(),
        pain_scale=intake.pain_scale,
        complaint=intake.complaint,
        medical_history=intake.medical_history,
        age=intake.age
    )

    ai_res = evaluate_patient_ai(intake)
    record = db.add_patient(intake, ai_res, rule_res)
    return record

@app.get("/api/patients/{patient_id}", response_model=PatientRecord)
def get_patient(patient_id: str):
    record = db.get_patient(patient_id)
    if not record:
        raise HTTPException(status_code=404, detail="Patient record not found")
    return record

@app.patch("/api/patients/{patient_id}/override", response_model=PatientRecord)
def staff_override(patient_id: str, req: OverrideRequest):
    updated_record = db.apply_override(patient_id, req)
    if not updated_record:
        raise HTTPException(status_code=404, detail="Patient record not found")
    logger.info(f"Staff override applied to {patient_id}: Score set to {req.score}")
    return updated_record

def run_surge_simulation_batch():
    for p in SURGE_PATIENTS:
        vitals_raw = p.get("vitals")
        vitals_dict = vitals_raw if isinstance(vitals_raw, dict) else {}
        vitals_obj = Vitals(**vitals_dict)
        intake = PatientIntake(
            name=str(p["name"]),
            complaint=str(p["complaint"]),
            pain_scale=int(p["pain_scale"]),
            vitals=vitals_obj,
            age=p.get("age"),
            gender=p.get("gender"),
            medical_history=p.get("medical_history")
        )
        rule_res = evaluate_clinical_rules(
            vitals=vitals_obj,
            pain_scale=intake.pain_scale,
            complaint=intake.complaint,
            medical_history=intake.medical_history,
            age=intake.age
        )
        ai_res = evaluate_patient_ai(intake)
        db.add_patient(intake, ai_res, rule_res)
        time.sleep(0.4)

@app.post("/api/surge")
def trigger_surge(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_surge_simulation_batch)
    return {"status": "Surge simulation started", "patient_count": len(SURGE_PATIENTS)}

@app.post("/api/clear")
def clear_queue():
    db.clear()
    return {"status": "Queue cleared"}

@app.get("/api/calendar", response_model=List[CalendarPatientRecord])
def get_calendar_patients():
    return calendar_db.get_all_patients()

@app.post("/api/calendar", response_model=CalendarPatientRecord, status_code=201)
def add_calendar_patient(patient: CalendarPatientIntake):
    return calendar_db.add_patient(patient)

@app.put("/api/calendar/{patient_id}", response_model=CalendarPatientRecord)
def update_calendar_patient(patient_id: str, patient: CalendarPatientIntake):
    updated = calendar_db.update_patient(patient_id, patient)
    if not updated:
        raise HTTPException(status_code=404, detail="Calendar patient not found")
    return updated

@app.delete("/api/calendar/{patient_id}")
def delete_calendar_patient(patient_id: str):
    success = calendar_db.delete_patient(patient_id)
    if not success:
        raise HTTPException(status_code=404, detail="Calendar patient not found")
    return {"status": "success", "message": "Calendar patient deleted"}


class VoiceAnalysisRequest(BaseModel):
    transcript: str


class VoiceAnalysisResult(BaseModel):
    detected_problem: str
    detected_symptoms: List[str] = Field(default_factory=list)
    severity: str
    ai_score: int
    possible_clinical_concerns: List[str] = Field(default_factory=list)
    recommended_department: str = Field(default="General Triage")
    recommendations: List[str] = Field(default_factory=list)
    confidence: str
    disclaimer: str = Field(default="Clinical Decision Support Only - Not a Medical Diagnosis")


VOICE_SYMPTOM_ENTRIES = [
    {
        "category": "Chest Pain / Cardiac",
        "keywords": ["chest pain", "heart", "cardiac", "heart attack", "myocardial", "chest pressure", "dolor de pecho", "corazón", "छाती में दर्द", "हार्ट अटैक", "douleur thoracique", "brustschmerzen", "胸痛", "ألم في الصدر", "боль в груди"],
        "score": 4,
        "dept": "Cardiology / Emergency Department",
        "concerns": ["May indicate Acute Coronary Syndrome (ACS) or Myocardial Ischemia", "Suggests possibility of Angina Pectoris or Pericarditis"],
        "recs": ["Stat 12-lead ECG", "Cardiac Troponin enzyme panel", "Telemetry monitoring"]
    },
    {
        "category": "Shortness of Breath / Respiratory",
        "keywords": ["can't breathe", "difficulty breathing", "shortness of breath", "choking", "asthma", "wheezing", "dyspnea", "no puedo respirar", "falta de aire", "सांस लेने में तकलीफ", "difficulté à respirer", "atemnot", "呼吸困难", "صعوبة في التنفس", "одышка"],
        "score": 3,
        "dept": "Emergency Respiratory Unit",
        "concerns": ["May indicate Acute Respiratory Distress or Asthma Exacerbation", "Suggests possibility of Pneumonia or Pulmonary Embolism"],
        "recs": ["Immediate SpO2 pulse oximetry", "Administer supplemental O2", "Chest X-Ray / ABG"]
    },
    {
        "category": "Neurological / Stroke Signs",
        "keywords": ["stroke", "can't speak", "face drooping", "numbness", "paralysis", "slurred", "speech difficulty", "derrame", "parálisis", "स्ट्रोक", "लकवा", "avc", "schlaganfall", "中风", "سكتة دماغية", "инсульт"],
        "score": 4,
        "dept": "Neurology / Stroke Resuscitation",
        "concerns": ["🚨 May indicate Acute Cerebrovascular Accident (CVA) / Ischemic Stroke", "Suggests possibility of Transient Ischemic Attack (TIA)"],
        "recs": ["FAST Stroke Assessment", "Stat Non-contrast Head CT Scan", "Neurology Team Consult"]
    },
    {
        "category": "Loss of Consciousness / Seizure",
        "keywords": ["unconscious", "unresponsive", "fainted", "collapsed", "blackout", "seizure", "convulsions", "inconsciente", "desmayado", "बेहोश", "évanoui", "bewusstlos", "昏迷", "فقدان الوعي", "обморок"],
        "score": 4,
        "dept": "Emergency Department / Resuscitation",
        "concerns": ["May indicate Postictal State or Seizure Disorder", "Suggests possibility of Syncope / Intracranial Hemorrhage"],
        "recs": ["Airway protection & positioning", "Stat Fingerstick Blood Glucose", "Head CT / EEG"]
    },
    {
        "category": "Fever & Chills",
        "keywords": ["fever", "high temperature", "chills", "sweating", "febrile", "burning up", "fiebre", "बुखार", "fièvre", "fieber", "发烧", "حمى", "температура"],
        "score": 2,
        "dept": "Infectious Disease / Internal Medicine",
        "concerns": ["May indicate Systemic Infection or Inflammatory Etiology", "Suggests risk of Sepsis when presenting with tachycardia"],
        "recs": ["Temperature monitoring", "CBC with differential & blood cultures", "Antipyretic administration"]
    },
    {
        "category": "Gastrointestinal (Vomiting / Nausea / Abdominal)",
        "keywords": ["vomiting", "nausea", "throwing up", "stomach ache", "abdominal pain", "belly pain", "vómito", "dolor de estómago", "उल्टी", "पेट दर्द", "vomissement", "erbrechen", "呕吐", "腹痛", "قيء", "рвота"],
        "score": 2,
        "dept": "Gastroenterology / Urgent Care",
        "concerns": ["May indicate Acute Gastroenteritis or Biliary Colic", "Suggests possibility of Dehydration or Electrolyte Disturbance"],
        "recs": ["Abdominal physical exam", "Hydration assessment & antiemetics", "Abdominal ultrasound if localized"]
    },
    {
        "category": "Headache & Migraine",
        "keywords": ["headache", "migraine", "head pain", "throbbing head", "pounding head", "dolor de cabeza", "migraña", "सिरदर्द", "mal de tête", "kopfschmerzen", "头痛", "صداع", "головная боль"],
        "score": 2,
        "dept": "Neurology / Outpatient Care",
        "concerns": ["May indicate Vascular Migraine or Tension Cephalea", "Requires screening for Meningitis if accompanied by neck stiffness"],
        "recs": ["Targeted neurological screen", "Blood pressure check", "Analgesic administration"]
    },
    {
        "category": "Allergic Reaction & Rash",
        "keywords": ["rash", "hives", "itching", "swelling", "allergy", "allergic reaction", "alergia", "hinchazón", "एलर्जी", "सूजन", "allergie", "皮疹", "حساسية", "сыпь"],
        "score": 2,
        "dept": "Allergy & Immunology / Urgent Care",
        "concerns": ["May indicate Dermatitis or Cutaneous Hypersensitivity", "Requires evaluation for Anaphylaxis if lip/facial swelling is present"],
        "recs": ["Assess airway & lip swelling", "Antihistamine / Steroid administration", "Epinephrine stat if wheezing"]
    },
    {
        "category": "Trauma, Fractures & Bleeding",
        "keywords": ["bleeding", "hemorrhage", "blood loss", "wound", "laceration", "fracture", "broken bone", "fall", "injury", "sangrado", "fractura", "खून बहना", "हड्डी टूटना", "saignement", "blutung", "出血", "골절"],
        "score": 3,
        "dept": "Trauma Unit / Orthopedics",
        "concerns": ["May indicate Traumatic Bone Fracture or Laceration", "Suggests risk of Active Hemorrhage"],
        "recs": ["Radiographic X-Ray imaging", "Apply direct pressure / hemostasis", "Limb immobilization"]
    },
    {
        "category": "Dizziness & Vertigo",
        "keywords": ["dizzy", "dizziness", "vertigo", "lightheaded", "unsteady", "mareo", "vértigo", "चक्कर आना", "vertige", "schwindel", "眩晕", "دوخة", "головокружение"],
        "score": 2,
        "dept": "Neurology / General Triage",
        "concerns": ["May indicate Orthostatic Hypotension or Labyrinthitis", "Suggests possibility of Dehydration or Electrolyte Shift"],
        "recs": ["Check lying/standing blood pressure", "ENT vestibular screening", "Fluid resuscitation"]
    }
]

@app.post("/api/voice-analysis", response_model=VoiceAnalysisResult)
def analyze_voice_transcript(req: VoiceAnalysisRequest):
    text = req.transcript.lower().strip()
    if not text:
        return VoiceAnalysisResult(
            detected_problem="No Input Detected",
            detected_symptoms=[],
            severity="Low",
            ai_score=1,
            possible_clinical_concerns=["Requires physical intake examination"],
            recommended_department="General Triage",
            recommendations=["Perform primary intake evaluation"],
            confidence="Low",
            disclaimer="Clinical Decision Support Only - Not a Medical Diagnosis"
        )

    detected_symptoms = []
    concerns = []
    recs = []
    depts = set()
    max_score = 2

    for entry in VOICE_SYMPTOM_ENTRIES:
        matches = [kw for kw in entry["keywords"] if kw in text]
        if matches:
            detected_symptoms.append(entry["category"])
            max_score += entry["score"]
            depts.add(entry["dept"])
            concerns.extend(entry["concerns"])
            recs.extend(entry["recs"])

    if not detected_symptoms:
        detected_symptoms.append("Natural Speech Intake / General Symptom Presentation")
        concerns.append("May indicate non-specific viral illness, localized discomfort, or fatigue")
        concerns.append("Requires clinical evaluation for precise symptom classification")
        depts.add("General Triage / Urgent Care")
        recs.append("Document full patient clinical history")
        recs.append("Obtain baseline vital signs")

    final_score = min(10, max(1, max_score))
    severity_label = "Critical" if final_score >= 8 else ("High" if final_score >= 6 else ("Moderate" if final_score >= 4 else "Low"))
    confidence_label = "High" if len(detected_symptoms) >= 2 else "Medium"
    primary_dept = list(depts)[0] if depts else "General Triage"

    unique_concerns = list(dict.fromkeys(concerns))[:4]
    unique_recs = list(dict.fromkeys(recs))[:4]

    return VoiceAnalysisResult(
        detected_problem=" + ".join(detected_symptoms),
        detected_symptoms=detected_symptoms,
        severity=severity_label,
        ai_score=final_score,
        possible_clinical_concerns=unique_concerns,
        recommended_department=primary_dept,
        recommendations=unique_recs,
        confidence=confidence_label,
        disclaimer="Clinical Decision Support Only - Not a Medical Diagnosis"
    )


@app.post("/api/face-analysis", response_model=FaceAnalysisResult)
def analyze_face_image(req: FaceAnalysisRequest):
    res = evaluate_face_image(req.model_dump())
    return FaceAnalysisResult(**res)
