const API_BASE = '/api';

export async function fetchPatients() {
  const res = await fetch(`${API_BASE}/patients`);
  if (!res.ok) throw new Error('Failed to fetch patients');
  return res.json();
}

export async function submitIntake(patientData) {
  const res = await fetch(`${API_BASE}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patientData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to submit patient intake');
  }
  return res.json();
}

export async function applyOverride(patientId, overrideData) {
  const res = await fetch(`${API_BASE}/patients/${patientId}/override`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(overrideData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to apply staff override');
  }
  return res.json();
}

export async function triggerSurge() {
  const res = await fetch(`${API_BASE}/surge`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to trigger surge simulation');
  return res.json();
}

export async function clearQueue() {
  const res = await fetch(`${API_BASE}/clear`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to clear queue');
  return res.json();
}

export async function fetchCalendarPatients() {
  const res = await fetch(`${API_BASE}/calendar`);
  if (!res.ok) throw new Error('Failed to fetch calendar patients');
  return res.json();
}

export async function addCalendarPatient(data) {
  const res = await fetch(`${API_BASE}/calendar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to add calendar patient');
  return res.json();
}

export async function updateCalendarPatient(id, data) {
  const res = await fetch(`${API_BASE}/calendar/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update calendar patient');
  return res.json();
}

export async function deleteCalendarPatient(id) {
  const res = await fetch(`${API_BASE}/calendar/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete calendar patient');
  return res.json();
}

export async function analyzeVoiceTranscript(transcript) {
  const res = await fetch(`${API_BASE}/voice-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript })
  });
  if (!res.ok) throw new Error('Failed to analyze voice transcript');
  return res.json();
}

export async function submitVoiceIntake(data) {
  const res = await fetch(`${API_BASE}/voice-intake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to submit voice intake');
  return res.json();
}

export async function analyzeFaceImage(data) {
  const res = await fetch(`${API_BASE}/face-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errObj = await res.json().catch(() => ({}));
    throw new Error(errObj.detail || 'Failed to perform facial vision analysis');
  }
  return res.json();
}
