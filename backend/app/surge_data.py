"""
Surge Simulation Patient Dataset
--------------------------------
8-10 realistic demo patients mixing low, moderate, and high urgency complaints & vitals.
Designed to demonstrate queue re-ordering live during pitch presentations.
"""

from typing import List, Dict, Any

SURGE_PATIENTS: List[Dict[str, Any]] = [
    {
        "name": "Mark Evans",
        "complaint": "Twisted right ankle while stepping off curb. Mild swelling and pain when putting weight on foot.",
        "pain_scale": 4,
        "vitals": {"heart_rate": 72, "temperature": 98.6, "blood_pressure": "120/78"}
    },
    {
        "name": "Sarah Jenkins",
        "complaint": "Pressure and tightness in central chest radiating to left arm. Started 20 minutes ago while resting.",
        "pain_scale": 8,
        "vitals": {"heart_rate": 105, "temperature": 99.1, "blood_pressure": "148/94"}
    },
    {
        "name": "David Ross",
        "complaint": "Persistent dry cough, mild sore throat, and fatigue for 3 days. No shortness of breath.",
        "pain_scale": 2,
        "vitals": {"heart_rate": 76, "temperature": 99.6, "blood_pressure": "118/74"}
    },
    {
        "name": "Elena Rostova",
        "complaint": "Post-surgical knee patient feeling chills, confusion, and shivering. Incision site warm and red.",
        "pain_scale": 7,
        "vitals": {"heart_rate": 128, "temperature": 102.2, "blood_pressure": "105/65"} # Sepsis rule trigger!
    },
    {
        "name": "Arthur Pendelton",
        "complaint": "Sudden onset thunderclap headache ('worst headache of life') with sudden visual blurriness.",
        "pain_scale": 9,
        "vitals": {"heart_rate": 94, "temperature": 98.4, "blood_pressure": "178/108"}
    },
    {
        "name": "Chloe Bennett",
        "complaint": "Shallow 1-inch cut on left index finger while chopping kitchen vegetables. Bleeding controlled with pressure.",
        "pain_scale": 3,
        "vitals": {"heart_rate": 68, "temperature": 98.6, "blood_pressure": "112/70"}
    },
    {
        "name": "Robert Taylor",
        "complaint": "Severe sharp abdominal pain in right lower quadrant with nausea and low-grade fever.",
        "pain_scale": 8,
        "vitals": {"heart_rate": 98, "temperature": 100.6, "blood_pressure": "132/85"}
    },
    {
        "name": "Maria Garcia",
        "complaint": "Severe dizziness, pounding headache, and lightheadedness. History of hypertension.",
        "pain_scale": 6,
        "vitals": {"heart_rate": 92, "temperature": 98.7, "blood_pressure": "192/122"} # Hypertensive crisis rule trigger!
    },
    {
        "name": "Liam Miller",
        "complaint": "Itchy red rash on both forearms after walking through brush yesterday.",
        "pain_scale": 1,
        "vitals": {"heart_rate": 70, "temperature": 98.2, "blood_pressure": "116/75"}
    }
]
