"""
Claude AI Triage Reasoning Engine
----------------------------------
Uses Anthropic's Claude API to assess patient chief complaints and vitals.
Enforces strict JSON response format, safe Markdown fence stripping, and fallback mock execution.
"""

import json
import re
import logging
from typing import Dict, Any
import anthropic

from app.config import ANTHROPIC_API_KEY, CLAUDE_MODEL
from app.models import PatientIntake, TriageReasoning

logger = logging.getLogger("triage_ai")

SYSTEM_PROMPT = """You are Vitalis, a Clinical Intake Decision-Support Assistant for ER and Urgent Care triage nurses.
You assist hospital staff by assessing incoming patient information and providing an initial urgency score, key red flags, and plain-language clinical rationale.

IMPORTANT CONSTRAINTS & GUIDELINES:
1. THIS IS A DECISION-SUPPORT TOOL, NOT A DIAGNOSTIC TOOL. Never phrase your output or rationale as a definitive diagnosis or medical claim. Use phrasing like "symptoms suggest", "requires evaluation for", "indicates potential", or "may present risk of".
2. Assess urgency on a scale of 1 to 10:
   - 1-3: Low Urgency / Non-Urgent (minor cuts, mild cold symptoms, routine prescription refill)
   - 4-7: Moderate Urgency (moderate pain, persistent fever, minor fractures, abdominal pain without distress)
   - 8-10: High / Critical Urgency (chest pain, severe respiratory distress, acute trauma, stroke symptoms, uncontrolled severe pain)
3. You MUST reply ONLY with a raw, valid JSON object matching this EXACT schema:
{
  "urgency_score": <integer from 1 to 10>,
  "red_flags": [<string>, <string>],
  "rationale": "<1-2 sentence plain-language clinical explanation>"
}
4. Do NOT include any markdown formatting, preambles, explanations, or commentary outside of the raw JSON object.
"""

def extract_json_from_text(text: str) -> str:
    """
    Strips Markdown code block wrappers (e.g., ```json ... ```) and extracts raw JSON text.
    """
    text = text.strip()
    # Remove markdown code blocks if present
    if text.startswith("```"):
        # Remove opening ```json or ```
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        # Remove closing ```
        text = re.sub(r"\s*```$", "", text)
    
    # Locate first '{' and last '}' in case extra tokens surround it
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        text = text[start_idx : end_idx + 1]
    
    return text.strip()


def mock_triage_fallback(intake: PatientIntake, reason: str = "Fallback AI Reasoning") -> TriageReasoning:
    """
    Heuristic fallback engine used when Claude API key is absent, rate-limited, or output fails parsing.
    Guarantees reliable application behavior during offline or demo conditions.
    """
    c = intake.complaint.lower()
    pain = intake.pain_scale
    vitals = intake.vitals
    
    score = 3
    red_flags = []
    
    # Urgent condition heuristics
    if any(k in c for k in ["chest pain", "heart", "cardiac", "stroke", "numbness", "unresponsive", "bleeding profusely"]):
        score = 9
        red_flags.append("High-risk acuity: Potential cardiovascular / neurological event")
    elif any(k in c for k in ["shortness of breath", "difficulty breathing", "asthma attack", "choking"]):
        score = 8
        red_flags.append("High-risk acuity: Airway / respiratory distress")
    elif any(k in c for k in ["severe pain", "fracture", "abdominal pain", "kidney stone", "burn"]):
        score = 6
        red_flags.append("Moderate acuity: Pain management & diagnostic workup needed")
    elif pain >= 8:
        score = max(score, 7)
        red_flags.append("Elevated pain score (8+/10)")
    
    # Vitals influence
    if vitals and vitals.heart_rate and vitals.heart_rate > 110:
        score = max(score, score + 1)
        red_flags.append("Elevated resting heart rate")
    if vitals and vitals.temperature and vitals.temperature > 101.5:
        score = max(score, score + 1)
        red_flags.append("Pyrexia / Elevated body temperature")

    score = min(10, max(1, score))
    
    if not red_flags:
        red_flags = ["Standard triage assessment recommended"]

    rationale = f"Symptom profile presents with {score}/10 estimated urgency based on reported complaint '{intake.complaint}' and pain level {pain}/10. ({reason})"

    return TriageReasoning(
        urgency_score=score,
        red_flags=red_flags,
        rationale=rationale
    )


def evaluate_patient_ai(intake: PatientIntake) -> TriageReasoning:
    """
    Main AI reasoning function. Calls Anthropic Claude API if key is available,
    otherwise falls back gracefully to local heuristic mock.
    """
    if not ANTHROPIC_API_KEY:
        logger.info("No ANTHROPIC_API_KEY set. Operating in local heuristic mock mode.")
        return mock_triage_fallback(intake, "Mock AI Engine - API Key Not Configured")

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        
        vitals_text = "Not provided"
        if intake.vitals:
            v_parts = []
            if intake.vitals.heart_rate: v_parts.append(f"Heart Rate: {intake.vitals.heart_rate} bpm")
            if intake.vitals.temperature: v_parts.append(f"Temperature: {intake.vitals.temperature}°F")
            if intake.vitals.blood_pressure: v_parts.append(f"Blood Pressure: {intake.vitals.blood_pressure}")
            if v_parts:
                vitals_text = ", ".join(v_parts)

        user_content = f"""Patient Intake Summary:
- Name: {intake.name}
- Chief Complaint: {intake.complaint}
- Self-Reported Pain Scale: {intake.pain_scale}/10
- Vitals: {vitals_text}

Provide JSON triage decision-support object."""

        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=300,
            system=SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": user_content}
            ]
        )

        response_text = response.content[0].text
        logger.debug(f"Raw Claude API response: {response_text}")

        # Clean markdown fences and parse JSON safely
        clean_json_str = extract_json_from_text(response_text)
        data = json.loads(clean_json_str)

        # Validate mandatory keys
        score = int(data.get("urgency_score", 5))
        score = min(10, max(1, score))
        red_flags = data.get("red_flags", [])
        if isinstance(red_flags, str):
            red_flags = [red_flags]
        rationale = data.get("rationale", "Assessment generated from patient complaint and vitals.")

        return TriageReasoning(
            urgency_score=score,
            red_flags=red_flags,
            rationale=rationale
        )

    except Exception as e:
        logger.error(f"Claude API evaluation failed or returned malformed JSON: {e}")
        return mock_triage_fallback(intake, f"AI Fallback active due to API parsing issue: {str(e)[:50]}")
