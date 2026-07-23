/**
 * Claude AI Triage Reasoning Engine (Zero Dependencies)
 * -----------------------------------------------------
 * Uses native fetch to call Anthropic's Claude API.
 * Enforces strict JSON response format, safe Markdown fence stripping, and fallback mock execution.
 */

const SYSTEM_PROMPT = `You are Vitalis, a Clinical Intake Decision-Support Assistant for ER and Urgent Care triage nurses.
You assist hospital staff by assessing incoming patient information and providing an initial urgency score, key red flags, and plain-language clinical rationale.

IMPORTANT CONSTRAINTS & GUIDELINES:
1. THIS IS A DECISION-SUPPORT TOOL, NOT A DIAGNOSTIC TOOL. Never phrase your output or rationale as a definitive diagnosis or medical claim. Use phrasing like "symptoms suggest", "requires evaluation for", "indicates potential", or "may present risk of".
2. Assess urgency on a scale of 1 to 10:
   - 1-3: Low Urgency / Non-Urgent (minor cuts, mild cold symptoms, routine prescription refill)
   - 4-7: Moderate Urgency (moderate pain, persistent fever, minor fractures, abdominal pain without distress)
   - 8-10: High / Critical Urgency (chest pain, severe respiratory distress, acute trauma, stroke symptoms, uncontrolled severe pain)
3. You MUST reply ONLY with a raw, valid JSON object matching this EXACT schema:
{
  "urgency_score": <integer from 1 to 10>,
  "red_flags": [<string>, <string>],
  "rationale": "<1-2 sentence plain-language clinical explanation>"
}
4. Do NOT include any markdown formatting, preambles, explanations, or commentary outside of the raw JSON object.
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

function mockTriageFallback(intake, reason = "Fallback AI Reasoning") {
  const c = (intake.complaint || "").toLowerCase();
  const pain = intake.pain_scale || 1;
  const vitals = intake.vitals || {};

  let score = 3;
  const red_flags = [];

  // Category A: Immediate Life-Threats (Score 9-10)
  const life_threats = ["cardiac arrest", "heart attack", "myocardial infarction", "crushing chest pain", "throat swelling", "anaphylaxis", "gunshot", "amputation", "diabetic coma"];
  if (life_threats.some(k => c.includes(k))) {
    score = 10;
    red_flags.push("High-risk acuity: Potential immediate life-threat (cardiac, airway, or catastrophic trauma)");
  }
  // Category B: Urgent / Semi-Critical (Score 7-8)
  else if (["chest pain", "shortness of breath", "difficulty breathing", "numbness", "slurred speech", "fainting", "unresponsive", "seizure", "appendicitis", "vomiting blood", "black stool", "compound fracture", "head injury"].some(k => c.includes(k))) {
    score = 8;
    red_flags.push("High-risk acuity: Potential stroke, cardiovascular distress, or internal bleeding");
  }
  // Category C: Moderate (Score 5-6)
  else if (["kidney infection", "migraine", "animal bite", "insect bite", "dehydration", "deep cut", "pneumonia", "fracture", "burn"].some(k => c.includes(k))) {
    score = 6;
    red_flags.push("Moderate acuity: Clinical diagnostic workup and pain management required");
  } else if (pain >= 8) {
    score = Math.max(score, 7);
    red_flags.push("Elevated pain score (8+/10)");
  }

  // Vitals influence
  if (vitals.heart_rate && vitals.heart_rate > 110) {
    score = Math.max(score, score + 1);
    red_flags.push("Elevated resting heart rate (Tachycardia)");
  }
  if (vitals.temperature && vitals.temperature > 101.5) {
    score = Math.max(score, score + 1);
    red_flags.push("Pyrexia / Elevated body temperature");
  }

  // Medical history & age checks in fallback
  const history = (intake.medical_history || "").toLowerCase();
  if (intake.age != null) {
    const ageNum = Number(intake.age);
    if (ageNum >= 65) {
      if (["chest", "heart", "breath", "fever", "dizziness"].some(k => c.includes(k))) {
        score = Math.max(score, 9);
        red_flags.push("🚨 SAFETY ALERT: Geriatric patient presenting with cardiorespiratory or systemic symptoms");
      } else {
        score = Math.max(score, score + 1);
      }
    } else if (ageNum <= 2) {
      score = Math.max(score, score + 1);
      red_flags.push("Pediatric risk factor: Infant age group (<2 y/o)");
    }
  }

  if (["heart", "cardiac", "stroke", "diabetes", "asthma", "copd"].some(k => history.includes(k))) {
    if (["chest", "breath", "difficulty"].some(k => c.includes(k))) {
      score = Math.max(score, 9);
      red_flags.push(`🚨 SAFETY ALERT: Cardiorespiratory complaint with comorbid history of ${intake.medical_history}`);
    } else {
      score = Math.max(score, score + 1);
    }
  }

  score = Math.min(10, Math.max(1, score));

  if (red_flags.length === 0) {
    red_flags.push("Standard triage assessment recommended");
  }

  const rationale = `Symptom profile presents with ${score}/10 estimated urgency based on reported complaint '${intake.complaint}' and pain level ${pain}/10. (${reason})`;

  return {
    urgency_score: score,
    red_flags,
    rationale
  };
}

async function evaluatePatientAI(intake) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const modelName = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022";

  if (!apiKey) {
    console.log("No ANTHROPIC_API_KEY set. Operating in local heuristic mock mode.");
    return mockTriageFallback(intake, "Mock AI Engine - API Key Not Configured");
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

    const userContent = `Patient Intake Summary:
- Name: ${intake.name}
- Age: ${ageText}
- Gender: ${genderText}
- Chief Complaint: ${intake.complaint}
- Self-Reported Pain Scale: ${intake.pain_scale}/10
- Vitals: ${vitalsText}
- Past Medical History: ${historyText}
- Allergies: ${allergiesText}
- Active Medications: ${medsText}

Provide JSON triage decision-support object.`;

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 300,
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

    let red_flags = data.red_flags || [];
    if (typeof red_flags === "string") {
      red_flags = [red_flags];
    }
    const rationale = data.rationale || "Assessment generated from patient complaint and vitals.";

    return {
      urgency_score: score,
      red_flags,
      rationale
    };
  } catch (err) {
    console.error("Claude API evaluation failed or returned malformed JSON:", err.message);
    return mockTriageFallback(intake, `AI Fallback active due to API parsing issue: ${err.message.substring(0, 250)}`);
  }
}

module.exports = { evaluatePatientAI, mockTriageFallback };
