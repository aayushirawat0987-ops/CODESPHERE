/**
 * Vitalis / TriageAI - Zero-Dependency Node.js Backend Server
 * -------------------------------------------------------------
 * Clinical Decision-Support Tool backend written using pure Node.js built-in HTTP module.
 * Features: Triage Queue, AI Decision Support, Safety Rule Engine, Voice Analysis, Face Vision API.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

// Load .env file automatically using built-in fs
function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...vals] = trimmed.split("=");
        process.env[key.trim()] = vals.join("=").trim();
      }
    }
  }
}
loadEnv();

const { db, calendarDb } = require("./storage");
const { evaluateClinicalRules } = require("./ruleEngine");
const { evaluatePatientAI } = require("./aiEngine");
const { evaluateFaceImage } = require("./faceEngine");
const { SURGE_PATIENTS } = require("./surgeData");
const { analyzeVoiceTranscriptNLP } = require("./voiceSymptomMap");

const PORT = parseInt(process.env.PORT || "8000", 10);
const HOST = process.env.HOST || "0.0.0.0";

// Helper to read incoming JSON body
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

// Surge simulation worker
async function runSurgeSimulationBatch() {
  for (const p of SURGE_PATIENTS) {
    const vitalsObj = p.vitals || {};
    const intake = {
      name: String(p.name),
      complaint: String(p.complaint),
      pain_scale: parseInt(p.pain_scale, 10),
      vitals: vitalsObj,
      age: p.age || null,
      gender: p.gender || null,
      medical_history: p.medical_history || null
    };

    const ruleRes = evaluateClinicalRules({
      vitals: vitalsObj,
      pain_scale: intake.pain_scale,
      complaint: intake.complaint,
      medical_history: intake.medical_history || "",
      age: intake.age || null
    });

    const aiRes = await evaluatePatientAI(intake);
    db.addPatient(intake, aiRes, ruleRes);

    await new Promise(resolve => setTimeout(resolve, 400));
  }
}

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  function json(data, status = 200) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }

  function error(message, status = 500) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ detail: message }));
  }

  try {
    // GET /api/health
    if (pathname === "/api/health" && req.method === "GET") {
      return json({ status: "ok", service: "Vitalis TriageAI Core (Node.js with Voice & Face APIs)" });
    }

    // GET /api/patients
    if (pathname === "/api/patients" && req.method === "GET") {
      return json(db.getAllPatients());
    }

    // POST /api/patients
    if (pathname === "/api/patients" && req.method === "POST") {
      const intake = await readJsonBody(req);
      console.log(`Processing intake for patient: ${intake.name}`);

      const ruleRes = evaluateClinicalRules({
        vitals: intake.vitals || {},
        pain_scale: intake.pain_scale || 1,
        complaint: intake.complaint || "",
        medical_history: intake.medical_history || "",
        age: intake.age != null ? intake.age : null
      });

      const aiRes = await evaluatePatientAI(intake);
      const record = db.addPatient(intake, aiRes, ruleRes);
      return json(record, 201);
    }

    // GET /api/patients/:id
    if (pathname.startsWith("/api/patients/") && !pathname.endsWith("/override") && req.method === "GET") {
      const id = pathname.replace("/api/patients/", "");
      const record = db.getPatient(id);
      if (!record) return error("Patient record not found", 404);
      return json(record);
    }

    // PATCH /api/patients/:id/override
    if (pathname.startsWith("/api/patients/") && pathname.endsWith("/override") && req.method === "PATCH") {
      const parts = pathname.split("/");
      const id = parts[3];
      const body = await readJsonBody(req);
      const { score, reason, staff_name } = body;

      if (score == null || !reason) {
        return error("score and reason are required for override", 422);
      }

      const updatedRecord = db.applyOverride(id, { score, reason, staff_name });
      if (!updatedRecord) return error("Patient record not found", 404);

      console.log(`Staff override applied to ${id}: Score set to ${score}`);
      return json(updatedRecord);
    }

    // PATCH /api/patients/:id/prescription
    if (pathname.startsWith("/api/patients/") && pathname.endsWith("/prescription") && req.method === "PATCH") {
      const parts = pathname.split("/");
      const id = parts[3];
      const body = await readJsonBody(req);
      const updatedRecord = db.addPrescription(id, body);
      if (!updatedRecord) return error("Patient record not found", 404);
      return json(updatedRecord);
    }

    // PATCH /api/patients/:id/status
    if (pathname.startsWith("/api/patients/") && pathname.endsWith("/status") && req.method === "PATCH") {
      const parts = pathname.split("/");
      const id = parts[3];
      const body = await readJsonBody(req);
      const { status } = body;

      if (!status) {
        return error("status is required", 422);
      }

      const updatedRecord = db.updateTreatmentStatus(id, status);
      if (!updatedRecord) return error("Patient record not found", 404);
      return json(updatedRecord);
    }

    // POST /api/surge
    if (pathname === "/api/surge" && req.method === "POST") {
      runSurgeSimulationBatch().catch(err => console.error("Surge error:", err));
      return json({ status: "Surge simulation started", patient_count: SURGE_PATIENTS.length });
    }

    // POST /api/clear
    if (pathname === "/api/clear" && req.method === "POST") {
      db.clear();
      return json({ status: "Queue cleared" });
    }

    // Calendar endpoints
    if (pathname === "/api/calendar" && req.method === "GET") {
      const list = await calendarDb.getAllPatients();
      return json(list);
    }

    if (pathname === "/api/calendar" && req.method === "POST") {
      const body = await readJsonBody(req);
      const record = await calendarDb.addPatient(body);
      return json(record, 201);
    }

    if (pathname.startsWith("/api/calendar/") && req.method === "PUT") {
      const id = pathname.replace("/api/calendar/", "");
      const body = await readJsonBody(req);
      const updated = await calendarDb.updatePatient(id, body);
      if (!updated) return error("Calendar patient not found", 404);
      return json(updated);
    }

    if (pathname.startsWith("/api/calendar/") && req.method === "DELETE") {
      const id = pathname.replace("/api/calendar/", "");
      const success = await calendarDb.deletePatient(id);
      if (!success) return error("Calendar patient not found", 404);
      return json({ status: "success", message: "Calendar patient deleted" });
    }

    // POST /api/voice-analysis (Multi-symptom NLP voice transcript analysis)
    if (pathname === "/api/voice-analysis" && req.method === "POST") {
      const body = await readJsonBody(req);
      const result = analyzeVoiceTranscriptNLP(body.transcript);
      return json(result);
    }

    // POST /api/voice-intake (Auto-creates patient record from voice transcript)
    if (pathname === "/api/voice-intake" && req.method === "POST") {
      const body = await readJsonBody(req);
      const transcript = body.transcript || "Patient voice intake";
      const name = body.name || "Voice Intake Patient";

      const intake = {
        name,
        complaint: transcript,
        pain_scale: body.pain_scale || 5,
        vitals: body.vitals || {}
      };

      const ruleRes = evaluateClinicalRules({
        vitals: intake.vitals,
        pain_scale: intake.pain_scale,
        complaint: intake.complaint,
        medical_history: "",
        age: null
      });

      const aiRes = await evaluatePatientAI(intake);
      const record = db.addPatient(intake, aiRes, ruleRes);
      return json(record, 201);
    }

    // POST /api/face-analysis (Facial distress and FAST vision analysis across 8 visual observations)
    if (pathname === "/api/face-analysis" && req.method === "POST") {
      const body = await readJsonBody(req);
      const result = await evaluateFaceImage(body);
      return json(result);
    }

    // 404 Fallback
    return error("Endpoint not found", 404);
  } catch (err) {
    console.error("Server Request Error:", err);
    return error(err.message || "Internal Server Error", 500);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Starting Vitalis / TriageAI Server on http://${HOST}:${PORT} (Voice & Face APIs active)`);
});
