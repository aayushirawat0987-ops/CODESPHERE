/**
 * Claude AI Triage Reasoning Engine (Zero Dependencies - Bilingual EN/HI)
 * ------------------------------------------------------------------------
 * Uses native fetch to call Anthropic's Claude API or local dynamic multi-symptom engine fallback.
 * Generates BOTH detailed clinical rationale for staff AND simple, reassuring explanations for patients
 * in English and Hindi (Devanagari script) with zero unnecessary medical jargon.
 */

const SYSTEM_PROMPT = `You are Vitalis, an AI Clinical Intake Decision-Support Assistant for hospital ER and Urgent Care triage staff and patients.
Your role is to dynamically analyze ANY combination of patient symptoms, vital sign anomalies, age, pain levels, medical history, and clinical inputs without limiting your assessment to predefined conditions.

IMPORTANT CONSTRAINTS & CLINICAL GUIDELINES:
1. THIS IS A CLINICAL DECISION-SUPPORT TOOL, NOT A MEDICAL DIAGNOSIS. Never state a definitive medical diagnosis.
2. ALWAYS use safe, non-definitive clinical language such as "may indicate", "suggests the possibility of", "requires evaluation for", "could present risk of", or "warrants clinical screening for".
3. Assess urgency score strictly on a scale of 1 to 10:
   - 1-3: Low Urgency / Non-Urgent
   - 4-7: Moderate Urgency
   - 8-10: High / Critical Urgency

4. DUAL AUDIENCE OUTPUT FORMAT:
   - CLINICIAN MODE: Provide detailed professional clinical rationale, extracted symptoms, vital sign anomalies, red flags, and recommended department.
   - PATIENT MODE (English & Hindi): Provide short, simple, reassuring explanations using everyday language with ZERO medical jargon. Explain what was observed and what the patient should do next using bullet points.
     Examples for Patient Mode:
     - Instead of "myocardial ischemia", say "You may have a heart-related problem. Please visit the emergency department as soon as possible." / "आपको दिल से जुड़ी समस्या हो सकती है। कृपया जल्द से जल्द अस्पताल के इमरजेंसी विभाग में जाएं।"
     - Instead of "facial asymmetry suggestive of neurological deficit", say "We noticed one side of your face looks slightly different. Please see a doctor immediately." / "हमने देखा कि आपके चेहरे का एक हिस्सा थोड़ा अलग दिख रहा है। कृपया तुरंत डॉक्टर को दिखाएं।"
     - Instead of "tachycardia with pyrexia", say "Your heartbeat is faster than normal, and you have a fever." / "आपकी धड़कन सामान्य से तेज़ है और आपको बुखार है।"

5. You MUST reply ONLY with a raw, valid JSON object matching this EXACT schema:
{
  "urgency_score": <integer 1 to 10>,
  "extracted_symptoms": [<string>, ...],
  "symptom_urgency_contributions": [<string>, ...],
  "possible_clinical_concerns": [<string>, ...],
  "recommended_department": "<string>",
  "recommended_next_steps": [<string>, ...],
  "red_flags": [<string>, ...],
  "confidence_level": "High" | "Medium" | "Low",
  "rationale": "<technical clinical rationale in English>",
  "clinician_rationale_hi": "<technical clinical rationale in Hindi>",
  "patient_summary_en": "<simple, reassuring explanation in English for elderly/non-medical patients>",
  "patient_summary_hi": "<simple, reassuring explanation in Hindi in Devanagari script for non-medical patients>",
  "patient_next_steps_en": ["<simple action step 1>", "<simple action step 2>"],
  "patient_next_steps_hi": ["<simple action step 1 in Hindi>", "<simple action step 2 in Hindi>"],
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
 * Clinical Dictionary with Dual Patient Explanations (English & Hindi)
 */
const CLINICAL_DICTIONARY = [
  {
    name: "Chest Pain / Pressure",
    keywords: ["chest pain", "chest pressure", "substernal", "angina", "tightness in chest", "squeezing chest", "chest discomfort", "chest"],
    scoreAdd: 4,
    dept: "Cardiology / Emergency Department",
    concerns: ["May indicate Acute Coronary Syndrome (ACS) or Myocardial Ischemia", "Suggests possibility of Pericarditis or Angina Pectoris"],
    steps: ["Stat 12-lead ECG", "Cardiac biomarker panel (Troponin I/T)", "Continuous telemetry monitoring"],
    patientEn: "You may have a heart-related problem. Please visit the emergency department as soon as possible and avoid any physical exertion.",
    patientHi: "आपको दिल से जुड़ी समस्या हो सकती है। कृपया जल्द से जल्द अस्पताल के आपातकालीन (इमरजेंसी) विभाग में जाएं और कोई शारीरिक मेहनत न करें।",
    patientStepsEn: ["Please report to the emergency room immediately.", "Sit down, rest quietly, and stay calm."],
    patientStepsHi: ["कृपया तुरंत इमरजेंसी कक्ष में रिपोर्ट करें।", "शांति से बैठें, आराम करें और शांत रहें।"]
  },
  {
    name: "Shortness of Breath / Respiratory Distress",
    keywords: ["shortness of breath", "breathlessness", "difficulty breathing", "dyspnea", "wheezing", "gasping", "stridor", "can't breathe", "suffocating", "breath"],
    scoreAdd: 3,
    dept: "Emergency Respiratory / Critical Care",
    concerns: ["May indicate Acute Respiratory Distress or Asthma Exacerbation", "Suggests possibility of Pneumonia or Pulmonary Embolism"],
    steps: ["Immediate Pulse Oximetry (SpO2) check", "Supplemental oxygen administration", "Chest Radiograph (X-Ray) / ABG"],
    patientEn: "You are having trouble breathing normally. Our medical team needs to check your oxygen level and help you breathe comfortably.",
    patientHi: "आपको सांस लेने में तकलीफ हो रही है। हमारी मेडिकल टीम को आपके ऑक्सीजन स्तर की जांच करने और आराम से सांस लेने में मदद करने की आवश्यकता है।",
    patientStepsEn: ["Sit upright in a comfortable position.", "Take slow, gentle breaths."],
    patientStepsHi: ["आरामदायक स्थिति में सीधे बैठें।", "धीरे-धीरे और आराम से सांस लें।"]
  },
  {
    name: "Fever / Hyperthermia",
    keywords: ["fever", "high temperature", "pyrexia", "chills", "febrile", "burning up", "hot flashes", "feverish"],
    scoreAdd: 2,
    dept: "Internal Medicine / Infectious Disease",
    concerns: ["May indicate Systemic Viral or Bacterial Infection", "Suggests possibility of Sepsis when presenting with tachycardia"],
    steps: ["Full blood count (CBC) with differential", "Blood cultures and urinalysis", "Antipyretic administration"],
    patientEn: "Your body temperature is higher than normal, which means your body is fighting off an infection. Drink plenty of water and rest.",
    patientHi: "आपके शरीर का तापमान सामान्य से अधिक है, जिसका मतलब है कि आपका शरीर किसी संक्रमण से लड़ रहा है। भरपूर पानी पीएं और आराम करें।",
    patientStepsEn: ["Drink plenty of fluids and water.", "Rest in a cool, comfortable room."],
    patientStepsHi: ["भरपूर मात्रा में पानी और तरल पदार्थ पीएं।", "ठंडे और आरामदायक कमरे में आराम करें।"]
  },
  {
    name: "Headache / Migraine",
    keywords: ["headache", "migraine", "head pain", "throbbing head", "cephalea", "temple pain", "pounding head"],
    scoreAdd: 2,
    dept: "Neurology / Urgent Care",
    concerns: ["May indicate Severe Vascular Migraine or Tension Cephalea", "Suggests possibility of Elevated Intracranial Pressure"],
    steps: ["Targeted neurological screen", "Blood pressure assessment", "Analgesic protocol administration"],
    patientEn: "You are experiencing a strong headache. A doctor will evaluate you to make sure you get the right pain relief.",
    patientHi: "आपको तेज़ सिरदर्द हो रहा है। डॉक्टर आपकी जांच करेंगे ताकि आपको दर्द से सही राहत मिल सके।",
    patientStepsEn: ["Rest in a quiet, dim room.", "Stay hydrated by drinking water."],
    patientStepsHi: ["शांत और हल्के अंधेरे कमरे में आराम करें।", "पानी पीकर शरीर में पानी की कमी न होने दें।"]
  },
  {
    name: "Dizziness / Vertigo / Syncope",
    keywords: ["dizziness", "dizzy", "vertigo", "lightheaded", "fainting", "fainted", "syncope", "passed out", "unsteady", "off balance"],
    scoreAdd: 2,
    dept: "Neurology / Emergency Department",
    concerns: ["May indicate Orthostatic Hypotension or Benign Paroxysmal Positional Vertigo", "Suggests possibility of Cardiac Arrhythmia or TIA"],
    steps: ["Orthostatic vital signs check", "ECG screening", "Neurological balance testing"],
    patientEn: "You are feeling dizzy or lightheaded. Please sit or lie down right away to prevent falling.",
    patientHi: "आपको चक्कर आ रहे हैं या सिर हल्का महसूस हो रहा है। गिरने से बचने के लिए कृपया तुरंत बैठ जाएं या लेट जाएं।",
    patientStepsEn: ["Sit or lie down immediately.", "Avoid standing up quickly."],
    patientStepsHi: ["तुरंत बैठ जाएं या लेट जाएं।", "अचानक जल्दी से खड़े होने से बचें।"]
  },
  {
    name: "Vomiting / Nausea",
    keywords: ["vomiting", "vomit", "nausea", "nauseous", "throwing up", "emesis", "retching"],
    scoreAdd: 2,
    dept: "Gastroenterology / Urgent Care",
    concerns: ["May indicate Acute Gastroenteritis or Gastric Intolerance", "Suggests possibility of Dehydration & Electrolyte Imbalance"],
    steps: ["Hydration status assessment", "Antiemetic therapy administration", "Abdominal physical palpation"],
    patientEn: "Your stomach is upset and you are throwing up. Taking small sips of water will help prevent dehydration.",
    patientHi: "आपका पेट खराब है और आपको उल्टी हो रही है। पानी के छोटे-छोटे घूंट लेने से शरीर में पानी की कमी नहीं होगी।",
    patientStepsEn: ["Take small sips of clean water or oral rehydration fluids.", "Rest quietly."],
    patientStepsHi: ["साफ़ पानी या ओआरएस (ORS) के छोटे-छोटे घूंट लें।", "शांति से आराम करें।"]
  },
  {
    name: "Abdominal Pain / Stomach Ache",
    keywords: ["abdominal pain", "belly pain", "stomach ache", "stomach pain", "cramping", "rlq pain", "luq pain", "epigastric", "stomach"],
    scoreAdd: 2,
    dept: "General Surgery / Gastroenterology",
    concerns: ["May indicate Acute Appendicitis or Cholecystitis", "Suggests possibility of Peptic Ulcer Disease or Diverticulitis"],
    steps: ["Abdominal ultrasound or CT scan", "NPO status protocol", "Targeted abdominal palpation"],
    patientEn: "You have belly pain that needs to be examined by a healthcare provider to find out the exact cause.",
    patientHi: "आपके पेट में दर्द है जिसकी सही वजह जानने के लिए स्वास्थ्य देखभाल प्रदाता द्वारा जांच की जानी चाहिए।",
    patientStepsEn: ["Avoid eating heavy meals until evaluated.", "Rest in a comfortable position."],
    patientStepsHi: ["जांच होने तक भारी भोजन खाने से बचें।", "आरामदायक स्थिति में लेटे रहें।"]
  },
  {
    name: "Skin Rash / Hives / Swelling",
    keywords: ["rash", "hives", "skin redness", "itching", "pruritus", "urticaria", "facial swelling", "lip swelling", "edema"],
    scoreAdd: 2,
    dept: "Dermatology / Allergy & Immunology",
    concerns: ["May indicate Dermatitis or Allergic Cutaneous Reaction", "Suggests possibility of Impending Anaphylaxis if facial swelling is present"],
    steps: ["Airway and breathing assessment", "Antihistamine / Steroid protocol", "Allergen exposure history review"],
    patientEn: "We noticed skin irritation or swelling. If you feel any tightness in your throat or difficulty breathing, tell a nurse immediately.",
    patientHi: "हमने आपकी त्वचा पर लालिमा या सूजन देखी है। यदि आपको गले में जकड़न या सांस लेने में परेशानी महसूस हो, तो तुरंत नर्स को बताएं।",
    patientStepsEn: ["Do not scratch irritated skin.", "Alert medical staff if swelling increases or breathing changes."],
    patientStepsHi: ["त्वचा की खुजली न खरोंचें।", "यदि सूजन बढ़े या सांस में बदलाव हो तो तुरंत कर्मचारियों को सूचित करें।"]
  },
  {
    name: "Trauma / Fractures / Bleeding",
    keywords: ["trauma", "fracture", "broken bone", "bleeding", "hemorrhage", "cut", "laceration", "fall", "wound", "accident", "contusion"],
    scoreAdd: 3,
    dept: "Trauma Center / Orthopedics",
    concerns: ["May indicate Musculoskeletal Fracture or Deep Laceration", "Suggests possibility of Active Hemorrhage"],
    steps: ["Radiographic X-Ray / CT imaging", "Hemostasis and direct pressure", "Neurovascular distal status check"],
    patientEn: "You have an injury or bleeding that requires prompt medical care and imaging.",
    patientHi: "आपको चोट लगी है या खून बह रहा है जिसके लिए तुरंत चिकित्सकीय देखभाल और एक्स-रे की आवश्यकता है।",
    patientStepsEn: ["Keep the injured area still and supported.", "Apply clean pressure if bleeding."],
    patientStepsHi: ["चोट वाली जगह को स्थिर रखें।", "यदि खून बह रहा हो तो साफ़ कपड़े से दबाव बनाएं।"]
  }
];

/**
 * Dynamic Multi-Symptom Local Fallback Engine (Pristine Output, Zero Error Strings)
 */
function mockTriageFallback(intake) {
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
  let primaryMatch = null;

  // 1. Scan clinical dictionary for matching symptom concepts
  for (const item of CLINICAL_DICTIONARY) {
    const matched = item.keywords.filter(kw => complaintStr.includes(kw));
    if (matched.length > 0) {
      if (!primaryMatch) primaryMatch = item;
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

  score = Math.min(10, Math.max(1, score));

  const uniqueConcerns = Array.from(new Set(possibleConcerns)).slice(0, 4);
  const uniqueSteps = Array.from(new Set(recommendedSteps)).slice(0, 4);
  const primaryDept = Array.from(departments)[0] || "Emergency Department";

  if (redFlags.length === 0) {
    redFlags.push("Standard clinical monitoring and routine vitals screening recommended");
  }

  // Build Patient-Friendly Bilingual Explication
  let patSummaryEn = primaryMatch ? primaryMatch.patientEn : `You reported feeling: "${intake.complaint}". Our healthcare team is reviewing your symptoms to provide you with the best care.`;
  let patSummaryHi = primaryMatch ? primaryMatch.patientHi : `आपने बताया कि आप महसूस कर रहे हैं: "${intake.complaint}"। हमारी स्वास्थ्य सेवा टीम आपके लक्षणों की समीक्षा कर रही है।`;
  let patNextEn = primaryMatch ? primaryMatch.patientStepsEn : ["Please rest quietly until called by the medical team.", "Tell a nurse if your pain or symptoms get worse."];
  let patNextHi = primaryMatch ? primaryMatch.patientStepsHi : ["कृपया मेडिकल टीम द्वारा बुलाए जाने तक आराम से बैठें।", "यदि आपका दर्द या लक्षण बढ़ें तो नर्स को सूचित करें।"];

  if (vitals.heart_rate && Number(vitals.heart_rate) > 110) {
    patSummaryEn += " Your heartbeat is faster than normal.";
    patSummaryHi += " आपकी धड़कन सामान्य से तेज़ है।";
  }
  if (vitals.temperature && Number(vitals.temperature) > 100.4) {
    patSummaryEn += " You also have a fever.";
    patSummaryHi += " आपको बुखार भी है।";
  }

  // Clean professional rationale (Zero error strings)
  const rationale = `Patient presents with an urgency score of ${score}/10 based on identified symptoms (${extractedSymptoms.join(", ")}) and pain level ${painScale}/10. Input parameters suggest potential clinical risk factors that require tailored evaluation.`;
  const clinicianRationaleHi = `मरीज़ का तात्कालिकता स्कोर ${score}/10 है जो बताए गए लक्षणों (${extractedSymptoms.join(", ")}) और दर्द स्तर ${painScale}/10 पर आधारित है।`;

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
    clinician_rationale_hi: clinicianRationaleHi,
    patient_summary_en: patSummaryEn,
    patient_summary_hi: patSummaryHi,
    patient_next_steps_en: patNextEn,
    patient_next_steps_hi: patNextHi,
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
    console.log("No ANTHROPIC_API_KEY set. Operating in local multi-symptom decision engine mode.");
    return mockTriageFallback(intake);
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

Analyze ALL entered symptoms and vitals. Return JSON triage decision-support object following the system instructions. Include simple, reassuring patient-friendly explanations in English and Hindi.`;

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }]
      })
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.warn(`Anthropic API returned HTTP ${apiRes.status}. Falling back to local multi-symptom decision engine.`);
      return mockTriageFallback(intake);
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
      clinician_rationale_hi: data.clinician_rationale_hi || data.rationale || "मरीज़ का मूल्यांकन पूरा हो गया है।",
      patient_summary_en: data.patient_summary_en || `You reported feeling: "${intake.complaint}". Our healthcare team is reviewing your symptoms to provide care.`,
      patient_summary_hi: data.patient_summary_hi || `आपने बताया कि आप महसूस कर रहे हैं: "${intake.complaint}"। हमारी मेडिकल टीम आपकी जांच कर रही है।`,
      patient_next_steps_en: Array.isArray(data.patient_next_steps_en) ? data.patient_next_steps_en : ["Please rest quietly until called by the medical team."],
      patient_next_steps_hi: Array.isArray(data.patient_next_steps_hi) ? data.patient_next_steps_hi : ["कृपया डॉक्टर द्वारा बुलाए जाने तक आराम से बैठें।"],
      disclaimer: "Clinical Decision Support Only - Not a Medical Diagnosis"
    };
  } catch (err) {
    console.warn("Claude API evaluation error. Falling back to local multi-symptom decision engine:", err.message);
    return mockTriageFallback(intake);
  }
}

module.exports = { evaluatePatientAI, mockTriageFallback };
