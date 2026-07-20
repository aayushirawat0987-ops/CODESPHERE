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
