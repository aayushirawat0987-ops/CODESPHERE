/**
 * Rule-Based Cross-Check Layer for Triage Safety
 * ------------------------------------------------
 * Provides deterministic, rule-based clinical safety guardrails.
 * Ensures vital sign threshold anomalies automatically boost urgency scores and surface clinical red flags.
 */

function evaluateClinicalRules({ vitals = {}, pain_scale, complaint = "", medical_history = "", age = null }) {
  let boost = 0;
  const flags = [];
  const notes = [];

  const hr = vitals.heart_rate != null ? Number(vitals.heart_rate) : null;
  const temp = vitals.temperature != null ? Number(vitals.temperature) : null;
  const bp_str = vitals.blood_pressure || "";
  const complaint_lower = (complaint || "").toLowerCase();
  const history_lower = (medical_history || "").toLowerCase();

  // RULE 1: Sepsis Risk Screening (Tachycardia + Hyperthermia/Fever)
  if (hr !== null && temp !== null) {
    if (hr > 120 && temp > 101.0) {
      boost += 2;
      flags.push("🚨 SAFETY ALERT: Possible Sepsis Risk (High HR + Fever)");
      notes.push(`Rule Triggered: HR (${hr} bpm) > 120 AND Temp (${temp}°F) > 101°F`);
    }
  }

  // RULE 2: Isolated Severe Tachycardia or Bradycardia
  if (hr !== null) {
    if (hr >= 140) {
      boost += 2;
      flags.push("🚨 SAFETY ALERT: Critical Tachycardia (HR ≥ 140 bpm)");
      notes.push(`Rule Triggered: HR (${hr} bpm) ≥ 140`);
    } else if (hr < 45) {
      boost += 2;
      flags.push("🚨 SAFETY ALERT: Severe Bradycardia (HR < 45 bpm)");
      notes.push(`Rule Triggered: HR (${hr} bpm) < 45`);
    }
  }

  // RULE 3: Severe High Fever
  if (temp !== null && temp >= 103.5) {
    boost += 1;
    flags.push("⚠️ SAFETY ALERT: Severe High Fever (≥ 103.5°F)");
    notes.push(`Rule Triggered: Temp (${temp}°F) ≥ 103.5`);
  }

  // RULE 4: Hypertensive Crisis Parsing
  if (bp_str && bp_str.includes("/")) {
    try {
      const parts = bp_str.trim().split("/");
      const systolic = parseInt(parts[0].trim(), 10);
      const diastolic = parseInt(parts[1].trim(), 10);
      if (systolic >= 180 || diastolic >= 120) {
        boost += 2;
        flags.push("🚨 SAFETY ALERT: Hypertensive Crisis Threshold (BP ≥ 180/120)");
        notes.push(`Rule Triggered: BP (${bp_str}) exceeds critical blood pressure limit`);
      }
    } catch (e) {
      // Ignore invalid BP strings
    }
  }

  // RULE 5: Pain Scale 10/10 Override Warning
  if (pain_scale === 10) {
    flags.push("⚠️ High Pain Alert (10/10 Pain Scale)");
    notes.push("Rule Triggered: Maximum Pain Score reported");
  }

  // RULE 6: Category A: Immediate Life-Threats (Boost +3)
  const life_threat_keywords = {
    "cardiac arrest": "Cardiac Arrest",
    "heart attack": "Myocardial Infarction (Heart Attack)",
    "crushing chest pain": "Acute Coronary Syndrome / Crushing Chest Pain",
    "throat swelling": "Anaphylaxis / Airway Compromise",
    "anaphylaxis": "Anaphylaxis / Severe Allergic Reaction",
    "gunshot": "Penetrating Trauma / Gunshot Wound",
    "amputation": "Traumatic Amputation / Severe Bleeding",
    "diabetic coma": "Critical Diabetic Crisis / Coma"
  };

  for (const [keyword, desc] of Object.entries(life_threat_keywords)) {
    if (complaint_lower.includes(keyword)) {
      boost += 3;
      flags.push(`🚨 CRITICAL ALERT: ${desc}`);
      notes.push(`Rule Triggered: Life-threat keyword match '${keyword}'`);
    }
  }

  // RULE 7: Category B: Urgent / Semi-Critical (Boost +2)
  const urgent_keywords = {
    "chest pain": "Chest Pain (Potential Cardiovascular Event)",
    "shortness of breath": "Respiratory Distress / Dyspnea",
    "difficulty breathing": "Respiratory Distress / Dyspnea",
    "numbness": "Potential Neurological Deficit",
    "slurred speech": "Potential Stroke / CVA (Neurological Deficit)",
    "fainting": "Syncope / Loss of Consciousness",
    "unresponsive": "Altered Mental Status / Unresponsive",
    "seizure": "Acute Seizure Activity",
    "appendicitis": "Appendicitis / Severe Right Lower Quadrant Pain",
    "vomiting blood": "Acute Upper Gastrointestinal Bleed",
    "black stool": "Gastrointestinal Bleed (Melena)",
    "compound fracture": "Open/Compound Fracture",
    "head injury": "Traumatic Brain Injury / Head Injury with Altered Status"
  };

  for (const [keyword, desc] of Object.entries(urgent_keywords)) {
    if (complaint_lower.includes(keyword)) {
      if (keyword === "chest pain" && complaint_lower.includes("crushing chest pain")) {
        continue;
      }
      boost += 2;
      flags.push(`⚡ URGENT ALERT: ${desc}`);
      notes.push(`Rule Triggered: Urgent keyword match '${keyword}'`);
    }
  }

  // RULE 8: Category C: Moderate / Diagnostics (Boost +1)
  const moderate_keywords = {
    "kidney infection": "Potential Pyelonephritis (Kidney Infection)",
    "migraine": "Severe Acute Cephalea / Migraine",
    "animal bite": "Zoonotic Exposure / Animal Bite",
    "insect bite": "Insect Bite / Possible Allergic Reaction",
    "dehydration": "Severe Dehydration / Volume Depletion",
    "deep cut": "Severe Laceration requiring Sutures",
    "pneumonia": "Pneumonia / Lower Respiratory Infection"
  };

  for (const [keyword, desc] of Object.entries(moderate_keywords)) {
    if (complaint_lower.includes(keyword)) {
      boost += 1;
      flags.push(`⚠️ MODERATE ALERT: ${desc}`);
      notes.push(`Rule Triggered: Moderate keyword match '${keyword}'`);
    }
  }

  // RULE 9: Comorbidity Triggers
  if (history_lower.includes("heart") || history_lower.includes("cardiac") || history_lower.includes("hypertension")) {
    if (["chest pain", "dizziness", "shortness of breath"].some(k => complaint_lower.includes(k))) {
      boost += 3;
      flags.push("🚨 SAFETY ALERT: Cardiorespiratory symptom in patient with Cardiac/Hypertension history");
      notes.push("Rule Triggered: Heart/Hypertension History + Cardiac Symptom");
    }
  }

  if (history_lower.includes("asthma") || history_lower.includes("copd")) {
    if (["breath", "wheez", "cough"].some(k => complaint_lower.includes(k))) {
      boost += 2;
      flags.push("🚨 SAFETY ALERT: Acute respiratory symptom with comorbid Asthma/COPD history");
      notes.push("Rule Triggered: Asthma/COPD History + Respiratory Symptom");
    }
  }

  if (history_lower.includes("diabet")) {
    if (["confus", "dizz", "thirst", "faint"].some(k => complaint_lower.includes(k))) {
      boost += 2;
      flags.push("🚨 SAFETY ALERT: Potential Diabetic Crisis (DKA/Hypoglycemia) with Diabetes history");
      notes.push("Rule Triggered: Diabetes History + Metabolic Symptom");
    }
  }

  // RULE 10: Age Risk Boosts
  if (age !== null && age !== undefined) {
    const ageNum = Number(age);
    if (ageNum >= 65) {
      if (["chest", "breath", "dizz", "fever"].some(k => complaint_lower.includes(k))) {
        boost += 2;
        flags.push("🚨 SAFETY ALERT: Geriatric patient presenting with high-risk clinical symptoms");
        notes.push(`Rule Triggered: Age (${ageNum}) ≥ 65 + Symptom`);
      }
    } else if (ageNum <= 2) {
      boost += 1;
      flags.push("⚠️ SAFETY ALERT: Pediatric infant risk factor (<2 y/o)");
      notes.push(`Rule Triggered: Age (${ageNum}) <= 2`);
    }
  }

  return {
    rule_score_boost: boost,
    rule_red_flags: flags,
    rule_notes: notes
  };
}

module.exports = { evaluateClinicalRules };
