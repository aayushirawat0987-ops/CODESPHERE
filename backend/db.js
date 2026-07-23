/**
 * Vitalis MongoDB Engine (Mongoose + Persistent Sync)
 * ----------------------------------------------------
 * Connects to MongoDB (Local or MongoDB Atlas Cloud via MONGODB_URI)
 * Stores Users, Patients, AI Triage Intakes, Consultation Notes, Appointments,
 * Daily Statistics, and Audit Trail Logs in MongoDB Collections.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const DB_FILE = path.join(__dirname, 'vitalis_db.json');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vitalis_db';

const SEED_USERS = [
  {
    id: 'usr_doc_1',
    username: 'doctor',
    password: 'password123',
    name: 'Dr. Sarah Jenkins, MD',
    role: 'doctor',
    email: 's.jenkins@vitalis.org',
    phone: '+1 (555) 234-5678',
    department: 'Cardiology / Emergency'
  },
  {
    id: 'usr_nurse_1',
    username: 'nurse',
    password: 'password123',
    name: 'Nurse Mary Rivera, RN',
    role: 'nurse',
    email: 'm.rivera@vitalis.org',
    phone: '+1 (555) 876-5432',
    department: 'Emergency Triage'
  },
  {
    id: 'usr_pat_1',
    username: 'patient',
    password: 'password123',
    name: 'John Doe',
    role: 'patient',
    email: 'john.doe@example.com',
    phone: '+1 (555) 111-2233',
    department: 'Outpatient'
  },
  {
    id: 'usr_admin_1',
    username: 'admin',
    password: 'password123',
    name: 'Admin Supervisor Alex Vance',
    role: 'admin',
    email: 'admin@vitalis.org',
    phone: '+1 (555) 999-0000',
    department: 'Hospital Administration'
  }
];

// --- Mongoose Schemas ---
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patient_id: { type: String, default: null },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  department: { type: String, default: 'General' },
  created_at: { type: Date, default: Date.now }
});

const PatientSchema = new mongoose.Schema({
  patient_id: { type: String, required: true, unique: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  age: Number,
  gender: String,
  phone: String,
  email: String,
  blood_group: String,
  emergency_contact: String,
  medical_history: String,
  allergies: String,
  current_medications: String,
  registered_at: String
});

const TriageRecordSchema = new mongoose.Schema({
  id: { type: String, required: true },
  patient_id: { type: String, required: true },
  name: { type: String, required: true },
  age: Number,
  gender: String,
  complaint: String,
  pain_scale: Number,
  vitals: Object,
  effective_urgency_score: Number,
  is_overridden: Boolean,
  override: Object,
  combined_rationale: String,
  ai_reasoning: Object,
  all_red_flags: Array,
  qr_code_url: String,
  created_at: String
});

const ConsultationNoteSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patient_id: String,
  patient_name: String,
  author_id: String,
  author_name: String,
  author_role: String,
  note_type: String,
  title: String,
  content: String,
  created_at: String
});

const AppointmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patient_id: String,
  patient_name: String,
  age: Number,
  gender: String,
  doctor_id: String,
  doctor_name: String,
  department: String,
  problem: String,
  date: String,
  time: String,
  status: String,
  created_at: String
});

const AuditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  timestamp: String,
  date: String,
  userId: String,
  username: String,
  role: String,
  action: String,
  details: String
});

// Compile Models
let UserModel, PatientModel, TriageModel, NoteModel, AppointmentModel, AuditModel;
try {
  UserModel = mongoose.model('User', UserSchema);
  PatientModel = mongoose.model('Patient', PatientSchema);
  TriageModel = mongoose.model('TriageRecord', TriageRecordSchema);
  NoteModel = mongoose.model('ConsultationNote', ConsultationNoteSchema);
  AppointmentModel = mongoose.model('Appointment', AppointmentSchema);
  AuditModel = mongoose.model('AuditLog', AuditLogSchema);
} catch (e) {
  // Graceful fallback if models already registered
}

class DatabaseEngine {
  constructor() {
    this.isMongoConnected = false;
    this.data = {
      patient_id_counter: 1,
      users: [...SEED_USERS],
      patients: [],
      triage_records: [],
      visit_records: [],
      consultation_notes: [],
      appointments: [],
      audit_logs: [],
      daily_stats: {}
    };
    this.init();
    this.connectMongo();
  }

  async connectMongo() {
    try {
      console.log(`[MongoDB] Connecting to ${MONGODB_URI}...`);
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 4000
      });
      this.isMongoConnected = true;
      console.log('✅ [MongoDB] Connected successfully to Database Cluster!');
      this.syncMongoToMemory();
    } catch (err) {
      console.log(`ℹ️ [MongoDB] Connection note: ${err.message}. Operating in Persistent SQLite/JSON Sync mode.`);
    }
  }

  async syncMongoToMemory() {
    if (!this.isMongoConnected) return;
    try {
      const dbUsers = await UserModel.find({});
      if (dbUsers.length > 0) this.data.users = dbUsers;
      else await UserModel.insertMany(SEED_USERS);

      const dbPatients = await PatientModel.find({});
      if (dbPatients.length > 0) this.data.patients = dbPatients;

      const dbTriages = await TriageModel.find({});
      if (dbTriages.length > 0) this.data.triage_records = dbTriages;

      const dbNotes = await NoteModel.find({});
      if (dbNotes.length > 0) this.data.consultation_notes = dbNotes;

      const dbAppts = await AppointmentModel.find({});
      if (dbAppts.length > 0) this.data.appointments = dbAppts;

      const dbLogs = await AuditModel.find({});
      if (dbLogs.length > 0) this.data.audit_logs = dbLogs;

      console.log('[MongoDB] Synced collections to active memory engine.');
    } catch (err) {
      console.error('[MongoDB] Sync error:', err.message);
    }
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(fileContent);
        this.data = {
          patient_id_counter: parsed.patient_id_counter || 1,
          users: parsed.users || [...SEED_USERS],
          patients: parsed.patients || [],
          triage_records: parsed.triage_records || [],
          visit_records: parsed.visit_records || [],
          consultation_notes: parsed.consultation_notes || [],
          appointments: parsed.appointments || [],
          audit_logs: parsed.audit_logs || [],
          daily_stats: parsed.daily_stats || {}
        };
        console.log(`[DB] Loaded persistent DB file (${this.data.triage_records.length} triage records, Patient ID counter at ${this.data.patient_id_counter}).`);
      } else {
        this.save();
        console.log(`[DB] Initialized new persistent DB file.`);
      }
    } catch (err) {
      console.error('[DB] Load error:', err.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('[DB] Save error:', err.message);
    }
  }

  // Generate Automatic Patient ID: VIT-2026-000001
  generatePatientId() {
    const year = new Date().getFullYear();
    const countStr = String(this.data.patient_id_counter).padStart(6, '0');
    const patId = `VIT-${year}-${countStr}`;
    this.data.patient_id_counter += 1;
    this.save();
    return patId;
  }

  // --- Audit Logs ---
  logAction(userId, username, role, action, details) {
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      date: new Date().toISOString().split('T')[0],
      userId,
      username,
      role,
      action,
      details
    };
    this.data.audit_logs.unshift(logEntry);
    if (this.data.audit_logs.length > 500) this.data.audit_logs.pop();
    this.save();

    if (this.isMongoConnected && AuditModel) {
      AuditModel.create(logEntry).catch(e => console.error(e.message));
    }
    return logEntry;
  }

  getAuditLogs(limit = 100) {
    return this.data.audit_logs.slice(0, limit);
  }

  // --- Users & Auth ---
  findUserByUsername(username) {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  createUser(userData) {
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      patient_id: userData.role === 'patient' ? this.generatePatientId() : null,
      username: userData.username,
      password: userData.password || 'password123',
      name: userData.name,
      role: userData.role || 'patient',
      email: userData.email || '',
      phone: userData.phone || '',
      department: userData.department || 'General',
      created_at: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.logAction(newUser.id, newUser.username, newUser.role, 'USER_REGISTERED', `Created account ${newUser.name} (ID: ${newUser.patient_id || 'Staff'})`);
    this.save();

    if (this.isMongoConnected && UserModel) {
      UserModel.create(newUser).catch(e => console.error(e.message));
    }
    return newUser;
  }

  // --- Triage Records & Master Patient Register ---
  getPatients() {
    return [...this.data.triage_records].sort((a, b) => b.effective_urgency_score - a.effective_urgency_score);
  }

  getPatientById(id) {
    return this.data.triage_records.find(p => p.id === id || p.patient_id === id);
  }

  addTriageRecord(record) {
    let masterPat = this.data.patients.find(p => p.name.toLowerCase() === record.name.toLowerCase());
    let formattedPatId = masterPat ? masterPat.patient_id : this.generatePatientId();

    if (!masterPat) {
      masterPat = {
        patient_id: formattedPatId,
        id: record.id || `pat_${Date.now()}`,
        name: record.name,
        age: record.age,
        gender: record.gender,
        phone: record.phone || '+1 (555) 000-1122',
        email: record.email || `${record.name.toLowerCase().replace(/\s+/g, '')}@patient.com`,
        blood_group: record.blood_group || 'O+',
        emergency_contact: record.emergency_contact || '+1 (555) 999-8877',
        medical_history: record.medical_history,
        allergies: record.allergies,
        current_medications: record.current_medications,
        registered_at: record.created_at
      };
      this.data.patients.push(masterPat);
      if (this.isMongoConnected && PatientModel) {
        PatientModel.create(masterPat).catch(e => console.error(e.message));
      }
    }

    record.patient_id = formattedPatId;
    record.qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(formattedPatId)}`;

    const idx = this.data.triage_records.findIndex(p => p.id === record.id || (p.name === record.name && p.created_at === record.created_at));
    if (idx !== -1) {
      this.data.triage_records[idx] = record;
    } else {
      this.data.triage_records.unshift(record);
    }

    this.data.visit_records.unshift({
      visit_id: `vst_${Date.now()}`,
      patient_id: formattedPatId,
      patient_name: record.name,
      date_time: record.created_at,
      symptoms: record.complaint,
      department: record.ai_reasoning ? record.ai_reasoning.recommended_department : 'Emergency',
      ai_urgency_score: record.effective_urgency_score,
      status: record.effective_urgency_score >= 8 ? 'Critical' : 'Waiting'
    });

    this.updateDailyStats(record);
    this.logAction('system', 'System', 'system', 'TRIAGE_RECORD_ADDED', `Intake processed for ${record.name} (${formattedPatId}) - Urgency ${record.effective_urgency_score}/10`);
    this.save();

    if (this.isMongoConnected && TriageModel) {
      TriageModel.create(record).catch(e => console.error(e.message));
    }
    return record;
  }

  applyOverride(patientId, overrideData) {
    const patient = this.getPatientById(patientId);
    if (!patient) return null;

    patient.is_overridden = true;
    patient.override = overrideData;
    patient.effective_urgency_score = overrideData.score;
    patient.combined_rationale = `${patient.ai_reasoning ? patient.ai_reasoning.rationale : ''} [STAFF OVERRIDE by ${overrideData.staff_name}: Assigned Score ${overrideData.score}/10. Reason: ${overrideData.reason}]`;

    this.logAction('staff', overrideData.staff_name || 'Nurse', 'nurse', 'URGENCY_OVERRIDDEN', `Score for ${patient.patient_id || patientId} (${patient.name}) set to ${overrideData.score}/10`);
    this.save();

    if (this.isMongoConnected && TriageModel) {
      TriageModel.updateOne({ id: patient.id }, patient).catch(e => console.error(e.message));
    }
    return patient;
  }

  clearQueue() {
    this.data.triage_records = [];
    this.logAction('admin', 'Admin', 'admin', 'QUEUE_CLEARED', 'Cleared all triage queue records');
    this.save();
    if (this.isMongoConnected && TriageModel) {
      TriageModel.deleteMany({}).catch(e => console.error(e.message));
    }
  }

  // --- Patient History Timeline ---
  getPatientTimeline(patientId) {
    const patient = this.getPatientById(patientId);
    const patId = patient ? patient.patient_id : patientId;

    const notes = this.data.consultation_notes.filter(n => n.patient_id === patientId || n.patient_id === patId || (patient && n.patient_name === patient.name));
    const appts = this.data.appointments.filter(a => a.patient_id === patientId || a.patient_id === patId || (patient && a.patient_name === patient.name));

    const events = [];

    if (patient) {
      events.push({
        id: `evt_triage_${patient.id}`,
        type: 'triage_intake',
        title: 'Emergency Triage Evaluation',
        date: patient.created_at,
        details: `Assigned Urgency Score ${patient.effective_urgency_score}/10. Complaint: "${patient.complaint}" (Patient ID: ${patient.patient_id})`,
        data: patient
      });
    }

    notes.forEach(n => {
      events.push({
        id: n.id,
        type: n.note_type,
        title: n.title,
        date: n.created_at,
        author: `${n.author_name} (${n.author_role})`,
        details: n.content,
        data: n
      });
    });

    appts.forEach(a => {
      events.push({
        id: a.id,
        type: 'appointment',
        title: `Appointment with ${a.doctor_name}`,
        date: `${a.date} ${a.time}`,
        details: `Status: ${a.status}. Department: ${a.department}`,
        data: a
      });
    });

    return events.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  addConsultationNote(noteData) {
    const note = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      patient_id: noteData.patient_id,
      patient_name: noteData.patient_name,
      author_id: noteData.author_id || 'usr_doc_1',
      author_name: noteData.author_name || 'Dr. Sarah Jenkins',
      author_role: noteData.author_role || 'doctor',
      note_type: noteData.note_type || 'doctor_diagnosis',
      title: noteData.title || 'Clinical Consultation Note',
      content: noteData.content,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.data.consultation_notes.unshift(note);
    this.logAction(note.author_id, note.author_name, note.author_role, 'NOTE_ADDED', `Added ${note.note_type} for ${note.patient_name}`);
    this.save();

    if (this.isMongoConnected && NoteModel) {
      NoteModel.create(note).catch(e => console.error(e.message));
    }
    return note;
  }

  // --- Appointments ---
  getAppointments() {
    return this.data.appointments;
  }

  addAppointment(apptData) {
    const patId = apptData.patient_id || this.generatePatientId();
    const appt = {
      id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      patient_id: patId,
      patient_name: apptData.name,
      age: apptData.age,
      gender: apptData.gender,
      doctor_id: apptData.doctor_id || 'usr_doc_1',
      doctor_name: apptData.doctor_name || 'Dr. Sarah Jenkins',
      department: apptData.department || 'General Medicine',
      problem: apptData.problem,
      date: apptData.date,
      time: apptData.time || '10:00 AM',
      status: 'Scheduled',
      created_at: new Date().toISOString()
    };
    this.data.appointments.unshift(appt);
    this.logAction('staff', 'Staff', 'nurse', 'APPOINTMENT_CREATED', `Appointment scheduled for ${appt.patient_name} (${patId}) on ${appt.date}`);
    this.save();

    if (this.isMongoConnected && AppointmentModel) {
      AppointmentModel.create(appt).catch(e => console.error(e.message));
    }
    return appt;
  }

  // --- Daily Statistics ---
  updateDailyStats(record) {
    const today = new Date().toISOString().split('T')[0];
    if (!this.data.daily_stats[today]) {
      this.data.daily_stats[today] = {
        date: today,
        registered_count: 0,
        emergency_count: 0,
        admitted_count: 0,
        discharged_count: 0,
        override_count: 0,
        symptoms_tally: {}
      };
    }
    const stat = this.data.daily_stats[today];
    stat.registered_count += 1;
    if (record.effective_urgency_score >= 8) stat.emergency_count += 1;
    if (record.is_overridden) stat.override_count += 1;

    const symptoms = record.ai_reasoning ? (record.ai_reasoning.extracted_symptoms || []) : [];
    symptoms.forEach(s => {
      stat.symptoms_tally[s] = (stat.symptoms_tally[s] || 0) + 1;
    });
  }

  getDailyStats(dateStr) {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    return this.data.daily_stats[targetDate] || {
      date: targetDate,
      registered_count: 0,
      emergency_count: 0,
      admitted_count: 0,
      discharged_count: 0,
      override_count: 0,
      symptoms_tally: {}
    };
  }
}

const db = new DatabaseEngine();
module.exports = db;
