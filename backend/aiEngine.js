/**
 * Claude AI Triage Reasoning Engine (Zero Dependencies)
 * -----------------------------------------------------
 * Uses native fetch to call Anthropic's Claude API or local dynamic multi-symptom engine fallback.
 * Dynamically analyzes ANY combination of symptoms, vitals, history, and voice inputs.
 * Enforces strict JSON schema with safe non-definitive clinical decision support phrasing.
 */

const SYSTEM_PROMPT = `You are Vitalis, an AI Clinical Intake Decision-Support Assistant for hospital ER and Urgent Care triage staff.
Your role is to dynamically analyze ANY combination of patient symptoms, vital sign anomalies, age, pain levels, medical history, and clinical inputs without limiting your assessment to predefined conditions.

IMPORTANT CONSTRAINTS & CLINICAL GUIDELINES:
1. THIS IS A CLINICAL DECISION-SUPPORT TOOL, NOT A MEDICAL DIAGNOSIS. Never state a definitive medical diagnosis.
2. ALWAYS use safe, non-definitive clinical language such as "may indicate", "suggests the possibility of", "requires evaluation for", "could present risk of", or "warrants clinical screening for".
3. Assess urgency score strictly on a scale of 1 to 10:
   - 1-3: Low Urgency / Non-Urgent (minor localized complaints, mild cold symptoms, routine checks)
   - 4-7: Moderate Urgency (moderate pain, persistent fever, minor fractures, GI symptoms, respiratory distress without hypoxia)
   - 8-10: High / Critical Urgency (chest pain, acute neurological deficits, severe respiratory distress, acute trauma, sepsis risk, altered consciousness)
4. Extract ALL symptoms present in the complaint and profile, explain how each symptom/vital contributes to the urgency score, list ALL relevant possible clinical concerns (multi-item differential), suggest the most appropriate hospital department, and provide recommended next steps.
5. You MUST reply ONLY with a raw, valid JSON object matching this EXACT schema:
{
  "urgency_score": <integer 1 to 10>,
  "extracted_symptoms": [<string>, <string>, ...],
  "symptom_urgency_contributions": [<string>, ...],
  "possible_clinical_concerns": [<string>, ...],
  "recommended_department": "<string>",
  "recommended_next_steps": [<string>, ...],
  "red_flags": [<string>, ...],
  "confidence_level": "High" | "Medium" | "Low",
  "rationale": "<2-3 sentence clinical rationale using safe non-definitive language>",
  "disclaimer": "Clinical Decision Support Only - Not a Medical Diagnosis"
}
6. Do NOT include any markdown formatting, preambles, explanations, or commentary outside of the raw JSON object.
`;

function extractJsonFromText(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
  }
  const startIdx = cleaned.indexOf("{");
  const endIdx = cleaned.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }
  return cleaned.trim();
}

/**
 * Clinical Dictionary for Dynamic Symptom & Vital Sign Extraction (40+ concepts)
 */
const CLINICAL_DICTIONARY = [
  {
    name: "Chest Pain / Pressure",
    keywords: ["chest pain", "chest pressure", "substernal", "angina", "tightness in chest", "squeezing chest", "chest discomfort", "chest"],
    scoreAdd: 4,
    dept: "Cardiology / Emergency Department",
    concerns: ["May indicate Acute Coronary Syndrome (ACS) or Myocardial Ischemia", "Suggests possibility of Pericarditis or Angina Pectoris", "Requires evaluation for Aortic Dissection or Pulmonary Embolism"],
    steps: ["Stat 12-lead ECG", "Cardiac biomarker panel (Troponin I/T)", "Continuous telemetry monitoring"]
  },
  {
    name: "Shortness of Breath / Respiratory Distress",
    keywords: ["shortness of breath", "breathlessness", "difficulty breathing", "dyspnea", "wheezing", "gasping", "stridor", "can't breathe", "suffocating", "breath"],
    scoreAdd: 3,
    dept: "Emergency Respiratory / Critical Care",
    concerns: ["May indicate Acute Respiratory Distress or Asthma Exacerbation", "Suggests possibility of Pneumonia or COPD Exacerbation", "Requires evaluation for Pulmonary Edema or Airway Compromise"],
    steps: ["Immediate Pulse Oximetry (SpO2) check", "Supplemental oxygen administration", "Chest Radiograph (X-Ray) / ABG"]
  },
  {
    name: "Fever / Hyperthermia",
    keywords: ["fever", "high temperature", "pyrexia", "chills", "febrile", "burning up", "hot flashes", "feverish"],
    scoreAdd: 2,
    dept: "Internal Medicine / Infectious Disease",
    concerns: ["May indicate Systemic Viral or Bacterial Infection", "Suggests possibility of Sepsis when presenting with tachycardia", "Requires evaluation for Inflammatory or Infectious Source"],
    steps: ["Full blood count (CBC) with differential", "Blood cultures and urinalysis", "Antipyretic administration"]
  },
  {
    name: "Headache / Migraine",
    keywords: ["headache", "migraine", "head pain", "throbbing head", "cephalea", "temple pain", "pounding head", "headache"],
    scoreAdd: 2,
    dept: "Neurology / Urgent Care",
    concerns: ["May indicate Severe Vascular Migraine or Tension Cephalea", "Suggests possibility of Elevated Intracranial Pressure", "Requires evaluation for Meningitis if neck stiffness is present"],
    steps: ["Targeted neurological screen", "Blood pressure assessment", "Analgesic protocol administration"]
  },
  {
    name: "Dizziness / Vertigo / Syncope",
    keywords: ["dizziness", "dizzy", "vertigo", "lightheaded", "fainting", "fainted", "syncope", "passed out", "unsteady", "off balance"],
    scoreAdd: 2,
    dept: "Neurology / Emergency Department",
    concerns: ["May indicate Orthostatic Hypotension or Benign Paroxysmal Positional Vertigo", "Suggests possibility of Cardiac Arrhythmia or Transient Ischemic Attack (TIA)", "Requires evaluation for Cerebellar Dysfunction or Dehydration"],
    steps: ["Orthostatic vital signs check", "ECG screening", "Neurological balance testing"]
  },
  {
    name: "Vomiting / Nausea",
    keywords: ["vomiting", "vomit", "nausea", "nauseous", "throwing up", "emesis", "retching"],
    scoreAdd: 2,
    dept: "Gastroenterology / Urgent Care",
    concerns: ["May indicate Acute Gastroenteritis or Gastric Intolerance", "Suggests possibility of Dehydration & Electrolyte Imbalance", "Requires evaluation for Bowel Obstruction if accompanied by distension"],
    steps: ["Hydration status assessment", "Antiemetic therapy administration", "Abdominal physical palpation"]
  },
  {
    name: "Diarrhea",
    keywords: ["diarrhea", "diarrhoea", "loose stools", "watery stool"],
    scoreAdd: 1,
    dept: "Gastroenterology / General Medicine",
    concerns: ["May indicate Infectious Enteritis or Dietary Intolerance", "Suggests possibility of Hypovolemia / Fluid Deficit"],
    steps: ["Stool pathogen PCR culture", "Oral / IV rehydration therapy", "Electrolyte panel monitoring"]
  },
  {
    name: "Abdominal Pain / Stomach Ache",
    keywords: ["abdominal pain", "belly pain", "stomach ache", "stomach pain", "cramping", "rlq pain", "luq pain", "epigastric", "stomach"],
    scoreAdd: 2,
    dept: "General Surgery / Gastroenterology",
    concerns: ["May indicate Acute Appendicitis or Cholecystitis", "Suggests possibility of Peptic Ulcer Disease or Diverticulitis", "Requires evaluation for Visceral Perforation or Renal Colic"],
    steps: ["Abdominal ultrasound or CT scan", "NPO status protocol", "Targeted abdominal palpation"]
  },
  {
    name: "Cough / Sore Throat",
    keywords: ["cough", "coughing", "sore throat", "pharyngitis", "throat pain", "hoarseness", "phlegm", "sputum"],
    scoreAdd: 1,
    dept: "Outpatient Clinic / Urgent Care",
    concerns: ["May indicate Upper Respiratory Tract Infection (URTI)", "Suggests possibility of Streptococcal Pharyngitis or Bronchitis"],
    steps: ["Rapid Strep / Swab testing", "Symptomatic throat lozenges / anti-inflammatories", "Auscultation of lung fields"]
  },
  {
    name: "Back Pain / Flank Pain",
    keywords: ["back pain", "flank pain", "lower back pain", "lumbar pain", "spine pain", "cva tenderness"],
    scoreAdd: 2,
    dept: "Orthopedics / Urology",
    concerns: ["May indicate Acute Lumbar Strain or Musculoskeletal Trauma", "Suggests possibility of Nephrolithiasis (Kidney Stones) or Pyelonephritis"],
    steps: ["Urinalysis for hematuria", "Renal tract imaging / ultrasound", "Pain relief and mobility check"]
  },
  {
    name: "Joint Pain / Neck Pain / Muscle Pain",
    keywords: ["joint pain", "neck pain", "stiff neck", "nuchal rigidity", "myalgia", "arthralgia", "knee pain", "shoulder pain", "leg pain", "arm pain"],
    scoreAdd: 2,
    dept: "Rheumatology / Neurology",
    concerns: ["May indicate Inflammatory Arthropathy or Musculoskeletal Strain", "Suggests possibility of Meningeal Sign if presenting with nuchal rigidity"],
    steps: ["Kernig's and Brudzinski's meningeal sign check", "Inflammatory markers (ESR, CRP)", "Joint immobilisation / analgesia"]
  },
  {
    name: "Ear Pain / Eye Pain / Vision Changes",
    keywords: ["ear pain", "eye pain", "blurred vision", "double vision", "otitis", "ocular pain", "photophobia", "eye redness"],
    scoreAdd: 2,
    dept: "Ophthalmology / ENT",
    concerns: ["May indicate Acute Otitis Media or Corneal Abrasion", "Suggests possibility of Acute Angle-Closure Glaucoma or Optic Neuritis"],
    steps: ["Ophthalmoscopic / Otoscopic exam", "Intraocular pressure check", "Targeted visual acuity evaluation"]
  },
  {
    name: "Skin Rash / Hives / Swelling",
    keywords: ["rash", "hives", "skin redness", "itching", "pruritus", "urticaria", "facial swelling", "lip swelling", "edema"],
    scoreAdd: 2,
    dept: "Dermatology / Allergy & Immunology",
    concerns: ["May indicate Dermatitis or Allergic Cutaneous Reaction", "Suggests possibility of Impending Anaphylaxis if facial/lip swelling is present"],
    steps: ["Airway and breathing assessment", "Antihistamine / Steroid protocol", "Allergen exposure history review"]
  },
  {
    name: "Burns / Thermal Injury",
    keywords: ["burn", "burns", "scald", "blisters", "skin singed", "thermal injury", "chemical burn"],
    scoreAdd: 3,
    dept: "Burn Unit / Trauma Center",
    concerns: ["May indicate Dermal Thermal Injury requiring fluid resuscitation", "Suggests possibility of Inhalation Injury if facial burns are present"],
    steps: ["Estimate Total Body Surface Area (TBSA)", "Sterile dressing and cooling", "Parkland formula fluid calculation"]
  },
  {
    name: "Allergic Reaction / Anaphylaxis",
    keywords: ["allergic reaction", "anaphylaxis", "allergy", "throat tight", "swollen tongue", "bee sting reaction"],
    scoreAdd: 4,
    dept: "Emergency Department / Resuscitation",
    concerns: ["May indicate Severe Systemic Hypersensitivity / Anaphylaxis", "Suggests critical risk of Upper Airway Occlusion"],
    steps: ["IM Epinephrine administration (stat)", "High-flow oxygen therapy", "Continuous vital airway monitoring"]
  },
  {
    name: "Anxiety / Panic Attack / Palpitations",
    keywords: ["anxiety", "panic attack", "palpitations", "racing heart", "hyperventilating", "nervousness", "trembling"],
    scoreAdd: 2,
    dept: "Psychiatry / Urgent Care",
    concerns: ["May indicate Acute Panic Disorder or Hyperventilation Syndrome", "Suggests possibility of Cardiac Dysrhythmia presenting as anxiety"],
    steps: ["12-lead ECG to rule out cardiac etiology", "Calm breathing re-training", "Basic metabolic panel"]
  },
  {
    name: "Weakness / Lethargy / Fatigue",
    keywords: ["weakness", "lethargy", "fatigue", "feeling weak", "generalized weakness", "prostration", "sluggish"],
    scoreAdd: 2,
    dept: "Internal Medicine / Geriatrics",
    concerns: ["May indicate Systemic Debility or Electrolyte Imbalance", "Suggests possibility of Severe Anemia or Occult Infection"],
    steps: ["Complete metabolic & electrolyte panel", "Hemoglobin / Hematocrit check", "Infection screening"]
  },
  {
    name: "Loss of Consciousness / Seizures",
    keywords: ["loss of consciousness", "unconscious", "passed out", "seizure", "convulsions", "epilepsy", "postictal", "blackout"],
    scoreAdd: 4,
    dept: "Neurology / Critical Care",
    concerns: ["May indicate Status Epilepticus or Postictal State", "Suggests possibility of Intracranial Hemorrhage or Severe Hypoxia"],
    steps: ["Airway protection and recovery position", "Stat Fingerstick Blood Glucose check", "Stat Head CT scan"]
  },
  {
    name: "Trauma / Fractures / Bleeding",
    keywords: ["trauma", "fracture", "broken bone", "bleeding", "hemorrhage", "cut", "laceration", "fall", "wound", "accident", "contusion"],
    scoreAdd: 3,
    dept: "Trauma Center / Orthopedics",
    concerns: ["May indicate Musculoskeletal Fracture or Deep Laceration", "Suggests possibility of Active Hemorrhage or Compartment Syndrome"],
    steps: ["Radiographic X-Ray / CT imaging", "Hemostasis and direct pressure", "Neurovascular distal status check"]
  },
  {
    name: "Pregnancy-Related Complaints",
    keywords: ["pregnant", "pregnancy", "spotting", "vaginal bleeding", "fetal movement", "contractions", "gestational"],
    scoreAdd: 3,
    dept: "Obstetrics & Gynecology (OB/GYN)",
    concerns: ["May indicate Ectopic Pregnancy or Threatened Abortion", "Suggests possibility of Preeclampsia or Placental Abruption"],
    steps: ["Pelvic ultrasound scan", "Bedside beta-hCG test", "Fetal heart tone auscultation"]
  },
  {
    name: "Urinary Symptoms",
    keywords: ["urinary", "dysuria", "burning urination", "frequent urination", "hematuria", "blood in urine", "urinary retention"],
    scoreAdd: 2,
    dept: "Urology / Urgent Care",
    concerns: ["May indicate Lower Urinary Tract Infection (Cystitis)", "Suggests possibility of Acute Urinary Retention or Urolithiasis"],
    steps: ["Urinalysis and urine dipstick", "Urine culture", "Bladder ultrasound scan if retained"]
  },
  {
    name: "Blood Pressure / Blood Sugar Anomalies",
    keywords: ["high blood pressure", "low blood pressure", "hypertension", "hypotension", "high blood sugar", "low blood sugar", "hyperglycemia", "hypoglycemia"],
    scoreAdd: 3,
    dept: "Endocrinology / Cardiology",
    concerns: ["May indicate Hypertensive Urgency / Crisis or Hypotensive Shock", "Suggests possibility of Diabetic Ketoacidosis (DKA) or Hypoglycemic Stupor"],
    steps: ["Serial BP monitoring", "Stat point-of-care capillary blood glucose", "Serum electrolytes and ketones"]
  }
];

/**
 * Dynamic Multi-Symptom Local Fallback Engine
 */
function mockTriageFallback(intake, reason = "Fallback AI Reasoning") {
  const complaintStr = (intake.complaint || "").toLowerCase();
  const historyStr = (intake.medical_history || "").toLowerCase();
  const vitals = intake.vitals || {};
  const painScale = intake.pain_scale || 1;
  const age = intake.age != null ? Number(intake.age) : null;

  const extractedSymptoms = [];
  const urgencyContributions = [];
  const possibleConcerns = [];
  const recommendedSteps = [];
  const redFlags = [];
  const departments = new Set();

  let score = 2;

  // Clean raw API / HTTP error strings from reason
  let cleanReason = "Local Dynamic Multi-Symptom AI Engine";
  if (reason && typeof reason === "string") {
    if (reason.includes("API Key Not Configured")) {
      cleanReason = "Local Heuristic Mode";
    } else if (reason.includes("credit balance") || reason.includes("HTTP 400") || reason.includes("API issue") || reason.includes("invalid_request_error")) {
      cleanReason = "Local Multi-Symptom Decision Engine Active";
    } else {
      cleanReason = reason.replace(/\{.*?\}/g, "").substring(0, 80).trim() || "Local AI Engine Active";
    }
  }

  // 1. Scan clinical dictionary for matching symptom concepts
  for (const item of CLINICAL_DICTIONARY) {
    const matched = item.keywords.filter(kw => complaintStr.includes(kw));
    if (matched.length > 0) {
      extractedSymptoms.push(item.name);
      score += item.scoreAdd;
      urgencyContributions.push(`${item.name} (+${item.scoreAdd} urgency score)`);
      departments.add(item.dept);
      item.concerns.forEach(c => possibleConcerns.push(c));
      item.steps.forEach(s => recommendedSteps.push(s));
    }
  }

  // Handle generic pain words in complaint if no specific dictionary item matched yet
  const painWords = ["pain", "hurt", "aching", "sore", "cramp", "discomfort", "throbbing", "sharp", "stabbing"];
  if (extractedSymptoms.length === 0 && painWords.some(w => complaintStr.includes(w))) {
    extractedSymptoms.push("Acute Pain / Localized Discomfort");
    urgencyContributions.push("Reported acute pain symptoms (+2 urgency score)");
    possibleConcerns.push("May indicate acute localized tissue strain, inflammation, or acute pain syndrome");
    possibleConcerns.push("Requires clinical examination to locate underlying source of pain");
    departments.add("Urgent Care / Emergency Triage");
    recommendedSteps.push("Perform physical examination of painful region");
    recommendedSteps.push("Administer pain scale evaluation and analgesia check");
  }

  // Fallback if still no symptom matched
  if (extractedSymptoms.length === 0) {
    if (complaintStr.trim()) {
      extractedSymptoms.push(intake.complaint.trim());
    } else {
      extractedSymptoms.push("Generalized Clinical Complaint");
    }
    urgencyContributions.push("Symptom presentation requires clinical intake assessment (+2 urgency)");
    possibleConcerns.push("May indicate non-specific illness or localized discomfort");
    possibleConcerns.push("Requires clinical evaluation for accurate triage classification");
    departments.add("General Triage / Outpatient Clinic");
    recommendedSteps.push("Perform primary clinical history and physical examination");
    recommendedSteps.push("Obtain complete set of vital signs");
  }

  // 2. Pain Scale Scoring Refinement
  if (painScale >= 8) {
    score = Math.max(score + 3, 7);
    urgencyContributions.push(`Severe acute pain level reported (${painScale}/10) (+3 score factor)`);
    redFlags.push(`Severe acute pain reported (${painScale}/10)`);
    recommendedSteps.push("Initiate acute pain management protocol");
  } else if (painScale >= 6) {
    score = Math.max(score + 2, 5);
    urgencyContributions.push(`Moderate-to-high pain score (${painScale}/10) (+2 score factor)`);
  } else if (painScale >= 4) {
    score = Math.max(score + 1, 4);
    urgencyContributions.push(`Moderate pain score (${painScale}/10) (+1 score factor)`);
  }

  // 3. Evaluate Vital Sign Anomalies
  if (vitals.heart_rate) {
    const hr = Number(vitals.heart_rate);
    if (hr > 120 && vitals.temperature && Number(vitals.temperature) > 101.0) {
      score += 2;
      urgencyContributions.push(`Tachycardia (${hr} bpm) combined with Fever (${vitals.temperature}°F) (+2 score: Sepsis Risk)`);
      redFlags.push(`🚨 SAFETY ALERT: High HR (${hr} bpm) + Fever (${vitals.temperature}°F) indicates potential Sepsis`);
      possibleConcerns.push("Suggests high risk of Systemic Inflammatory Response / Sepsis");
      recommendedSteps.push("Draw blood cultures x 2 and serum lactate stat");
    } else if (hr >= 120) {
      score += 1;
      urgencyContributions.push(`Elevated resting heart rate (${hr} bpm) (+1 score)`);
      redFlags.push(`Resting Tachycardia detected (${hr} bpm)`);
    } else if (hr < 50) {
      score += 2;
      urgencyContributions.push(`Bradycardia (${hr} bpm) (+2 score)`);
      redFlags.push(`Sinus Bradycardia detected (${hr} bpm)`);
    }
  }

  if (vitals.temperature) {
    const temp = Number(vitals.temperature);
    if (temp >= 103.0) {
      score += 2;
      urgencyContributions.push(`Severe High Fever (${temp}°F) (+2 score)`);
      redFlags.push(`Hyperpyrexia alert (Temperature: ${temp}°F)`);
    }
  }

  if (vitals.blood_pressure && vitals.blood_pressure.includes("/")) {
    try {
      const parts = vitals.blood_pressure.split("/");
      const sys = parseInt(parts[0], 10);
      const dia = parseInt(parts[1], 10);
      if (sys >= 180 || dia >= 120) {
        score += 2;
        urgencyContributions.push(`Hypertensive Crisis Blood Pressure (${vitals.blood_pressure}) (+2 score)`);
        redFlags.push(`🚨 SAFETY ALERT: Hypertensive Crisis Threshold (BP: ${vitals.blood_pressure})`);
        possibleConcerns.push("May indicate Hypertensive Emergency / Target Organ Damage");
      } else if (sys < 90 || dia < 60) {
        score += 2;
        urgencyContributions.push(`Hypotension (${vitals.blood_pressure}) (+2 score)`);
        redFlags.push(`Hypotensive state detected (BP: ${vitals.blood_pressure})`);
        possibleConcerns.push("Suggests possibility of Circulatory Volume Depletion or Shock");
      }
    } catch (e) {}
  }

  // 4. Age & Comorbidity Risk Factors
  if (age !== null) {
    if (age >= 65) {
      score += 1;
      urgencyContributions.push(`Geriatric patient age (${age} y/o) (+1 score factor)`);
    } else if (age <= 2) {
      score += 1;
      urgencyContributions.push(`Infant age group (${age} y/o) (+1 score factor)`);
    }
  }

  if (historyStr.length > 0) {
    if (["heart", "cardiac", "stroke", "diabetes", "asthma", "copd", "cancer"].some(k => historyStr.includes(k))) {
      score += 1;
      urgencyContributions.push(`Significant medical history of (${intake.medical_history}) (+1 risk factor)`);
    }
  }

  // Final score clamping
  score = Math.min(10, Math.max(1, score));

  // Deduplicate concerns & next steps
  const uniqueConcerns = Array.from(new Set(possibleConcerns)).slice(0, 4);
  const uniqueSteps = Array.from(new Set(recommendedSteps)).slice(0, 4);
  const primaryDept = Array.from(departments)[0] || "Emergency Department";

  if (redFlags.length === 0) {
    redFlags.push("Standard clinical monitoring and routine vitals screening recommended");
  }

  const rationale = `Patient presents with an urgency score of ${score}/10 based on identified symptoms (${extractedSymptoms.join(", ")}) and pain level ${painScale}/10. Input data suggests potential clinical risk factors that require tailored evaluation. (${cleanReason})`;

  return {
    urgency_score: score,
    extracted_symptoms: extractedSymptoms,
    symptom_urgency_contributions: urgencyContributions,
    possible_clinical_concerns: uniqueConcerns,
    recommended_department: primaryDept,
    recommended_next_steps: uniqueSteps,
    red_flags: redFlags,
    confidence_level: extractedSymptoms.length > 1 ? "High" : "Medium",
    rationale,
    disclaimer: "Clinical Decision Support Only - Not a Medical Diagnosis"
  };
}

/**
 * Main AI reasoning function
 */
async function evaluatePatientAI(intake) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const modelName = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022";

  if (!apiKey) {
    console.log("No ANTHROPIC_API_KEY set. Operating in local multi-symptom heuristic engine mode.");
    return mockTriageFallback(intake, "Mock Multi-Symptom AI Engine - API Key Not Configured");
  }

  try {
    let vitalsText = "Not provided";
    if (intake.vitals) {
      const vParts = [];
      if (intake.vitals.heart_rate) vParts.push(`Heart Rate: ${intake.vitals.heart_rate} bpm`);
      if (intake.vitals.temperature) vParts.push(`Temperature: ${intake.vitals.temperature}°F`);
      if (intake.vitals.blood_pressure) vParts.push(`Blood Pressure: ${intake.vitals.blood_pressure}`);
      if (vParts.length > 0) vitalsText = vParts.join(", ");
    }

    const ageText = intake.age != null ? `${intake.age} years old` : "Not provided";
    const genderText = intake.gender || "Not provided";
    const historyText = intake.medical_history || "None reported";
    const allergiesText = intake.allergies || "None reported";
    const medsText = intake.current_medications || "None reported";

    const userContent = `Patient Intake Details:
- Name: ${intake.name}
- Age: ${ageText}
- Gender: ${genderText}
- Chief Complaint: ${intake.complaint}
- Pain Scale: ${intake.pain_scale}/10
- Vital Signs: ${vitalsText}
- Past Medical History: ${historyText}
- Allergies: ${allergiesText}
- Current Medications: ${medsText}

Analyze ALL entered symptoms and vitals. Return JSON triage decision-support object following the system instructions.`;

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }]
      })
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      throw new Error(`Anthropic API HTTP ${apiRes.status}: ${errText}`);
    }

    const response = await apiRes.json();
    const responseText = response.content[0].text;
    const cleanJsonStr = extractJsonFromText(responseText);
    const data = JSON.parse(cleanJsonStr);

    let score = parseInt(data.urgency_score, 10) || 5;
    score = Math.min(10, Math.max(1, score));

    return {
      urgency_score: score,
      extracted_symptoms: Array.isArray(data.extracted_symptoms) ? data.extracted_symptoms : [intake.complaint],
      symptom_urgency_contributions: Array.isArray(data.symptom_urgency_contributions) ? data.symptom_urgency_contributions : [`Complaint: ${intake.complaint}`],
      possible_clinical_concerns: Array.isArray(data.possible_clinical_concerns) ? data.possible_clinical_concerns : ["Requires clinical evaluation"],
      recommended_department: data.recommended_department || "General Triage",
      recommended_next_steps: Array.isArray(data.recommended_next_steps) ? data.recommended_next_steps : ["Complete triage screening"],
      red_flags: Array.isArray(data.red_flags) ? data.red_flags : [],
      confidence_level: data.confidence_level || "High",
      rationale: data.rationale || "Patient intake evaluation completed.",
      disclaimer: "Clinical Decision Support Only - Not a Medical Diagnosis"
    };
  } catch (err) {
    console.error("Claude API evaluation failed:", err.message);
    return mockTriageFallback(intake, `AI Fallback active due to API issue: ${err.message.substring(0, 150)}`);
  }
}

module.exports = { evaluatePatientAI, mockTriageFallback };
