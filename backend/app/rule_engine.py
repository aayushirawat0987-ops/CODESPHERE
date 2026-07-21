"""
Rule-Based Cross-Check Layer for Triage Safety
------------------------------------------------
Provides deterministic, rule-based clinical safety guardrails on top of LLM recommendations.
Ensures vital sign threshold anomalies automatically boost urgency scores and surface clinical red flags.
"""

from app.models import Vitals, RuleCheckResult

def evaluate_clinical_rules(
    vitals: Vitals, 
    pain_scale: int, 
    complaint: str, 
    medical_history: str = None, 
    age: int = None
) -> RuleCheckResult:
    """
    Evaluates patient vitals, pain score, age, medical history, and chief complaint keywords 
    against deterministic safety rules. Returns score boost, additional red flags, and rule notes.
    """
    boost = 0
    flags = []
    notes = []

    hr = vitals.heart_rate
    temp = vitals.temperature
    bp_str = vitals.blood_pressure
    complaint_lower = complaint.lower()
    history_lower = (medical_history or "").lower()

    # RULE 1: Sepsis Risk Screening (Tachycardia + Hyperthermia/Fever)
    if hr is not None and temp is not None:
        if hr > 120 and temp > 101.0:
            boost += 2
            flags.append("🚨 SAFETY ALERT: Possible Sepsis Risk (High HR + Fever)")
            notes.append(f"Rule Triggered: HR ({hr} bpm) > 120 AND Temp ({temp}°F) > 101°F")
    
    # RULE 2: Isolated Severe Tachycardia or Bradycardia
    if hr is not None:
        if hr >= 140:
            boost += 2
            flags.append("🚨 SAFETY ALERT: Critical Tachycardia (HR ≥ 140 bpm)")
            notes.append(f"Rule Triggered: HR ({hr} bpm) ≥ 140")
        elif hr < 45:
            boost += 2
            flags.append("🚨 SAFETY ALERT: Severe Bradycardia (HR < 45 bpm)")
            notes.append(f"Rule Triggered: HR ({hr} bpm) < 45")

    # RULE 3: Severe High Fever
    if temp is not None and temp >= 103.5:
        boost += 1
        flags.append("⚠️ SAFETY ALERT: Severe High Fever (≥ 103.5°F)")
        notes.append(f"Rule Triggered: Temp ({temp}°F) ≥ 103.5")

    # RULE 4: Hypertensive Crisis Parsing
    if bp_str and "/" in bp_str:
        try:
            parts = bp_str.strip().split("/")
            systolic = int(parts[0].strip())
            diastolic = int(parts[1].strip())
            if systolic >= 180 or diastolic >= 120:
                boost += 2
                flags.append("🚨 SAFETY ALERT: Hypertensive Crisis Threshold (BP ≥ 180/120)")
                notes.append(f"Rule Triggered: BP ({bp_str}) exceeds critical blood pressure limit")
        except Exception:
            pass # Non-standard BP format gracefully ignored

    # RULE 5: Pain Scale 10/10 Override Warning
    if pain_scale == 10:
        flags.append("⚠️ High Pain Alert (10/10 Pain Scale)")
        notes.append("Rule Triggered: Maximum Pain Score reported")

    # RULE 6: Category A: Immediate Life-Threats (Boost +3)
    life_threat_keywords = {
        "cardiac arrest": "Cardiac Arrest",
        "heart attack": "Myocardial Infarction (Heart Attack)",
        "crushing chest pain": "Acute Coronary Syndrome / Crushing Chest Pain",
        "throat swelling": "Anaphylaxis / Airway Compromise",
        "anaphylaxis": "Anaphylaxis / Severe Allergic Reaction",
        "gunshot": "Penetrating Trauma / Gunshot Wound",
        "amputation": "Traumatic Amputation / Severe Bleeding",
        "diabetic coma": "Critical Diabetic Crisis / Coma"
    }
    for keyword, desc in life_threat_keywords.items():
        if keyword in complaint_lower:
            boost += 3
            flags.append(f"🚨 CRITICAL ALERT: {desc}")
            notes.append(f"Rule Triggered: Life-threat keyword match '{keyword}'")

    # RULE 7: Category B: Urgent / Semi-Critical (Boost +2)
    urgent_keywords = {
        "chest pain": "Chest Pain (Potential Cardiovascular Event)",
        "shortness of breath": "Respiratory Distress / Dyspnea",
        "difficulty breathing": "Respiratory Distress / Dyspnea",
        "numbness": "Potential Neurological Deficit",
        "slurred speech": "Potential Stroke / CVA (Neurological Deficit)",
        "fainting": "Syncope / Loss of Consciousness",
        "unresponsive": "Altered Mental Status / Unresponsive",
        "seizure": "Acute Seizure Activity",
        "appendicitis": "Appendicitis / Severe Right Lower Quadrant Pain",
        "vomiting blood": "Acute Upper Gastrointestinal Bleed",
        "black stool": "Gastrointestinal Bleed (Melena)",
        "compound fracture": "Open/Compound Fracture",
        "head injury": "Traumatic Brain Injury / Head Injury with Altered Status"
    }
    for keyword, desc in urgent_keywords.items():
        if keyword in complaint_lower:
            # Avoid double flagging "chest pain" if "crushing chest pain" already fired
            if keyword == "chest pain" and "crushing chest pain" in complaint_lower:
                continue
            boost += 2
            flags.append(f"⚡ URGENT ALERT: {desc}")
            notes.append(f"Rule Triggered: Urgent keyword match '{keyword}'")

    # RULE 8: Category C: Moderate / Diagnostics (Boost +1)
    moderate_keywords = {
        "kidney infection": "Potential Pyelonephritis (Kidney Infection)",
        "migraine": "Severe Acute Cephalea / Migraine",
        "animal bite": "Zoonotic Exposure / Animal Bite",
        "insect bite": "Insect Bite / Possible Allergic Reaction",
        "dehydration": "Severe Dehydration / Volume Depletion",
        "deep cut": "Severe Laceration requiring Sutures",
        "pneumonia": "Pneumonia / Lower Respiratory Infection"
    }
    for keyword, desc in moderate_keywords.items():
        if keyword in complaint_lower:
            boost += 1
            flags.append(f"⚠️ MODERATE ALERT: {desc}")
            notes.append(f"Rule Triggered: Moderate keyword match '{keyword}'")

    # RULE 9: Comorbidity Triggers
    if "heart" in history_lower or "cardiac" in history_lower or "hypertension" in history_lower:
        if any(k in complaint_lower for k in ["chest pain", "dizziness", "shortness of breath"]):
            boost += 3
            flags.append("🚨 SAFETY ALERT: Cardiorespiratory symptom in patient with Cardiac/Hypertension history")
            notes.append("Rule Triggered: Heart/Hypertension History + Cardiac Symptom")

    if "asthma" in history_lower or "copd" in history_lower:
        if any(k in complaint_lower for k in ["breath", "wheez", "cough"]):
            boost += 2
            flags.append("🚨 SAFETY ALERT: Acute respiratory symptom with comorbid Asthma/COPD history")
            notes.append("Rule Triggered: Asthma/COPD History + Respiratory Symptom")

    if "diabet" in history_lower:
        if any(k in complaint_lower for k in ["confus", "dizz", "thirst", "faint"]):
            boost += 2
            flags.append("🚨 SAFETY ALERT: Potential Diabetic Crisis (DKA/Hypoglycemia) with Diabetes history")
            notes.append("Rule Triggered: Diabetes History + Metabolic Symptom")

    # RULE 10: Age Risk Boosts
    if age is not None:
        if age >= 65:
            if any(k in complaint_lower for k in ["chest", "breath", "dizz", "fever"]):
                boost += 2
                flags.append("🚨 SAFETY ALERT: Geriatric patient presenting with high-risk clinical symptoms")
                notes.append(f"Rule Triggered: Age ({age}) ≥ 65 + Symptom")
        elif age <= 2:
            boost += 1
            flags.append("⚠️ SAFETY ALERT: Pediatric infant risk factor (<2 y/o)")
            notes.append(f"Rule Triggered: Age ({age}) <= 2")

    return RuleCheckResult(
        rule_score_boost=boost,
        rule_red_flags=flags,
        rule_notes=notes
    )
