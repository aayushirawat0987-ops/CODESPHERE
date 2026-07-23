/**
 * Storage Layer: In-Memory Triage Queue & JSON File Calendar Storage (Zero Dependencies)
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

class PatientStorage {
  constructor() {
    this.patients = new Map();
  }

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

    this.patients.set(patientId, record);
    return record;
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
    const patient = this.patients.get(patientId);
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
    this.patients.set(patientId, patient);
    return patient;
  }

  updateTreatmentStatus(patientId, status) {
    const patient = this.patients.get(patientId);
    if (!patient) return null;

    const normalized = status === 'Dispensed' ? 'Treatment Completed' : status === 'Medicine Dispensed' ? 'Treatment Completed' : status;
    patient.treatment_status = normalized === 'Treatment Completed' ? 'Treatment Completed' : normalized;

    const message = normalized === 'Treatment Completed'
      ? 'Medicine dispensed and treatment completed.'
      : `${normalized} status updated by pharmacy.`;

    this.recordActivity(patient, message);
    this.patients.set(patientId, patient);
    return patient;
  }

  getAllPatients() {
    const list = Array.from(this.patients.values());
    list.sort((a, b) => {
      if (b.effective_urgency_score !== a.effective_urgency_score) {
        return b.effective_urgency_score - a.effective_urgency_score;
      }
      return b.created_at.localeCompare(a.created_at);
    });
    return list;
  }

  getPatient(patientId) {
    return this.patients.get(patientId) || null;
  }

  applyOverride(patientId, req) {
    const patient = this.patients.get(patientId);
    if (!patient) return null;

    const now = new Date();
    const overriddenAt = now.toISOString().replace("T", " ").substring(0, 19);

    const overrideInfo = {
      score: req.score,
      reason: req.reason,
      staff_name: req.staff_name || "ER Nurse",
      overridden_at: overriddenAt
    };

    patient.is_overridden = true;
    patient.override = overrideInfo;
    patient.effective_urgency_score = req.score;
    this.recordActivity(patient, `Staff override applied: ${req.reason}`);

    this.patients.set(patientId, patient);
    return patient;
  }

  clear() {
    this.patients.clear();
  }
}

class CalendarStorage {
  constructor(filePath = null) {
    if (!filePath) {
      filePath = path.join(__dirname, "calendar_patients.json");
    }
    this.filePath = filePath;
    this._initFile();
  }

  _initFile() {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]), "utf8");
    }
  }

  _readData() {
    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      return JSON.parse(raw) || [];
    } catch (e) {
      return [];
    }
  }

  _writeData(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf8");
  }

  async getAllPatients() {
    return this._readData();
  }

  async addPatient(patient) {
    const patientId = crypto.randomUUID().substring(0, 8);
    const data = this._readData();
    const newRecord = {
      id: patientId,
      name: patient.name,
      age: Number(patient.age),
      gender: patient.gender,
      problem: patient.problem,
      date: patient.date
    };
    data.push(newRecord);
    this._writeData(data);
    return newRecord;
  }

  async updatePatient(id, patient) {
    const data = this._readData();
    const idx = data.findIndex(p => p.id === id);
    if (idx === -1) return null;

    data[idx] = {
      id,
      name: patient.name,
      age: Number(patient.age),
      gender: patient.gender,
      problem: patient.problem,
      date: patient.date
    };
    this._writeData(data);
    return data[idx];
  }

  async deletePatient(id) {
    const data = this._readData();
    const filtered = data.filter(p => p.id !== id);
    if (filtered.length === data.length) return false;

    this._writeData(filtered);
    return true;
  }
}

const db = new PatientStorage();
const calendarDb = new CalendarStorage();

module.exports = { db, calendarDb };
