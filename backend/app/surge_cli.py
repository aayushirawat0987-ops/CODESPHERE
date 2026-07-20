"""
Surge Simulation CLI Trigger
-----------------------------
Can be run via terminal: `python -m app.surge_cli`
Sends POST request to local running Vitalis backend to simulate incoming patients.
"""

import requests
import sys

BASE_URL = "http://localhost:8000"

def trigger_surge_cli():
    print("⚡ Triggering Vitalis Triage Surge Simulation...")
    try:
        resp = requests.post(f"{BASE_URL}/api/surge")
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ Success! {data.get('status')} ({data.get('patient_count')} patients added).")
            print("Check the Nurse Dashboard to watch queue re-sort in real time!")
        else:
            print(f"❌ Error from server: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"❌ Could not connect to Vitalis server at {BASE_URL}. Is backend server running?")
        print(f"Details: {e}")
        sys.exit(1)

if __name__ == "__main__":
    trigger_surge_cli()
