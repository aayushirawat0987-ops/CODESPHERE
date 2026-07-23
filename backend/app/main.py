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
        complaint=intake.complaint,
        medical_history=intake.medical_history,
        age=intake.age
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
        rule_res = evaluate_clinical_rules(
            vitals=vitals_obj,
            pain_scale=intake.pain_scale,
            complaint=intake.complaint,
            medical_history=intake.medical_history,
            age=intake.age
        )
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

@app.get("/api/calendar", response_model=List[CalendarPatientRecord])
def get_calendar_patients():
    """
    Returns all calendar patient records.
    """
    return calendar_db.get_all_patients()

@app.post("/api/calendar", response_model=CalendarPatientRecord, status_code=201)
def add_calendar_patient(patient: CalendarPatientIntake):
    """
    Adds a new patient to the calendar database.
    """
    return calendar_db.add_patient(patient)

@app.put("/api/calendar/{patient_id}", response_model=CalendarPatientRecord)
def update_calendar_patient(patient_id: str, patient: CalendarPatientIntake):
    """
    Updates an existing calendar patient record.
    """
    updated = calendar_db.update_patient(patient_id, patient)
    if not updated:
        raise HTTPException(status_code=404, detail="Calendar patient not found")
    return updated

@app.delete("/api/calendar/{patient_id}")
def delete_calendar_patient(patient_id: str):
    """
    Deletes a calendar patient record.
    """
    success = calendar_db.delete_patient(patient_id)
    if not success:
        raise HTTPException(status_code=404, detail="Calendar patient not found")
    return {"status": "success", "message": "Calendar patient deleted"}


class VoiceAnalysisRequest(BaseModel):
    transcript: str


class VoiceAnalysisResult(BaseModel):
    detected_problem: str
    severity: str
    ai_score: int
    keywords_found: List[str]
    recommendations: List[str]
    confidence: str


VOICE_SYMPTOM_MAP = [
    {
        "keywords": [
            "chest pain", "heart", "cardiac", "heart attack", "myocardial",
            "dolor de pecho", "corazón", "ataque al corazón",
            "छाती में दर्द", "दिल का दौरा", "हार्ट अटैक",
            "douleur thoracique", "coeur", "crise cardiaque",
            "brustschmerzen", "herzinfarkt", "herz",
            "胸痛", "心脏病", "心肌梗塞",
            "ألم في الصدر", "نوبة قلبية", "قلب",
            "боль в груди", "инфаркт", "сердце",
            "dor no peito", "coração", "ataque cardíaco",
            "dolore al petto", "attacco di cuore",
            "胸の痛み", "心臓発作",
            "가슴 통증", "심장 마비"
        ],
        "problem": "Possible Cardiac Event",
        "severity": "Critical",
        "score": 10,
        "recs": ["Immediate ECG", "Cardiac enzyme panel", "Call cardiologist"]
    },
    {
        "keywords": [
            "can't breathe", "difficulty breathing", "shortness of breath", "choking", "asthma", "respiratory",
            "no puedo respirar", "falta de aire", "asfixia", "asma",
            "सांस लेने में तकलीफ", "दम घुटना", "सांस फूलना", "अस्थमा",
            "difficulté à respirer", "essoufflement", "étouffement", "asthme",
            "atemnot", "schwer atmen", "erstickung", "asthma",
            "呼吸困难", "气短", "窒息", "哮喘",
            "صعوبة في التنفس", "ضيق في التنفس", "اختناق", "ربو",
            "трудно дышать", "одышка", "удушье", "астма",
            "dificuldade para respirar", "falta de ar", "falta de ar", "asma",
            "difficoltà a respirare", "affanno", "asma",
            "呼吸困難", "息切れ", "ぜんそく",
            "숨이 차다", "호흡 곤란", "천식"
        ],
        "problem": "Respiratory Distress",
        "severity": "Critical",
        "score": 9,
        "recs": ["Check SpO2", "Administer O2", "Prep bronchodilator"]
    },
    {
        "keywords": [
            "stroke", "can't speak", "face drooping", "numbness", "paralysis", "slurred",
            "derrame", "ictus", "no puedo hablar", "parálisis", "cara caída",
            "स्ट्रोक", "लकवा", "बोलने में दिक्कत", "मुंह टेढ़ा",
            "accident vasculaire", "avc", "paralysie", "visage affaissé",
            "schlaganfall", "lähmung", "sprachstörung",
            "中风", "面瘫", "无法说话", "麻木",
            "سكتة دماغية", "شلل", "صعوبة في الكلام",
            "инсульт", "паралич", "онемение",
            "avc", "derrame", "paralisia", "dificuldade de falar",
            "ictus", "paralisi", "difficoltà a parlare",
            "脳卒中", "麻痺", "しゃべれない",
            "뇌졸중", "마비", "말이 어눌함"
        ],
        "problem": "Possible Stroke / Neurological Event",
        "severity": "Critical",
        "score": 10,
        "recs": ["FAST assessment", "Immediate CT scan", "Neurology consult"]
    },
    {
        "keywords": [
            "unconscious", "unresponsive", "fainted", "collapsed", "not waking",
            "inconsciente", "desmayado", "no responde",
            "बेहोश", "गिर पड़ा", "होश नहीं",
            "inconscient", "évanoui", "sans réponse",
            "bewusstlos", "ohnmächtig", "zusammengebrochen",
            "昏迷", "晕倒", "无反应",
            "فقدان الوعي", "إغماء", "لا يستجيب",
            "без сознания", "обморок", "упал",
            "inconsciente", "desmaiou", "sem resposta",
            "svenuto", "inconsciente",
            "気失った", "意識不明",
            "의식 불명", "기절"
        ],
        "problem": "Loss of Consciousness",
        "severity": "Critical",
        "score": 10,
        "recs": ["Check airway", "GCS assessment", "IV access"]
    },
    {
        "keywords": [
            "severe pain", "unbearable pain", "pain 10", "excruciating",
            "dolor severo", "dolor insoportable", "mucho dolor",
            "गंभीर दर्द", "असहनीय दर्द", "बहुत तेज दर्द",
            "douleur intense", "douleur insupportable",
            "starke schmerzen", "unerträgliche schmerzen",
            "剧痛", "严重疼痛", "无法忍受",
            "ألم شديد", "ألم لا يطاق",
            "сильная боль", "невыносимая боль",
            "dor intensa", "dor insuportável",
            "dolore severo", "dolore insopportabile",
            "激しい痛み", "耐えられない痛み",
            "심한 통증", "극심한 통증"
        ],
        "problem": "Severe Pain Management",
        "severity": "High",
        "score": 8,
        "recs": ["Pain scale assessment", "Analgesic protocol", "Identify source"]
    },
    {
        "keywords": [
            "bleeding", "hemorrhage", "blood loss", "wound", "laceration",
            "sangrado", "hemorragia", "sangre", "herida",
            "खून बहना", "रक्तस्राव", "चोट", "घाव",
            "saignement", "hémorragie", "perte de sang",
            "blutung", "blutverlust", "wunde",
            "出血", "流血", "伤口",
            "نزيف", "فقدان الدم", "جرح",
            "кровотечение", "потеря крови", "раны",
            "sangramento", "hemorragia", "sangue",
            "sanguinamento", "emorragia",
            "出血", "怪我",
            "출혈", "피가 나다"
        ],
        "problem": "Active Hemorrhage / Trauma",
        "severity": "High",
        "score": 8,
        "recs": ["Apply pressure", "Blood type & cross", "Surgical consult"]
    },
    {
        "keywords": [
            "fever", "high temperature", "burning up", "chills", "sweating", "infection",
            "fiebre", "temperatura alta", "escalofríos", "infección",
            "बुखार", "तेज बुखार", "ठंड लगना", "संक्रमण",
            "fièvre", "frissons", "température élevée", "infection",
            "fieber", "hohe temperatur", "schüttelfrost", "infektion",
            "发烧", "高烧", "发冷", "感染",
            "حمى", "ارتفاع الحرارة", "قشعريرة", "التهاب",
            "температура", "лихорадка", "озноб", "инфекция",
            "febre", "temperatura alta", "calafrios", "infecção",
            "febbre", "brividi", "infezione",
            "発熱", "熱がある", "寒気",
            "열이 나다", "고열", "오한"
        ],
        "problem": "Fever / Possible Infection",
        "severity": "Moderate",
        "score": 6,
        "recs": ["Temperature check", "CBC & culture", "Antipyretics"]
    },
    {
        "keywords": [
            "vomiting", "nausea", "throwing up", "stomach", "abdominal pain", "belly pain",
            "vómito", "náuseas", "dolor de estómago", "dolor abdominal",
            "उल्टी", "पेट दर्द", "जी मिचलाना",
            "vomissement", "nausée", "mal de ventre", "douleur abdominale",
            "erbrechen", "übelkeit", "bauchschmerzen",
            "呕吐", "恶心", "腹痛", "胃痛",
            "قيء", "غثيان", "ألم في البطن", "مغص",
            "рвота", "тошнота", "боль в животе",
            "vômito", "náusea", "dor de barriga", "dor abdominal",
            "vomito", "nausea", "mal di pancia",
            "吐き気", "嘔吐", "腹痛",
            "구토", "메스꺼움", "복통"
        ],
        "problem": "Gastrointestinal Distress",
        "severity": "Moderate",
        "score": 5,
        "recs": ["Abdominal exam", "Fluid balance", "GI workup if persistent"]
    },
    {
        "keywords": [
            "headache", "migraine", "head pain", "pounding head",
            "dolor de cabeza", "migraña",
            "सिरदर्द", "माईग्रेन", "सिर में दर्द",
            "mal de tête", "migraine",
            "kopfschmerzen", "migräne",
            "头痛", "偏头痛",
            "صداع", "شقيقة",
            "головная боль", "мигрень",
            "dor de cabeça", "enxaqueca",
            "mal di testa", "emicrania",
            "頭痛", "片頭痛",
            "두통", "편두통"
        ],
        "problem": "Headache / Possible Migraine",
        "severity": "Moderate",
        "score": 5,
        "recs": ["Neurological screen", "Blood pressure check", "Analgesics"]
    },
    {
        "keywords": [
            "fracture", "broken bone", "can't move", "injury", "trauma", "fall", "accident",
            "fractura", "hueso roto", "caída", "lesión",
            "अस्थि भंग", "हड्डी टूटना", "चोट", "दुर्घटना",
            "fracture", "os cassé", "blessure", "chute",
            "fraktur", "knochenbruch", "verletzung", "sturz",
            "骨折", "摔伤", "受伤", "意外",
            "كسر", "إصابة", "سقوط", "حادث",
            "перелом", "травма", "падение", "авария",
            "fratura", "osso quebrado", "lesão", "queda",
            "frattura", "osso rotto", "caduta",
            "骨折", "転倒", "怪我",
            "골절", "부상", "낙상"
        ],
        "problem": "Musculoskeletal Injury / Fracture",
        "severity": "Moderate",
        "score": 6,
        "recs": ["X-ray", "Immobilize limb", "Pain management"]
    },
    {
        "keywords": [
            "dizzy", "dizziness", "vertigo", "lightheaded", "balance",
            "mareo", "vértigo", "desequilibrio",
            "चक्कर आना", "चक्कर", "संतुलन बिगड़ना",
            "vertige", "étourdissement",
            "schwindel", "schwindelig",
            "眩晕", "头晕",
            "دوخة", "دوار",
            "головокружение", "вертиго",
            "tontura", "vertigem",
            "capogiro", "vertigini",
            "めまい", "立ちくらみ",
            "어지러움", "현기증"
        ],
        "problem": "Dizziness / Vertigo",
        "severity": "Low",
        "score": 4,
        "recs": ["BP check", "ENT assessment", "Hydration status"]
    },
    {
        "keywords": [
            "rash", "allergic", "itching", "swelling", "hives", "allergy",
            "alergia", "hinchazón", "picazón", "erupción",
            "एलर्जी", "खुजली", "सूजन", "चकत्ते",
            "allergie", "démangeaison", "gonflement", "éruption",
            "allergie", "juckreiz", "schwellung",
            "过敏", "发痒", "肿胀", "皮疹",
            "حساسية", "حكة", "تورم", "طفح جلدي",
            "аллергия", "зуд", "отек", "сыпь",
            "alergia", "coceira", "inchaço",
            "allergia", "prurito", "gonfiore",
            "アレルギー", "かゆみ", "発疹",
            "알레르기", "가려움", "부종"
        ],
        "problem": "Allergic Reaction / Dermatological",
        "severity": "Moderate",
        "score": 6,
        "recs": ["Check for anaphylaxis", "Antihistamines", "EpiPen if severe"]
    }
]


@app.post("/api/voice-analysis", response_model=VoiceAnalysisResult)
def analyze_voice_transcript(req: VoiceAnalysisRequest):
    """
    Analyzes a voice transcript for medical symptoms and returns triage support.
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
        return VoiceAnalysisResult(
            detected_problem="General Complaint / Unspecified Symptoms",
            severity="Low",
            ai_score=2,
            keywords_found=[],
            recommendations=["Full clinical assessment needed", "Document patient history", "Nurse triage evaluation"],
            confidence="Low",
        )

    confidence = "High" if best_score >= 2 else "Medium"
    return VoiceAnalysisResult(
        detected_problem=best_match["problem"],
        severity=best_match["severity"],
        ai_score=best_match["score"],
        keywords_found=all_keywords_found,
        recommendations=best_match["recs"],
        confidence=confidence,
    )


@app.post("/api/face-analysis", response_model=FaceAnalysisResult)
def analyze_face_image(req: FaceAnalysisRequest):
    """
    Analyzes patient facial photo/camera snapshot for clinical distress indicators
    (Pain expression, FAST stroke signs, skin pallor).
    """
    res = evaluate_face_image(req.model_dump())
    return FaceAnalysisResult(**res)


