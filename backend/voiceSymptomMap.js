/**
 * Voice Symptom Map Dataset
 * -------------------------
 * Keyword mapping for voice-based symptom analysis triage support.
 */

const VOICE_SYMPTOM_MAP = [
  {
    keywords: ["chest pain", "heart", "cardiac", "heart attack", "myocardial"],
    problem: "Possible Cardiac Event",
    severity: "Critical",
    score: 10,
    recs: ["Immediate ECG", "Cardiac enzyme panel", "Call cardiologist"]
  },
  {
    keywords: ["can't breathe", "difficulty breathing", "shortness of breath", "choking", "asthma", "respiratory"],
    problem: "Respiratory Distress",
    severity: "Critical",
    score: 9,
    recs: ["Check SpO2", "Administer O2", "Prep bronchodilator"]
  },
  {
    keywords: ["stroke", "can't speak", "face drooping", "numbness", "paralysis", "slurred"],
    problem: "Possible Stroke / Neurological Event",
    severity: "Critical",
    score: 10,
    recs: ["FAST assessment", "Immediate CT scan", "Neurology consult"]
  },
  {
    keywords: ["unconscious", "unresponsive", "fainted", "collapsed", "not waking"],
    problem: "Loss of Consciousness",
    severity: "Critical",
    score: 10,
    recs: ["Check airway", "GCS assessment", "IV access"]
  },
  {
    keywords: ["severe pain", "unbearable pain", "pain 10", "excruciating"],
    problem: "Severe Pain Management",
    severity: "High",
    score: 8,
    recs: ["Pain scale assessment", "Analgesic protocol", "Identify source"]
  },
  {
    keywords: ["bleeding", "hemorrhage", "blood loss", "wound", "laceration"],
    problem: "Active Hemorrhage / Trauma",
    severity: "High",
    score: 8,
    recs: ["Apply pressure", "Blood type & cross", "Surgical consult"]
  },
  {
    keywords: ["fever", "high temperature", "burning up", "chills", "sweating", "infection"],
    problem: "Fever / Possible Infection",
    severity: "Moderate",
    score: 6,
    recs: ["Temperature check", "CBC & culture", "Antipyretics"]
  },
  {
    keywords: ["vomiting", "nausea", "throwing up", "stomach", "abdominal pain", "belly pain"],
    problem: "Gastrointestinal Distress",
    severity: "Moderate",
    score: 5,
    recs: ["Abdominal exam", "Fluid balance", "GI workup if persistent"]
  },
  {
    keywords: ["headache", "migraine", "head pain", "pounding head"],
    problem: "Headache / Possible Migraine",
    severity: "Moderate",
    score: 5,
    recs: ["Neurological screen", "Blood pressure check", "Analgesics"]
  },
  {
    keywords: ["fracture", "broken bone", "can't move", "injury", "trauma", "fall", "accident"],
    problem: "Musculoskeletal Injury / Fracture",
    severity: "Moderate",
    score: 6,
    recs: ["X-ray", "Immobilize limb", "Pain management"]
  },
  {
    keywords: ["dizzy", "dizziness", "vertigo", "lightheaded", "balance"],
    problem: "Dizziness / Vertigo",
    severity: "Low",
    score: 4,
    recs: ["BP check", "ENT assessment", "Hydration status"]
  },
  {
    keywords: ["rash", "allergic", "itching", "swelling", "hives", "allergy"],
    problem: "Allergic Reaction / Dermatological",
    severity: "Moderate",
    score: 6,
    recs: ["Check for anaphylaxis", "Antihistamines", "EpiPen if severe"]
  },
  {
    keywords: ["cough", "cold", "sore throat", "runny nose", "sneezing"],
    problem: "Upper Respiratory Illness",
    severity: "Low",
    score: 3,
    recs: ["Symptomatic treatment", "Rest and fluids", "COVID screening if applicable"]
  },
  {
    keywords: ["anxiety", "panic", "stress", "mental", "depression", "suicidal", "harm"],
    problem: "Mental Health Crisis",
    severity: "High",
    score: 7,
    recs: ["Safe environment", "Psychiatric consult", "Risk assessment"]
  },
  {
    keywords: ["diabetes", "blood sugar", "insulin", "hypoglycemia", "hyperglycemia"],
    problem: "Diabetic Emergency",
    severity: "High",
    score: 8,
    recs: ["Blood glucose test", "IV dextrose or insulin", "Endocrinology"]
  }
];

module.exports = { VOICE_SYMPTOM_MAP };
