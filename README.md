# 🏥 Vitalis / TriageAI — ER & Urgent Care Decision Support System

> **Hackathon MVP**: AI-powered clinical decision-support platform for hospital intake, triage queue prioritization, voice symptom analysis, and facial vision diagnostics.

---

## 🌟 Key Features

1. **📷 AI Facial Distress & Vision Analyzer**: Real-time computer-vision scanner detecting facial pain expressions (1-10 scale), FAST stroke asymmetry signs, and skin pallor/cyanosis with visual target overlays and diagnostic recommendations.
2. **🎙️ Voice Symptom Intake & NLP**: Hands-free voice symptom recording with clinical keyword extraction and automatic patient intake generation.
3. **📅 Patient Appointment Calendar**: Interactive schedule management with real-time patient queue integration.
4. **⚡ Demo Surge Simulation**: Instantaneous injection of 9 realistic emergency patients to demonstrate live queue re-sorting during pitch demonstrations.
5. **🔒 Staff Control & Override**: Clinicians maintain full authority to manually override any AI urgency score with a mandatory clinical reason, locking re-scoring for safety.
6. **🛡️ Deterministic Safety Guardrails**: Rule-based cross-checks (e.g., Heart Rate > 120 bpm + Temp > 101°F automatically triggers a **Sepsis Alert** and urgency boost).

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js 18+** & npm (or **Python 3.9+**)

---

### Step 1: Start Backend Server

Choose **either** Node.js or Python FastAPI:

#### Option A: Zero-Dependency Node.js Backend (Recommended)
```bash
cd backend
node server.js
```
*Starts on **`http://localhost:8000`** with Voice, Face Recognition, and Safety Rules active.*

#### Option B: Python FastAPI Backend
```bash
cd backend
pip install -r requirements.txt
python run.py
```
*Starts on **`http://localhost:8000`** (Docs at `http://localhost:8000/docs`).*

> *(Optional)* Configure your Anthropic API Key in `backend/.env`:
> ```env
> ANTHROPIC_API_KEY=sk-ant-...
> ```
> *Note: If `ANTHROPIC_API_KEY` is not set or balance is low, Vitalis automatically falls back to its intelligent local heuristic mock engine so you can present and test offline!*

---

### Step 2: Start Frontend (React + Vite)

1. Open a second terminal in the `frontend/` directory:
   ```bash
   cd frontend
   npm run dev
   ```
2. Open **`http://localhost:5173`** in your browser.

---

## ⚡ Live Pitch Demo / Surge Simulation

During live pitch presentations:
- Click the **`⚡ Trigger Demo Surge`** button in the top navigation bar.
- *Alternatively*, run the CLI script from the `backend/` folder:
  ```bash
  node surgeCli.js
  # Or: python -m app.surge_cli
  ```
This injects **9 realistic patients** (sprained ankle, chest pain, post-surgical sepsis, hypertensive crisis, etc.) into the queue. Watch the Nurse Dashboard re-sort live in real-time as high-urgency patients jump to the top!

---

## 🤖 Claude API System Prompt

The system prompt configured in `backend/aiEngine.js` & `backend/app/ai_engine.py`:

```
You are Vitalis, a Clinical Intake Decision-Support Assistant for ER and Urgent Care triage nurses.
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
```

---

## 📁 Project Structure

```
CODESPHERE/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI routes & CORS setup
│   │   ├── face_engine.py   # Python Claude vision API + local heuristic fallback
│   │   ├── ai_engine.py     # Python Claude triage AI engine
│   │   ├── rule_engine.py   # Clinical safety rule cross-checks (Sepsis, BP, HR)
│   │   ├── models.py        # Pydantic schemas (Intake, Overrides, Face, Voice)
│   │   ├── storage.py       # In-memory & SQLite triage store
│   │   ├── surge_data.py    # Demo patient dataset
│   │   └── surge_cli.py     # Python CLI trigger runner
│   ├── server.js            # Node.js zero-dependency HTTP backend server
│   ├── faceEngine.js        # Node.js facial vision analysis engine
│   ├── aiEngine.js          # Node.js triage AI engine
│   ├── ruleEngine.js        # Node.js clinical safety rule engine
│   ├── storage.js           # Node.js patient & calendar storage
│   ├── voiceSymptomMap.js   # Voice NLP symptom dictionary & scoring
│   ├── surgeCli.js          # Node.js CLI trigger runner
│   ├── .env                 # Environment configuration
│   ├── package.json         # Node backend dependencies & scripts
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # App navbar & Surge trigger
│   │   │   ├── PatientForm.jsx      # Intake form + Presets
│   │   │   ├── NurseDashboard.jsx   # Live sorted queue & severity filters
│   │   │   ├── OverrideModal.jsx    # Staff score override dialog
│   │   │   ├── FaceAnalyzer.jsx     # AI Facial Distress & Vision Scanner
│   │   │   ├── VoiceAnalyzer.jsx    # Hands-free Voice Intake Scanner
│   │   │   ├── CalendarView.jsx     # Patient Appointment Calendar
│   │   │   ├── LandingPage.jsx      # Portal landing screen
│   │   │   └── ContactPage.jsx      # Contact & support form
│   │   ├── App.jsx                  # Main SPA container & polling
│   │   ├── App.css                  # Clinical dark glassmorphism theme
│   │   ├── api.js                   # Frontend API client service
│   │   └── main.jsx                 # React root
│   ├── index.html
│   ├── package.json
│   └── vite.config.js               # Dev server proxy configuration
└── README.md
```
