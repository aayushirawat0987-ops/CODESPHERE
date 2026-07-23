# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class Vitals(BaseModel):
    heart_rate: Optional[int] = Field(default=None, description="Heart rate in bpm")
    temperature: Optional[float] = Field(default=None, description="Temperature in Fahrenheit")
    blood_pressure: Optional[str] = Field(default=None, description="Blood pressure e.g. '120/80'")

class PatientIntake(BaseModel):
    name: str = Field(..., description="Patient full name")
    complaint: str = Field(..., description="Primary chief complaint described in patient's words")
    pain_scale: int = Field(..., ge=1, le=10, description="Pain score from 1 to 10")
    vitals: Optional[Vitals] = Field(default_factory=Vitals)
    age: Optional[int] = Field(default=None, ge=0, le=150, description="Patient age in years")
    gender: Optional[str] = Field(default=None, description="Patient gender")
    medical_history: Optional[str] = Field(default=None, description="Pre-existing diseases or medical history")
    allergies: Optional[str] = Field(default=None, description="Known allergies")
    current_medications: Optional[str] = Field(default=None, description="Active medications")

class TriageReasoning(BaseModel):
    urgency_score: int = Field(..., ge=1, le=10, description="AI calculated urgency score (1-10)")
    extracted_symptoms: List[str] = Field(default_factory=list, description="Dynamically extracted symptoms")
    symptom_urgency_contributions: List[str] = Field(default_factory=list, description="Detailed explanation of symptom score contributions")
    possible_clinical_concerns: List[str] = Field(default_factory=list, description="Multi-item differential clinical possibilities")
    recommended_department: str = Field(default="General Triage", description="Recommended hospital department")
    recommended_next_steps: List[str] = Field(default_factory=list, description="Actionable recommended next clinical steps")
    red_flags: List[str] = Field(default_factory=list, description="Identified red flag symptoms")
    confidence_level: str = Field(default="High", description="AI confidence score ('High' | 'Medium' | 'Low')")
    rationale: str = Field(..., description="Plain-language clinical reasoning explanation")
    disclaimer: str = Field(default="Clinical Decision Support Only - Not a Medical Diagnosis")

class RuleCheckResult(BaseModel):
    rule_score_boost: int = 0
    rule_red_flags: List[str] = Field(default_factory=list)
    rule_notes: List[str] = Field(default_factory=list)

class StaffOverride(BaseModel):
    score: int = Field(..., ge=1, le=10, description="Manually assigned staff urgency score")
    reason: str = Field(..., description="Reason for staff override")
    staff_name: str = Field(default="ER Nurse", description="Name/ID of staff member overriding")
    overridden_at: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

class PatientRecord(BaseModel):
    id: str
    created_at: str
    name: str
    complaint: str
    pain_scale: int
    vitals: Vitals
    ai_reasoning: TriageReasoning
    rule_check: RuleCheckResult
    effective_urgency_score: int
    all_red_flags: List[str]
    combined_rationale: str
    is_overridden: bool = False
    override: Optional[StaffOverride] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    medical_history: Optional[str] = None
    allergies: Optional[str] = None
    current_medications: Optional[str] = None


class OverrideRequest(BaseModel):
    score: int = Field(..., ge=1, le=10)
    reason: str = Field(...)
    staff_name: Optional[str] = "ER Nurse"

class CalendarPatientIntake(BaseModel):
    name: str = Field(..., description="Patient full name")
    age: int = Field(..., ge=0, le=150, description="Patient age")
    gender: str = Field(..., description="Patient gender")
    problem: str = Field(..., description="One-word patient problem description")
    date: str = Field(..., description="Date of appointment YYYY-MM-DD")

class CalendarPatientRecord(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    problem: str
    date: str


class FaceAnalysisRequest(BaseModel):
    image_base64: Optional[str] = None
    pain_scale: Optional[int] = 5
    facial_droop: Optional[bool] = False
    pallor: Optional[bool] = False


class FaceObservationDetail(BaseModel):
    observation: str
    status: str
    severity: str
    explanation: str


class FaceAnalysisResult(BaseModel):
    facial_pain_score: int
    distress_level: str
    stroke_asymmetry_risk: str
    detected_expression: str
    observations_breakdown: List[Dict[str, Any]] = Field(default_factory=list)
    red_flags: List[str]
    recommendations: List[str]
    confidence: str
    ai_vision_mode: str
