/**
 * Storage Layer: File-backed Persistent Storage linked to db.js
 */

const crypto = require("crypto");
const db = require("./db");

class PatientStorage {
  addPatient(intake, aiReasoning, ruleCheck, createdAt = null) {
    const patientId = crypto.randomUUID().substring(0, 8);
    if (!createdAt) {
      const now = new Date();
      createdAt = now.toISOString().replace("T", " ").substring(0, 19);
    }

    const rawEffective = aiReasoning.urgency_score + (ruleCheck.rule_score_boost || 0);
    const effectiveScore = Math.min(10, Math.max(1, rawEffective));

    // Combine red flags without duplicates
    const allFlags = [];
    const seen = new Set();
    const combinedFlags = [...(ruleCheck.rule_red_flags || []), ...(aiReasoning.red_flags || [])];
    for (const flag of combinedFlags) {
      if (!seen.has(flag)) {
        allFlags.push(flag);
        seen.add(flag);
      }
    }

    let ruleSummary = "";
    if (ruleCheck.rule_notes && ruleCheck.rule_notes.length > 0) {
      ruleSummary = ` [Rule Engine: ${ruleCheck.rule_notes.join("; ")}]`;
    }
    const combinedRationale = `${aiReasoning.rationale}${ruleSummary}`;

    const record = {
      id: patientId,
      created_at: createdAt,
      name: intake.name,
      complaint: intake.complaint,
      pain_scale: intake.pain_scale,
      vitals: intake.vitals || {},
      ai_reasoning: aiReasoning,
      rule_check: ruleCheck,
      effective_urgency_score: effectiveScore,
      all_red_flags: allFlags,
      combined_rationale: combinedRationale,
      is_overridden: false,
      override: null,
      age: intake.age || null,
      gender: intake.gender || null,
      medical_history: intake.medical_history || null,
      allergies: intake.allergies || null,
      current_medications: intake.current_medications || null,
      treatment_status: 'Waiting',
      prescription: null,
      activity_log: []
    };

    return db.addTriageRecord(record);
  }

  recordActivity(patient, message) {
    if (!patient) return;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    patient.activity_log = patient.activity_log || [];
    patient.activity_log.unshift({
      time: now,
      message
    });
  }

  addPrescription(patientId, prescription) {
    const patient = db.getPatientById(patientId);
    if (!patient) return null;

    const safePrescription = {
      medicine_name: prescription.medicine_name || '',
      dosage: prescription.dosage || '',
      frequency: prescription.frequency || '',
      duration: prescription.duration || '',
      notes: prescription.notes || '',
      follow_up: prescription.follow_up || ''
    };

    patient.prescription = safePrescription;
    patient.treatment_status = 'Medication Ordered';
    this.recordActivity(patient, 'Prescription sent to pharmacy.');
    db.save();
    return patient;
  }

  updateTreatmentStatus(patientId, status) {
    const patient = db.getPatientById(patientId);
    if (!patient) return null;

    const normalized = status === 'Dispensed' ? 'Treatment Completed' : status === 'Medicine Dispensed' ? 'Treatment Completed' : status;
    patient.treatment_status = normalized === 'Treatment Completed' ? 'Treatment Completed' : normalized;

    const message = normalized === 'Treatment Completed'
      ? 'Medicine dispensed and treatment completed.'
      : `${normalized} status updated by pharmacy.`;

    this.recordActivity(patient, message);
    db.save();
    return patient;
  }

  getAllPatients() {
    return db.getPatients();
  }

  getPatient(patientId) {
    return db.getPatientById(patientId);
  }

  applyOverride(patientId, req) {
    const now = new Date();
    const overriddenAt = now.toISOString().replace("T", " ").substring(0, 19);

    const overrideInfo = {
      score: req.score,
      reason: req.reason,
      staff_name: req.staff_name || "ER Nurse",
      overridden_at: overriddenAt
    };

    return db.applyOverride(patientId, overrideInfo);
  }

  clearQueue() {
    db.clearQueue();
  }
}

class CalendarStorage {
  getAllCalendarPatients() {
    return db.getAppointments();
  }

  addCalendarPatient(intake) {
    return db.addAppointment(intake);
  }
}

module.exports = {
  PatientStorage,
  CalendarStorage
};
