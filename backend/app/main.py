"""
Vitalis / TriageAI - FastAPI Application Entry Point
---------------------------------------------------
Clinical Decision-Support Tool backend providing AI-driven intake evaluation,
deterministic safety rule checks, staff override controls, surge queue simulation,
and voice-based symptom analysis.
"""


from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import time
import logging
from pydantic import BaseModel

from app.models import PatientIntake, PatientRecord, OverrideRequest, Vitals, CalendarPatient, CalendarPatientCreate
from app.rule_engine import evaluate_clinical_rules
from app.ai_engine import evaluate_patient_ai
from app.storage import db, calendar_db
from app.surge_data import SURGE_PATIENTS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vitalis_backend")

app = FastAPI(
    title="Vitalis / TriageAI Backend",
    description="Hackathon MVP Decision-Support Tool for ER/Urgent Care Intake",
    version="1.0.0"
)

# Enable CORS for local React Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Vitalis TriageAI Core"}

@app.get("/api/patients", response_model=List[PatientRecord])
def get_patients():
    """
    Returns live list of triage patients sorted by effective_urgency_score descending.
    """
    return db.get_all_patients()

@app.post("/api/patients", response_model=PatientRecord, status_code=201)
def process_patient_intake(intake: PatientIntake):
    """
    Processes new patient intake:
    1. Evaluates deterministic clinical safety rules.
    2. Calls Claude AI reasoning engine (or mock fallback).
    3. Combines findings into effective urgency score and red flags.
    4. Saves to triage queue.
    """
    logger.info(f"Processing intake for patient: {intake.name}")

    # 1. Rule Engine evaluation
    rule_res = evaluate_clinical_rules(
        vitals=intake.vitals or Vitals(),
        pain_scale=intake.pain_scale,
        complaint=intake.complaint
    )

    # 2. AI Reasoning Engine evaluation..
    ai_res = evaluate_patient_ai(intake)

    # 3. Store record
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
    """
    Applies staff override to manually adjust score (1-10) and reason.
    Locks AI re-scoring for this patient record.
    """
    updated_record = db.apply_override(patient_id, req)
    if not updated_record:
        raise HTTPException(status_code=404, detail="Patient record not found")
    logger.info(f"Staff override applied to {patient_id}: Score set to {req.score}")
    return updated_record

def run_surge_simulation_batch():
    """
    Background worker populating surge dataset into triage queue.
    """
    for p in SURGE_PATIENTS:
        vitals_raw = p.get("vitals")
        vitals_dict = vitals_raw if isinstance(vitals_raw, dict) else {}
        vitals_obj = Vitals(**vitals_dict)
        intake = PatientIntake(
            name=str(p["name"]),
            complaint=str(p["complaint"]),
            pain_scale=int(p["pain_scale"]),
            vitals=vitals_obj
        )
        rule_res = evaluate_clinical_rules(vitals_obj, intake.pain_scale, intake.complaint)
        ai_res = evaluate_patient_ai(intake)
        db.add_patient(intake, ai_res, rule_res)
        time.sleep(0.5) # Brief delay to simulate rapid arrivals over time

@app.post("/api/surge")
def trigger_surge(background_tasks: BackgroundTasks):
    """
    Triggers surge simulation of 8-10 incoming patients.
    """
    background_tasks.add_task(run_surge_simulation_batch)
    return {"status": "Surge simulation started", "patient_count": len(SURGE_PATIENTS)}

@app.post("/api/clear")
def clear_queue():
    """
    Clears all patient records from queue for clean demo state.
    """
    db.clear()
    return {"status": "Queue cleared"}

@app.get("/api/calendar", response_model=List[CalendarPatient])
def get_calendar_patients():
    return calendar_db.get_all()

@app.post("/api/calendar", response_model=CalendarPatient)
def add_calendar_patient(data: CalendarPatientCreate):
    return calendar_db.add_patient(data)

@app.put("/api/calendar/{patient_id}", response_model=CalendarPatient)
def update_calendar_patient(patient_id: str, data: CalendarPatientCreate):
    updated = calendar_db.update_patient(patient_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Patient not found")
    return updated

@app.delete("/api/calendar/{patient_id}")
def delete_calendar_patient(patient_id: str):
    success = calendar_db.delete_patient(patient_id)
    if not success:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"status": "deleted"}


# ─── Voice Analysis Endpoint ─────────────────────────────────────────────────

class VoiceAnalysisRequest(BaseModel):
    transcript: str

class VoiceAnalysisResult(BaseModel):
    detected_problem: str
    severity: str        # "Critical", "High", "Moderate", "Low"
    ai_score: int        # 1–10
    keywords_found: List[str]
    recommendations: List[str]
    confidence: str      # "High", "Medium", "Low"

# Keyword-to-problem mapping with severity levels
VOICE_SYMPTOM_MAP = [
    {"keywords": ["chest pain", "heart", "cardiac", "heart attack", "myocardial"], "problem": "Possible Cardiac Event", "severity": "Critical", "score": 10, "recs": ["Immediate ECG", "Cardiac enzyme panel", "Call cardiologist"]},
    {"keywords": ["can't breathe", "difficulty breathing", "shortness of breath", "choking", "asthma", "respiratory"], "problem": "Respiratory Distress", "severity": "Critical", "score": 9, "recs": ["Check SpO2", "Administer O2", "Prep bronchodilator"]},
    {"keywords": ["stroke", "can't speak", "face drooping", "numbness", "paralysis", "slurred"], "problem": "Possible Stroke / Neurological Event", "severity": "Critical", "score": 10, "recs": ["FAST assessment", "Immediate CT scan", "Neurology consult"]},
    {"keywords": ["unconscious", "unresponsive", "fainted", "collapsed", "not waking"], "problem": "Loss of Consciousness", "severity": "Critical", "score": 10, "recs": ["Check airway", "GCS assessment", "IV access"]},
    {"keywords": ["severe pain", "unbearable pain", "pain 10", "excruciating"], "problem": "Severe Pain Management", "severity": "High", "score": 8, "recs": ["Pain scale assessment", "Analgesic protocol", "Identify source"]},
    {"keywords": ["bleeding", "hemorrhage", "blood loss", "wound", "laceration"], "problem": "Active Hemorrhage / Trauma", "severity": "High", "score": 8, "recs": ["Apply pressure", "Blood type & cross", "Surgical consult"]},
    {"keywords": ["fever", "high temperature", "burning up", "chills", "sweating", "infection"], "problem": "Fever / Possible Infection", "severity": "Moderate", "score": 6, "recs": ["Temperature check", "CBC & culture", "Antipyretics"]},
    {"keywords": ["vomiting", "nausea", "throwing up", "stomach", "abdominal pain", "belly pain"], "problem": "Gastrointestinal Distress", "severity": "Moderate", "score": 5, "recs": ["Abdominal exam", "Fluid balance", "GI workup if persistent"]},
    {"keywords": ["headache", "migraine", "head pain", "pounding head"], "problem": "Headache / Possible Migraine", "severity": "Moderate", "score": 5, "recs": ["Neurological screen", "Blood pressure check", "Analgesics"]},
    {"keywords": ["fracture", "broken bone", "can't move", "injury", "trauma", "fall", "accident"], "problem": "Musculoskeletal Injury / Fracture", "severity": "Moderate", "score": 6, "recs": ["X-ray", "Immobilize limb", "Pain management"]},
    {"keywords": ["dizzy", "dizziness", "vertigo", "lightheaded", "balance"], "problem": "Dizziness / Vertigo", "severity": "Low", "score": 4, "recs": ["BP check", "ENT assessment", "Hydration status"]},
    {"keywords": ["rash", "allergic", "itching", "swelling", "hives", "allergy"], "problem": "Allergic Reaction / Dermatological", "severity": "Moderate", "score": 6, "recs": ["Check for anaphylaxis", "Antihistamines", "EpiPen if severe"]},
    {"keywords": ["cough", "cold", "sore throat", "runny nose", "sneezing"], "problem": "Upper Respiratory Illness", "severity": "Low", "score": 3, "recs": ["Symptomatic treatment", "Rest & fluids", "COVID screening if applicable"]},
    {"keywords": ["anxiety", "panic", "stress", "mental", "depression", "suicidal", "harm"], "problem": "Mental Health Crisis", "severity": "High", "score": 7, "recs": ["Safe environment", "Psychiatric consult", "Risk assessment"]},
    {"keywords": ["diabetes", "blood sugar", "insulin", "hypoglycemia", "hyperglycemia"], "problem": "Diabetic Emergency", "severity": "High", "score": 8, "recs": ["Blood glucose test", "IV dextrose or insulin", "Endocrinology"]},
]

@app.post("/api/voice-analysis", response_model=VoiceAnalysisResult)
def analyze_voice_transcript(req: VoiceAnalysisRequest):
    """
    Analyzes a voice transcript for medical symptoms, returns problem detection
    with severity level and AI score contribution.
    """
    text = req.transcript.lower()
    
    best_match = None
    best_score = 0
    all_keywords_found = []
    
    for entry in VOICE_SYMPTOM_MAP:
        matched = [kw for kw in entry["keywords"] if kw in text]
        if matched and len(matched) > best_score:
            best_score = len(matched)
            best_match = entry
            all_keywords_found = matched
    
    if not best_match:
        # Generic low-urgency response
        return VoiceAnalysisResult(
            detected_problem="General Complaint / Unspecified Symptoms",
            severity="Low",
            ai_score=2,
            keywords_found=[],
            recommendations=["Full clinical assessment needed", "Document patient history", "Nurse triage evaluation"],
            confidence="Low"
        )
    
    confidence = "High" if best_score >= 2 else "Medium"
    
    return VoiceAnalysisResult(
        detected_problem=best_match["problem"],
        severity=best_match["severity"],
        ai_score=best_match["score"],
        keywords_found=all_keywords_found,
        recommendations=best_match["recs"],
        confidence=confidence
    )

