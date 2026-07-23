import React, { useMemo, useState, useEffect } from 'react';
import { sendPrescription } from '../api';
import UrgencyBadge from './UrgencyBadge';

export default function DoctorDashboard({ patients, onRefresh, lastUpdated, showToast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [prescription, setPrescription] = useState({
    medicine_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: '',
    follow_up: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const activePatients = useMemo(
    () => patients.filter((p) => p.treatment_status !== 'Treatment Completed'),
    [patients]
  );

  const filteredPatients = useMemo(() => {
    return activePatients.filter((patient) => {
      const term = searchTerm.toLowerCase();
      return (
        patient.name.toLowerCase().includes(term) ||
        (patient.complaint || '').toLowerCase().includes(term) ||
        (patient.id || '').toLowerCase().includes(term)
      );
    });
  }, [activePatients, searchTerm]);

  const recentActivity = useMemo(() => {
    const events = patients.flatMap((patient) =>
      (patient.activity_log || []).map((entry) => ({
        ...entry,
        patient_name: patient.name,
        patient_id: patient.id
      }))
    );
    return events.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 8);
  }, [patients]);

  useEffect(() => {
    if (filteredPatients.length > 0 && !selectedPatient) {
      setSelectedPatient(filteredPatients[0]);
    }
  }, [filteredPatients, selectedPatient]);

  useEffect(() => {
    if (selectedPatient?.prescription) {
      setPrescription({
        medicine_name: selectedPatient.prescription.medicine_name || '',
        dosage: selectedPatient.prescription.dosage || '',
        frequency: selectedPatient.prescription.frequency || '',
        duration: selectedPatient.prescription.duration || '',
        notes: selectedPatient.prescription.notes || '',
        follow_up: selectedPatient.prescription.follow_up || ''
      });
    } else {
      setPrescription({
        medicine_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: '',
        follow_up: ''
      });
    }
  }, [selectedPatient]);

  const summary = useMemo(() => {
    const total = activePatients.length;
    const critical = activePatients.filter((p) => p.effective_urgency_score >= 8).length;
    const ordered = activePatients.filter((p) => p.treatment_status === 'Medication Ordered').length;
    const ready = activePatients.filter((p) => p.treatment_status === 'Ready for Pickup').length;
    return { total, critical, ordered, ready };
  }, [activePatients]);

  const handlePrescriptionChange = (field, value) => {
    setPrescription((prev) => ({ ...prev, [field]: value }));
  };

  const sendToPharmacy = async () => {
    if (!selectedPatient) return;
    if (!prescription.medicine_name.trim()) {
      showToast('Please enter at least one medicine name before sending to pharmacy.');
      return;
    }

    setIsSaving(true);
    try {
      await sendPrescription(selectedPatient.id, prescription);
      showToast(`Prescription sent for ${selectedPatient.name}. Pharmacy notified.`);
      onRefresh();
      setSelectedPatient(null);
    } catch (error) {
      showToast(`Unable to send prescription: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const selected = selectedPatient || filteredPatients[0] || null;
  const hasNoPatients = filteredPatients.length === 0;

  return (
    <div className="card dashboard-card hospital-dashboard-card">
      <div className="dashboard-header-row">
        <div>
          <p className="section-subtitle">Doctor Care Console</p>
          <h2>Clinical Treatment & Pharmacy Order Center</h2>
          <p className="dashboard-caption">
            Integrated AI triage scores, patient history, vitals, and real-time pharmacy dispatch.
          </p>
        </div>
        <div className="meta-pill">Updated {lastUpdated || 'just now'}</div>
      </div>

      <div className="row summary-grid">
        <div className="summary-card summary-blue">
          <span>Total Active Patients</span>
          <strong>{summary.total}</strong>
        </div>
        <div className="summary-card summary-red">
          <span>Priority 1 / Critical</span>
          <strong>{summary.critical}</strong>
        </div>
        <div className="summary-card summary-yellow">
          <span>Orders Pending Pharmacy</span>
          <strong>{summary.ordered}</strong>
        </div>
        <div className="summary-card summary-green">
          <span>Ready for Pickup</span>
          <strong>{summary.ready}</strong>
        </div>
      </div>

      <div className="row doctor-grid">
        <section className="panel panel-left">
          <div className="panel-top-row">
            <div className="input-search-wrap">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search patients, complaints, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-pill-group">
              <span className="filter-pill">AI Triage</span>
              <span className="filter-pill">Doctor Orders</span>
            </div>
          </div>

          <div className="patient-table">
            {hasNoPatients ? (
              <div className="empty-state">
                <div className="empty-icon">🩺</div>
                <p>No active patients in the doctor queue.</p>
              </div>
            ) : (
              filteredPatients.map((patient) => {
                const isSelected = selected?.id === patient.id;
                return (
                  <button
                    key={patient.id}
                    className={`table-row ${isSelected ? 'selected-row' : ''}`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <div>
                      <div className="patient-name">{patient.name}</div>
                      <div className="patient-meta">{patient.complaint}</div>
                    </div>
                    <div className="patient-right">
                      <UrgencyBadge score={patient.effective_urgency_score} compact />
                      <span className={`status-pill status-${patient.treatment_status.replace(/\s+/g, '-').toLowerCase()}`}>
                        {patient.treatment_status}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="panel panel-right">
          {selected ? (
            <>
              <div className="card-section-title">Patient Clinical Snapshot</div>
              <div className="detail-grid">
                <div>
                  <div className="detail-label">Patient</div>
                  <div className="detail-value">{selected.name}</div>
                </div>
                <div>
                  <div className="detail-label">AI Triage Score</div>
                  <div className="detail-value">{selected.effective_urgency_score}/10</div>
                </div>
                <div>
                  <div className="detail-label">Status</div>
                  <div className="detail-value status-pill status-{selected.treatment_status.replace(/\s+/g, '-').toLowerCase()}">{selected.treatment_status}</div>
                </div>
              </div>

              <div className="detail-box">
                <h3>Vitals & History</h3>
                <div className="detail-line"><strong>Complaint:</strong> {selected.complaint}</div>
                <div className="detail-line"><strong>Medical History:</strong> {selected.medical_history || 'No history documented'}</div>
                <div className="detail-line"><strong>Allergies:</strong> {selected.allergies || 'None recorded'}</div>
                <div className="detail-line"><strong>Current Meds:</strong> {selected.current_medications || 'None recorded'}</div>
                <div className="detail-line"><strong>Pain Scale:</strong> {selected.pain_scale}/10</div>
                <div className="detail-line"><strong>Vitals:</strong> {selected.vitals?.heart_rate ? `HR ${selected.vitals.heart_rate} bpm · ` : ''}{selected.vitals?.blood_pressure ? `BP ${selected.vitals.blood_pressure} · ` : ''}{selected.vitals?.temperature ? `Temp ${selected.vitals.temperature}°F` : 'Not captured'}</div>
              </div>

              <div className="detail-box">
                <h3>Clinical Rationale</h3>
                <p>{selected.combined_rationale}</p>
              </div>

              <div className="detail-box prescription-box">
                <h3>Digital Prescription</h3>
                <div className="form-group">
                  <label>Medicine Name</label>
                  <input
                    className="input-field"
                    value={prescription.medicine_name}
                    onChange={(e) => handlePrescriptionChange('medicine_name', e.target.value)}
                    placeholder="e.g. Amoxicillin 500mg"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group half-width">
                    <label>Dosage</label>
                    <input
                      className="input-field"
                      value={prescription.dosage}
                      onChange={(e) => handlePrescriptionChange('dosage', e.target.value)}
                      placeholder="2 tablets"
                    />
                  </div>
                  <div className="form-group half-width">
                    <label>Frequency</label>
                    <input
                      className="input-field"
                      value={prescription.frequency}
                      onChange={(e) => handlePrescriptionChange('frequency', e.target.value)}
                      placeholder="Every 8 hours"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group half-width">
                    <label>Duration</label>
                    <input
                      className="input-field"
                      value={prescription.duration}
                      onChange={(e) => handlePrescriptionChange('duration', e.target.value)}
                      placeholder="7 days"
                    />
                  </div>
                  <div className="form-group half-width">
                    <label>Follow-up</label>
                    <input
                      className="input-field"
                      value={prescription.follow_up}
                      onChange={(e) => handlePrescriptionChange('follow_up', e.target.value)}
                      placeholder="Return in 3 days"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    className="input-field textarea-field"
                    rows={3}
                    value={prescription.notes}
                    onChange={(e) => handlePrescriptionChange('notes', e.target.value)}
                    placeholder="Instructions, monitoring, or alerts for pharmacy"
                  />
                </div>
                <button className="btn btn-primary full-width" onClick={sendToPharmacy} disabled={isSaving}>
                  {isSaving ? 'Sending...' : 'Send to Pharmacy'}
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🫀</div>
              <p>Select a patient to review details and prepare a prescription.</p>
            </div>
          )}
        </section>
      </div>

      <div className="activity-section">
        <h3>Live Clinical Activity Feed</h3>
        <div className="activity-feed">
          {recentActivity.length === 0 ? (
            <div className="activity-empty">No activity yet. Prescriptions and pharmacy actions appear here.</div>
          ) : (
            recentActivity.map((entry, index) => (
              <div key={`${entry.patient_id}-${index}`} className="activity-item">
                <span className="activity-time">{entry.time}</span>
                <div>
                  <strong>{entry.patient_name}</strong> — {entry.message}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
