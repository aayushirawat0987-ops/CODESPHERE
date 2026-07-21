"""
In-Memory / Persistent Patient Triage Storage
---------------------------------------------
Stores patient triage records and handles sorting, staff overrides, and queue management.
"""

import uuid
from datetime import datetime
from typing import List, Dict, Optional
import threading

from app.models import PatientIntake, TriageReasoning, RuleCheckResult, PatientRecord, StaffOverride, OverrideRequest, CalendarPatient, CalendarPatientCreate

class PatientStorage:
    def __init__(self):
        self._lock = threading.Lock()
        self._patients: Dict[str, PatientRecord] = {}

    def add_patient(self, intake: PatientIntake, ai_reasoning: TriageReasoning, rule_check: RuleCheckResult, created_at: Optional[str] = None) -> PatientRecord:
        with self._lock:
            patient_id = str(uuid.uuid4())[:8]
            if not created_at:
                created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # Calculate raw effective score = AI score + rule boost (capped between 1 and 10)
            raw_effective = ai_reasoning.urgency_score + rule_check.rule_score_boost
            effective_score = min(10, max(1, raw_effective))

            # Combine AI and Rule red flags without duplicates
            all_flags = []
            seen = set()
            for flag in (rule_check.rule_red_flags + ai_reasoning.red_flags):
                if flag not in seen:
                    all_flags.append(flag)
                    seen.add(flag)

            # Build rationale summary
            rule_summary = ""
            if rule_check.rule_notes:
                rule_summary = f" [Rule Engine: {'; '.join(rule_check.rule_notes)}]"
            combined_rationale = f"{ai_reasoning.rationale}{rule_summary}"

            record = PatientRecord(
                id=patient_id,
                created_at=created_at,
                name=intake.name,
                complaint=intake.complaint,
                pain_scale=intake.pain_scale,
                vitals=intake.vitals,
                ai_reasoning=ai_reasoning,
                rule_check=rule_check,
                effective_urgency_score=effective_score,
                all_red_flags=all_flags,
                combined_rationale=combined_rationale,
                is_overridden=False,
                override=None
            )

            self._patients[patient_id] = record
            return record

    def get_all_patients(self) -> List[PatientRecord]:
        with self._lock:
            # Sort by effective_urgency_score descending, then by created_at
            patients_list = list(self._patients.values())
            patients_list.sort(key=lambda p: (p.effective_urgency_score, p.created_at), reverse=True)
            return patients_list

    def get_patient(self, patient_id: str) -> Optional[PatientRecord]:
        with self._lock:
            return self._patients.get(patient_id)

    def apply_override(self, patient_id: str, req: OverrideRequest) -> Optional[PatientRecord]:
        with self._lock:
            patient = self._patients.get(patient_id)
            if not patient:
                return None

            override_info = StaffOverride(
                score=req.score,
                reason=req.reason,
                staff_name=req.staff_name or "ER Nurse"
            )

            patient.is_overridden = True
            patient.override = override_info
            patient.effective_urgency_score = req.score

            self._patients[patient_id] = patient
            return patient

    def clear(self):
        with self._lock:
            self._patients.clear()


# Global storage singleton instance
db = PatientStorage()

class CalendarStorage:
    def __init__(self):
        self._lock = threading.Lock()
        self._patients: Dict[str, CalendarPatient] = {}

    def add_patient(self, data: CalendarPatientCreate) -> CalendarPatient:
        with self._lock:
            patient_id = str(uuid.uuid4())[:8]
            record = CalendarPatient(
                id=patient_id,
                date=data.date,
                name=data.name,
                age=data.age,
                gender=data.gender,
                problem=data.problem
            )
            self._patients[patient_id] = record
            return record

    def get_all(self) -> List[CalendarPatient]:
        with self._lock:
            return list(self._patients.values())

    def update_patient(self, patient_id: str, data: CalendarPatientCreate) -> Optional[CalendarPatient]:
        with self._lock:
            if patient_id not in self._patients:
                return None
            record = CalendarPatient(
                id=patient_id,
                date=data.date,
                name=data.name,
                age=data.age,
                gender=data.gender,
                problem=data.problem
            )
            self._patients[patient_id] = record
            return record

    def delete_patient(self, patient_id: str) -> bool:
        with self._lock:
            if patient_id in self._patients:
                del self._patients[patient_id]
                return True
            return False

calendar_db = CalendarStorage()
