/**
 * Multilingual Voice Symptom NLP Engine & Dataset
 * ------------------------------------------------
 * Dynamically extracts all symptoms from spoken natural language transcripts,
 * analyzes multi-symptom combinations, and returns structured clinical decision-support summaries.
 */

const VOICE_SYMPTOM_ENTRIES = [
  {
    category: "Chest Pain / Cardiac",
    keywords: ["chest pain", "heart", "cardiac", "heart attack", "myocardial", "chest pressure", "dolor de pecho", "corazón", "छाती में दर्द", "हार्ट अटैक", "douleur thoracique", "brustschmerzen", "胸痛", "ألم في الصدر", "боль в груди"],
    score: 4,
    dept: "Cardiology / Emergency Department",
    concerns: ["May indicate Acute Coronary Syndrome (ACS) or Myocardial Ischemia", "Suggests possibility of Angina Pectoris or Pericarditis"],
    recs: ["Stat 12-lead ECG", "Cardiac Troponin enzyme panel", "Telemetry monitoring"]
  },
  {
    category: "Shortness of Breath / Respiratory",
    keywords: ["can't breathe", "difficulty breathing", "shortness of breath", "choking", "asthma", "wheezing", "dyspnea", "no puedo respirar", "falta de aire", "सांस लेने में तकलीफ", "difficulté à respirer", "atemnot", "呼吸困难", "صعوبة في التنفس", "одышка"],
    score: 3,
    dept: "Emergency Respiratory Unit",
    concerns: ["May indicate Acute Respiratory Distress or Asthma Exacerbation", "Suggests possibility of Pneumonia or Pulmonary Embolism"],
    recs: ["Immediate SpO2 pulse oximetry", "Administer supplemental O2", "Chest X-Ray / ABG"]
  },
  {
    category: "Neurological / Stroke Signs",
    keywords: ["stroke", "can't speak", "face drooping", "numbness", "paralysis", "slurred", "speech difficulty", "derrame", "parálisis", "स्ट्रोक", "लकवा", "avc", "schlaganfall", "中风", "سكتة دماغية", "инсульт"],
    score: 4,
    dept: "Neurology / Stroke Resuscitation",
    concerns: ["🚨 May indicate Acute Cerebrovascular Accident (CVA) / Ischemic Stroke", "Suggests possibility of Transient Ischemic Attack (TIA)"],
    recs: ["FAST Stroke Assessment", "Stat Non-contrast Head CT Scan", "Neurology Team Consult"]
  },
  {
    category: "Loss of Consciousness / Seizure",
    keywords: ["unconscious", "unresponsive", "fainted", "collapsed", "blackout", "seizure", "convulsions", "inconsciente", "desmayado", "बेहोश", "évanoui", "bewusstlos", "昏迷", "فقدان الوعي", "обморок"],
    score: 4,
    dept: "Emergency Department / Resuscitation",
    concerns: ["May indicate Postictal State or Seizure Disorder", "Suggests possibility of Syncope / Intracranial Hemorrhage"],
    recs: ["Airway protection & positioning", "Stat Fingerstick Blood Glucose", "Head CT / EEG"]
  },
  {
    category: "Fever & Chills",
    keywords: ["fever", "high temperature", "chills", "sweating", "febrile", "burning up", "fiebre", "बुखार", "fièvre", "fieber", "发烧", "حمى", "температура"],
    score: 2,
    dept: "Infectious Disease / Internal Medicine",
    concerns: ["May indicate Systemic Infection or Inflammatory Etiology", "Suggests risk of Sepsis when presenting with tachycardia"],
    recs: ["Temperature monitoring", "CBC with differential & blood cultures", "Antipyretic administration"]
  },
  {
    category: "Gastrointestinal (Vomiting / Nausea / Abdominal)",
    keywords: ["vomiting", "nausea", "throwing up", "stomach ache", "abdominal pain", "belly pain", "vómito", "dolor de estómago", "उल्टी", "पेट दर्द", "vomissement", "erbrechen", "呕吐", "腹痛", "قيء", "рвота"],
    score: 2,
    dept: "Gastroenterology / Urgent Care",
    concerns: ["May indicate Acute Gastroenteritis or Biliary Colic", "Suggests possibility of Dehydration or Electrolyte Disturbance"],
    recs: ["Abdominal physical exam", "Hydration assessment & antiemetics", "Abdominal ultrasound if localized"]
  },
  {
    category: "Headache & Migraine",
    keywords: ["headache", "migraine", "head pain", "throbbing head", "pounding head", "dolor de cabeza", "migraña", "सिरदर्द", "mal de tête", "kopfschmerzen", "头痛", "صداع", "головная боль"],
    score: 2,
    dept: "Neurology / Outpatient Care",
    concerns: ["May indicate Vascular Migraine or Tension Cephalea", "Requires screening for Meningitis if accompanied by neck stiffness"],
    recs: ["Targeted neurological screen", "Blood pressure check", "Analgesic administration"]
  },
  {
    category: "Allergic Reaction & Rash",
    keywords: ["rash", "hives", "itching", "swelling", "allergy", "allergic reaction", "alergia", "hinchazón", "एलर्जी", "सूजन", "allergie", "皮疹", "حساسية", "сыпь"],
    score: 2,
    dept: "Allergy & Immunology / Urgent Care",
    concerns: ["May indicate Dermatitis or Cutaneous Hypersensitivity", "Requires evaluation for Anaphylaxis if lip/facial swelling is present"],
    recs: ["Assess airway & lip swelling", "Antihistamine / Steroid administration", "Epinephrine stat if wheezing"]
  },
  {
    category: "Trauma, Fractures & Bleeding",
    keywords: ["bleeding", "hemorrhage", "blood loss", "wound", "laceration", "fracture", "broken bone", "fall", "injury", "sangrado", "fractura", "खून बहना", "हड्डी टूटना", "saignement", "blutung", "出血", "골절"],
    score: 3,
    dept: "Trauma Unit / Orthopedics",
    concerns: ["May indicate Traumatic Bone Fracture or Laceration", "Suggests risk of Active Hemorrhage"],
    recs: ["Radiographic X-Ray imaging", "Apply direct pressure / hemostasis", "Limb immobilization"]
  },
  {
    category: "Dizziness & Vertigo",
    keywords: ["dizzy", "dizziness", "vertigo", "lightheaded", "unsteady", "mareo", "vértigo", "चक्कर आना", "vertige", "schwindel", "眩晕", "دوخة", "головокружение"],
    score: 2,
    dept: "Neurology / General Triage",
    concerns: ["May indicate Orthostatic Hypotension or Labyrinthitis", "Suggests possibility of Dehydration or Electrolyte Shift"],
    recs: ["Check lying/standing blood pressure", "ENT vestibular screening", "Fluid resuscitation"]
  }
];

function analyzeVoiceTranscriptNLP(transcriptText) {
  const text = (transcriptText || "").toLowerCase().trim();
  if (!text) {
    return {
      detected_problem: "No Input Detected",
      detected_symptoms: [],
      severity: "Low",
      ai_score: 1,
      possible_clinical_concerns: ["Requires physical intake examination"],
      recommended_department: "General Triage",
      recommendations: ["Perform primary intake evaluation"],
      confidence: "Low",
      disclaimer: "Clinical Decision Support Only - Not a Medical Diagnosis"
    };
  }

  const detectedSymptoms = [];
  const concerns = [];
  const recs = [];
  const depts = new Set();
  let maxScore = 2;

  for (const entry of VOICE_SYMPTOM_ENTRIES) {
    const matches = entry.keywords.filter(kw => text.includes(kw));
    if (matches.length > 0) {
      detectedSymptoms.push(entry.category);
      maxScore += entry.score;
      depts.add(entry.dept);
      entry.concerns.forEach(c => concerns.push(c));
      entry.recs.forEach(r => recs.push(r));
    }
  }

  if (detectedSymptoms.length === 0) {
    detectedSymptoms.push("Natural Speech Intake / General Symptom Presentation");
    concerns.push("May indicate non-specific viral illness, localized discomfort, or fatigue");
    concerns.push("Requires clinical evaluation for precise symptom classification");
    depts.add("General Triage / Urgent Care");
    recs.push("Document full patient clinical history");
    recs.push("Obtain baseline vital signs");
  }

  const finalScore = Math.min(10, Math.max(1, maxScore));
  const severityLabel = finalScore >= 8 ? "Critical" : finalScore >= 6 ? "High" : finalScore >= 4 ? "Moderate" : "Low";
  const confidenceLabel = detectedSymptoms.length >= 2 ? "High" : "Medium";
  const primaryDept = Array.from(depts)[0] || "General Triage";

  const uniqueConcerns = Array.from(new Set(concerns)).slice(0, 4);
  const uniqueRecs = Array.from(new Set(recs)).slice(0, 4);

  return {
    detected_problem: detectedSymptoms.join(" + "),
    detected_symptoms: detectedSymptoms,
    severity: severityLabel,
    ai_score: finalScore,
    possible_clinical_concerns: uniqueConcerns,
    recommended_department: primaryDept,
    recommendations: uniqueRecs,
    confidence: confidenceLabel,
    disclaimer: "Clinical Decision Support Only - Not a Medical Diagnosis"
  };
}

module.exports = { VOICE_SYMPTOM_ENTRIES, analyzeVoiceTranscriptNLP };
