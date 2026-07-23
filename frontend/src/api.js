const API_BASE_URL = 'http://localhost:8000';

export async function fetchPatients() {
  const res = await fetch(`${API_BASE_URL}/api/patients`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function submitIntake(patientData) {
  const res = await fetch(`${API_BASE_URL}/api/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patientData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function applyOverride(patientId, overrideData) {
  const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(overrideData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function triggerSurge() {
  const res = await fetch(`${API_BASE_URL}/api/surge`, { method: 'POST' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function clearQueue() {
  const res = await fetch(`${API_BASE_URL}/api/patients`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchCalendarPatients() {
  const res = await fetch(`${API_BASE_URL}/api/calendar-patients`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function submitCalendarPatient(patientData) {
  const res = await fetch(`${API_BASE_URL}/api/calendar-patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patientData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const addCalendarPatient = submitCalendarPatient;

export async function updateCalendarPatient(id, patientData) {
  return submitCalendarPatient({ ...patientData, id });
}

export async function deleteCalendarPatient(id) {
  return { status: 'deleted', id };
}

export async function analyzeVoiceTranscript(transcriptText) {
  const res = await fetch(`${API_BASE_URL}/api/voice-symptom-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript: transcriptText })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function analyzeFaceDiagnostic(faceData) {
  const res = await fetch(`${API_BASE_URL}/api/analyze-face`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(faceData)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const analyzeFaceImage = analyzeFaceDiagnostic;

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Login failed (HTTP ${res.status})`);
  }
  return res.json();
}

export async function registerUser(userData) {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Registration failed (HTTP ${res.status})`);
  }
  return res.json();
}

export async function fetchPatientTimeline(patientId) {
  const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/timeline`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function addConsultationNote(patientId, noteData) {
  const res = await fetch(`${API_BASE_URL}/api/patients/${patientId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(noteData)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchDailyStats(dateStr) {
  const query = dateStr ? `?date=${encodeURIComponent(dateStr)}` : '';
  const res = await fetch(`${API_BASE_URL}/api/daily-stats${query}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchAuditLogs() {
  const res = await fetch(`${API_BASE_URL}/api/audit-logs`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
