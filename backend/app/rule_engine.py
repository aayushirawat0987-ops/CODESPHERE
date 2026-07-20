"""
Rule-Based Cross-Check Layer for Triage Safety
------------------------------------------------
Provides deterministic, rule-based clinical safety guardrails on top of LLM recommendations.
Ensures vital sign threshold anomalies automatically boost urgency scores and surface clinical red flags.
"""

from app.models import Vitals, RuleCheckResult

def evaluate_clinical_rules(vitals: Vitals, pain_scale: int, complaint: str) -> RuleCheckResult:
    """
    Evaluates patient vitals, pain score, and chief complaint keywords against deterministic safety rules.
    Returns score boost, additional red flags, and rule notes.
    """
    boost = 0
    flags = []
    notes = []

    hr = vitals.heart_rate
    temp = vitals.temperature
    bp_str = vitals.blood_pressure

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

    # RULE 6: High-Risk Keyword Auto-Flags (Chest pain, Shortness of breath, Stroke signs)
    complaint_lower = complaint.lower()
    critical_keywords = {
        "chest pain": "Critical Symptom: Chest Pain",
        "shortness of breath": "Critical Symptom: Respiratory Distress",
        "difficulty breathing": "Critical Symptom: Respiratory Distress",
        "numbness": "Critical Symptom: Potential Neurological Deficit",
        "slurred speech": "Critical Symptom: Potential Stroke / CVA",
        "fainting": "Critical Symptom: Syncope",
        "unresponsive": "Critical Symptom: Altered Mental Status"
    }

    for keyword, flag_desc in critical_keywords.items():
        if keyword in complaint_lower:
            flags.append(f"⚡ High-Risk Flag: {flag_desc}")
            notes.append(f"Rule Triggered: Keyword match '{keyword}'")

    return RuleCheckResult(
        rule_score_boost=boost,
        rule_red_flags=flags,
        rule_notes=notes
    )
