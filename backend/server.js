/**
 * Vitalis / TriageAI - Node.js Backend Server
 * -------------------------------------------------------------
 * Features: Triage Queue, Persistent SQLite/JSON Database, Auth System,
 * Role-Based Access Control, Patient Timeline, Daily Stats, Audit Logs, Voice & Face Vision.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

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

const dbEngine = require("./db");
const { PatientStorage, CalendarStorage } = require("./storage");
const db = new PatientStorage();
const calendarDb = new CalendarStorage();
const { evaluateClinicalRules } = require("./ruleEngine");
const { evaluatePatientAI } = require("./aiEngine");
const { evaluateFaceImage } = require("./faceEngine");
const { SURGE_PATIENTS } = require("./surgeData");
const { analyzeVoiceTranscriptNLP } = require("./voiceSymptomMap");

const PORT = parseInt(process.env.PORT || "8000", 10);
const HOST = process.env.HOST || "0.0.0.0";

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
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

const server = http.createServer(async (req, res) => {
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

  try {
    // 1. Authentication Routes
    if (pathname === "/api/auth/login" && req.method === "POST") {
      const body = await readJsonBody(req);
      const user = dbEngine.findUserByUsername(body.username || "");
      if (!user || user.password !== body.password) {
        return json({ error: "Invalid username or password" }, 401);
      }
      dbEngine.logAction(user.id, user.username, user.role, "USER_LOGIN", `${user.name} logged in`);
      return json({ user, token: `token_${user.id}` });
    }

    if (pathname === "/api/auth/register" && req.method === "POST") {
      const body = await readJsonBody(req);
      if (!body.username || !body.name) {
        return json({ error: "Username and name are required" }, 400);
      }
      const existing = dbEngine.findUserByUsername(body.username);
      if (existing) {
        return json({ error: "Username already exists" }, 400);
      }
      const newUser = dbEngine.createUser(body);
      return json({ user: newUser, token: `token_${newUser.id}` });
    }

    // 2. Health check
    if (pathname === "/" || pathname === "/health") {
      return json({ status: "ok", app: "Vitalis TriageAI Backend Engine", mode: "Persistent SQLite File Database" });
    }

    // 3. Triage Queue API
    if (pathname === "/api/patients" && req.method === "GET") {
      return json(db.getAllPatients());
    }

    if (pathname === "/api/patients" && req.method === "POST") {
      const intake = await readJsonBody(req);
      if (!intake.name || !intake.complaint || !intake.pain_scale) {
        return json({ error: "Missing required intake fields (name, complaint, pain_scale)" }, 400);
      }
      const vitals = intake.vitals || {};
      const ruleRes = evaluateClinicalRules({
        vitals,
        pain_scale: intake.pain_scale,
        complaint: intake.complaint,
        medical_history: intake.medical_history || "",
        age: intake.age || null
      });
      const aiRes = await evaluatePatientAI(intake);
      const record = db.addPatient(intake, aiRes, ruleRes);
      return json(record, 201);
    }

    // Single Patient Detail
    if (pathname.startsWith("/api/patients/") && req.method === "GET") {
      const parts = pathname.split("/");
      const pId = parts[3];

      if (parts[4] === "timeline") {
        const timeline = dbEngine.getPatientTimeline(pId);
        return json(timeline);
      }

      const record = db.getPatient(pId);
      if (!record) return json({ error: "Patient not found" }, 404);
      return json(record);
    }

    // Add Consultation Note / Diagnosis
    if (pathname.startsWith("/api/patients/") && pathname.endsWith("/notes") && req.method === "POST") {
      const parts = pathname.split("/");
      const pId = parts[3];
      const body = await readJsonBody(req);
      body.patient_id = pId;
      const note = dbEngine.addConsultationNote(body);
      return json(note, 201);
    }

    // Staff Override
    if (pathname.startsWith("/api/patients/") && pathname.endsWith("/override") && req.method === "POST") {
      const parts = pathname.split("/");
      const pId = parts[3];
      const reqBody = await readJsonBody(req);
      if (!reqBody.score || !reqBody.reason) {
        return json({ error: "Missing override score or reason" }, 400);
      }
      const record = db.applyOverride(pId, reqBody);
      if (!record) return json({ error: "Patient not found" }, 404);
      return json(record);
    }

    // Clear Queue
    if (pathname === "/api/patients" && req.method === "DELETE") {
      db.clearQueue();
      return json({ status: "queue_cleared" });
    }

    // Surge Simulation
    if (pathname === "/api/surge" && req.method === "POST") {
      runSurgeSimulationBatch().catch(console.error);
      return json({ status: "surge_batch_started", count: SURGE_PATIENTS.length });
    }

    // Calendar & Appointments API
    if (pathname === "/api/calendar-patients" && req.method === "GET") {
      return json(calendarDb.getAllCalendarPatients());
    }

    if (pathname === "/api/calendar-patients" && req.method === "POST") {
      const intake = await readJsonBody(req);
      if (!intake.name || !intake.problem || !intake.date) {
        return json({ error: "Missing required fields (name, problem, date)" }, 400);
      }
      const record = calendarDb.addCalendarPatient(intake);
      return json(record, 201);
    }

    // Daily Hospital Stats
    if (pathname === "/api/daily-stats" && req.method === "GET") {
      const dateParam = url.searchParams.get("date") || new Date().toISOString().split("T")[0];
      const stats = dbEngine.getDailyStats(dateParam);
      return json(stats);
    }

    // Audit Logs
    if (pathname === "/api/audit-logs" && req.method === "GET") {
      const logs = dbEngine.getAuditLogs();
      return json(logs);
    }

    // Voice Symptom NLP API
    if (pathname === "/api/voice-symptom-analysis" && req.method === "POST") {
      const body = await readJsonBody(req);
      const text = body.transcript || body.text || "";
      if (!text.trim()) {
        return json({ error: "Transcript text is required" }, 400);
      }
      const result = analyzeVoiceTranscriptNLP(text);
      return json(result);
    }

    // Facial Scan Diagnostic API
    if (pathname === "/api/analyze-face" && req.method === "POST") {
      const body = await readJsonBody(req);
      const result = evaluateFaceImage(body);
      return json(result);
    }

    return json({ error: "Route not found" }, 404);
  } catch (err) {
    console.error("Server error:", err);
    return json({ error: "Internal Server Error", details: err.message }, 500);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Vitalis TriageAI Backend Engine running on http://${HOST}:${PORT}`);
  console.log(`Persistent Database Engine Active.`);
});
