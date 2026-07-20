"""
Vitalis / TriageAI - FastAPI Application Entry Point
---------------------------------------------------
Clinical Decision-Support Tool backend providing AI-driven intake evaluation,
deterministic safety rule checks, staff override controls, and surge queue simulation.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import time
import logging

from app.models import PatientIntake, PatientRecord, OverrideRequest, Vitals
from app.rule_engine import evaluate_clinical_rules
from app.ai_engine import evaluate_patient_ai
from app.storage import db
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

    # 2. AI Reasoning Engine evaluation
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
