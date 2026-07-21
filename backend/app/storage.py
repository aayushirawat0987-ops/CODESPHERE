"""
In-Memory / Persistent Patient Triage Storage
---------------------------------------------
Stores patient triage records and handles sorting, staff overrides, and queue management.
CalendarStorage uses JSON file persistence to survive server restarts.
"""

import uuid
import sqlite3
import os
from datetime import datetime
from typing import List, Dict, Optional
import threading

from app.models import (
    PatientIntake, TriageReasoning, RuleCheckResult, PatientRecord,
    StaffOverride, OverrideRequest, CalendarPatientIntake, CalendarPatientRecord
)

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
                override=None,
                age=intake.age,
                gender=intake.gender,
                medical_history=intake.medical_history,
                allergies=intake.allergies,
                current_medications=intake.current_medications
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

<<<<<<< HEAD

class CalendarStorage:
    """
    Persistent calendar storage backed by a JSON file.
    Survives server restarts — all CRUD operations are written to disk immediately.
    """
    def __init__(self):
        self._lock = threading.Lock()
        self._patients: Dict[str, CalendarPatient] = {}
        self._load_from_disk()

    def _load_from_disk(self):
        """Load existing calendar data from JSON file on startup."""
        if os.path.exists(CALENDAR_DATA_FILE):
            try:
                with open(CALENDAR_DATA_FILE, "r", encoding="utf-8") as f:
                    raw = json.load(f)
                    for item in raw:
                        record = CalendarPatient(**item)
                        self._patients[record.id] = record
            except Exception as e:
                print(f"[CalendarStorage] Warning: failed to load {CALENDAR_DATA_FILE}: {e}")

    def _save_to_disk(self):
        """Write current state to JSON file. Must be called while holding the lock."""
        try:
            data = [p.model_dump() for p in self._patients.values()]
            with open(CALENDAR_DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[CalendarStorage] Warning: failed to save {CALENDAR_DATA_FILE}: {e}")

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
            self._save_to_disk()
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
            self._save_to_disk()
            return record

    def delete_patient(self, patient_id: str) -> bool:
        with self._lock:
            if patient_id in self._patients:
                del self._patients[patient_id]
                self._save_to_disk()
                return True
            return False


calendar_db = CalendarStorage()
=======
class CalendarStorage:
    def __init__(self, db_path=None):
        if db_path is None:
            # Place calendar.db in the parent directory of this file (i.e. 'backend/calendar.db')
            db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "calendar.db")
        self.db_path = db_path
        self._lock = threading.Lock()
        self._init_db()

    def _init_db(self):
        with self._lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS calendar_patients (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        age INTEGER NOT NULL,
                        gender TEXT NOT NULL,
                        problem TEXT NOT NULL,
                        date TEXT NOT NULL
                    )
                """)
                conn.commit()

    def add_patient(self, patient: CalendarPatientIntake) -> CalendarPatientRecord:
        with self._lock:
            patient_id = str(uuid.uuid4())[:8]
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO calendar_patients (id, name, age, gender, problem, date) VALUES (?, ?, ?, ?, ?, ?)",
                    (patient_id, patient.name, patient.age, patient.gender, patient.problem, patient.date)
                )
                conn.commit()
            return CalendarPatientRecord(
                id=patient_id,
                name=patient.name,
                age=patient.age,
                gender=patient.gender,
                problem=patient.problem,
                date=patient.date
            )

    def get_all_patients(self) -> List[CalendarPatientRecord]:
        with self._lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT id, name, age, gender, problem, date FROM calendar_patients")
                rows = cursor.fetchall()
                return [
                    CalendarPatientRecord(id=row[0], name=row[1], age=row[2], gender=row[3], problem=row[4], date=row[5])
                    for row in rows
                ]

    def update_patient(self, patient_id: str, patient: CalendarPatientIntake) -> Optional[CalendarPatientRecord]:
        with self._lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "UPDATE calendar_patients SET name = ?, age = ?, gender = ?, problem = ?, date = ? WHERE id = ?",
                    (patient.name, patient.age, patient.gender, patient.problem, patient.date, patient_id)
                )
                conn.commit()
                if cursor.rowcount == 0:
                    return None
            return CalendarPatientRecord(
                id=patient_id,
                name=patient.name,
                age=patient.age,
                gender=patient.gender,
                problem=patient.problem,
                date=patient.date
            )

    def delete_patient(self, patient_id: str) -> bool:
        with self._lock:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM calendar_patients WHERE id = ?", (patient_id,))
                conn.commit()
                return cursor.rowcount > 0

# Calendar database singleton instance
calendar_db = CalendarStorage()

>>>>>>> da19188f27e6a05b1e8cb7108e3dacc4482b82e7
