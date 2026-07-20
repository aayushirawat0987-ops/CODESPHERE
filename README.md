# 🏥 Vitalis / TriageAI — ER/Urgent Care Decision Support System

> **Hackathon MVP**: AI-powered clinical decision-support tool for hospital intake & triage.

---

## ⚠️ Non-Diagnostic Framing & Safety Guardrails
- **Staff Control**: Vitalis is a **decision-support tool for medical staff**, NOT a diagnostic system.
- **Human In Control**: Clinicians can manually override any AI urgency score at any time with a mandatory clinical reason. Overriding locks out AI re-scoring for that patient.
- **Deterministic Guardrails**: Includes a rule-based cross-check layer (e.g., Heart Rate > 120 bpm + Temp > 101°F automatically triggers a **Sepsis Alert** and urgency boost).

---

## 🚀 Quickstart Guide (Run locally in < 5 minutes)

### Prerequisites
- **Python 3.9+**
- **Node.js 18+** & npm

---

### Step 1: Start Backend (Python FastAPI)

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. *(Optional)* Add your Anthropic API Key:
   ```bash
   cp .env.example .env
   # Edit .env and set ANTHROPIC_API_KEY=sk-ant-...
   ```
   > *Note: If `ANTHROPIC_API_KEY` is not set, Vitalis automatically falls back to an intelligent local heuristic mock engine so you can present and test offline without an API key!*

4. Run the backend server:
   ```bash
   python run.py
   ```
   The backend API will start at **`http://localhost:8000`** (Docs at `http://localhost:8000/docs`).

---

### Step 2: Start Frontend (React + Vite)

1. Open a second terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open **`http://localhost:5173`** in your browser.

---

## ⚡ Demo / Surge Simulation

During live pitch presentations:
- Click the **`⚡ Trigger Demo Surge`** button in the header of the app UI.
- *Alternatively*, run the CLI script from the `backend/` folder:
  ```bash
  python -m app.surge_cli
  ```
This injects **9 realistic patients** (sprained ankle, chest pain, post-surgical sepsis, hypertensive crisis, etc.) into the queue. Watch the Nurse Dashboard re-sort live in real-time as high-urgency patients jump to the top!

---

## 🤖 Claude API System Prompt

The exact system prompt configured in `backend/app/ai_engine.py`:

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
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI routes & CORS setup
│   │   ├── config.py        # Env configuration (.env reader)
│   │   ├── models.py        # Pydantic schemas (PatientIntake, TriageReasoning)
│   │   ├── storage.py       # In-memory triage store & sorting logic
│   │   ├── ai_engine.py     # Claude API client + Markdown JSON parser & mock fallback
│   │   ├── rule_engine.py   # Clinical rule safety cross-checks (Sepsis, BP, HR)
│   │   ├── surge_data.py    # Demo patient dataset
│   │   └── surge_cli.py     # CLI trigger runner
│   ├── .env.example         # Environment template
│   ├── requirements.txt     # Python dependencies
│   └── run.py               # Uvicorn launcher
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # App navbar & Surge trigger
│   │   │   ├── PatientForm.jsx      # Intake form + Demo quick presets
│   │   │   ├── NurseDashboard.jsx   # Live sorted queue & severity filters
│   │   │   ├── OverrideModal.jsx    # Staff score override dialog
│   │   │   └── UrgencyBadge.jsx     # Red / Yellow / Green urgency indicators
│   │   ├── App.jsx                  # Main SPA container & 3-sec polling
│   │   ├── App.css                  # Custom clinical dark glassmorphism theme
│   │   ├── api.js                   # API client service
│   │   └── main.jsx                 # React root
│   ├── index.html
│   ├── package.json
│   └── vite.config.js               # Dev server proxy configuration
└── README.md
```
