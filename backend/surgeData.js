/**
 * Surge Simulation Patient Dataset
 * --------------------------------
 * 9 realistic demo patients mixing low, moderate, and high urgency multi-symptom complaints.
 * Demonstrates dynamic triage, multi-symptom evaluation, and queue re-ordering live.
 */

const SURGE_PATIENTS = [
  {
    name: "Mark Evans",
    age: 29,
    gender: "Male",
    complaint: "Twisted right ankle while stepping off curb with moderate swelling and bruising.",
    pain_scale: 4,
    vitals: { heart_rate: 72, temperature: 98.6, blood_pressure: "120/78" },
    medical_history: "None"
  },
  {
    name: "Sarah Jenkins",
    age: 64,
    gender: "Female",
    complaint: "Substernal chest pressure radiating to left shoulder accompanied by shortness of breath and diaphoresis.",
    pain_scale: 8,
    vitals: { heart_rate: 105, temperature: 99.1, blood_pressure: "148/94" },
    medical_history: "Hypertension, Hyperlipidemia"
  },
  {
    name: "David Ross",
    age: 42,
    gender: "Male",
    complaint: "Persistent fever for 3 days, severe headache, muscle aches, and repeated vomiting.",
    pain_scale: 6,
    vitals: { heart_rate: 98, temperature: 102.4, blood_pressure: "124/82" },
    medical_history: "None"
  },
  {
    name: "Elena Rostova",
    age: 71,
    gender: "Female",
    complaint: "Post-surgical fever, chills, dizziness, lethargy, and warm abdominal incision site.",
    pain_scale: 7,
    vitals: { heart_rate: 128, temperature: 102.2, blood_pressure: "105/65" },
    medical_history: "Diabetes Mellitus Type 2"
  },
  {
    name: "Arthur Pendelton",
    age: 58,
    gender: "Male",
    complaint: "Sudden thunderclap headache, visual blurriness, neck stiffness, and light sensitivity.",
    pain_scale: 9,
    vitals: { heart_rate: 94, temperature: 98.4, blood_pressure: "178/108" },
    medical_history: "Hypertension"
  },
  {
    name: "Chloe Bennett",
    age: 24,
    gender: "Female",
    complaint: "Widespread skin rash, hives, facial swelling, and mild throat itching after eating seafood.",
    pain_scale: 5,
    vitals: { heart_rate: 92, temperature: 98.6, blood_pressure: "114/72" },
    medical_history: "Known Peanut Allergy"
  },
  {
    name: "Robert Taylor",
    age: 35,
    gender: "Male",
    complaint: "Severe right lower quadrant abdominal pain, nausea, loss of appetite, and low-grade fever.",
    pain_scale: 8,
    vitals: { heart_rate: 98, temperature: 100.6, blood_pressure: "132/85" },
    medical_history: "None"
  },
  {
    name: "Maria Garcia",
    age: 68,
    gender: "Female",
    complaint: "Severe pounding headache, dizziness, nausea, and nosebleed.",
    pain_scale: 7,
    vitals: { heart_rate: 92, temperature: 98.7, blood_pressure: "192/122" },
    medical_history: "Hypertension"
  },
  {
    name: "Liam Miller",
    age: 51,
    gender: "Male",
    complaint: "Severe lower back pain radiating to groin, painful blood-tinged urination, and vomiting.",
    pain_scale: 9,
    vitals: { heart_rate: 102, temperature: 99.0, blood_pressure: "140/88" },
    medical_history: "History of Kidney Stones"
  }
];

module.exports = { SURGE_PATIENTS };
