import React, { useState, useEffect } from 'react';
import UrgencyBadge from './UrgencyBadge';
import PatientQRCode from './PatientQRCode';
import { addConsultationNote, fetchPatientTimeline } from '../api';

export default function DoctorDashboardView({ patients, currentUser, onOpenOverride, onOpenReport, currentView = 'doc_dash' }) {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [noteType, setNoteType] = useState('doctor_diagnosis');
  const [noteTitle, setNoteTitle] = useState('Clinical Consultation & Diagnosis');
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Sync tab with currentView prop
  const getSubTab = (view) => {
    if (view === 'doc_timeline') return 'timeline';
    if (view === 'doc_ai_reports') return 'ai_reports';
    if (view === 'doc_notes') return 'notes';
    if (view === 'doc_prescriptions') return 'prescriptions';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getSubTab(currentView));

  useEffect(() => {
    setActiveTab(getSubTab(currentView));
  }, [currentView]);

  useEffect(() => {
    if (patients.length > 0 && !selectedPatient) {
      setSelectedPatient(patients[0]);
    }
  }, [patients]);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientTimeline(selectedPatient.id)
        .then(data => setTimeline(data))
        .catch(err => console.error(err));
    }
  }, [selectedPatient]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !noteContent.trim()) return;

    setSavingNote(true);
    try {
      await addConsultationNote(selectedPatient.id, {
        patient_id: selectedPatient.patient_id || selectedPatient.id,
        patient_name: selectedPatient.name,
        author_id: currentUser ? currentUser.id : 'usr_doc_1',
        author_name: currentUser ? currentUser.name : 'Dr. Sarah Jenkins',
        author_role: 'doctor',
        note_type: noteType,
        title: noteTitle,
        content: noteContent.trim()
      });

      setNoteContent('');
      const updatedTimeline = await fetchPatientTimeline(selectedPatient.id);
      setTimeline(updatedTimeline);
      alert('✅ Note & Rx saved successfully!');
    } catch (err) {
      alert(`Failed to save note: ${err.message}`);
    } finally {
      setSavingNote(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    const patIdStr = (p.patient_id || p.id || '').toLowerCase();
    return p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           p.complaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
           patIdStr.includes(searchTerm.toLowerCase());
  });

  const formattedSelectedPatId = selectedPatient ? (selectedPatient.patient_id || `VIT-2026-000${selectedPatient.id}`) : '';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '16px', padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
            👨‍⚕️ Doctor Clinical Consultation Workspace
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            Logged in: <strong style={{ color: '#00d4ff' }}>{currentUser ? currentUser.name : 'Dr. Sarah Jenkins, MD'}</strong> | Department: Cardiology / Emergency
          </p>
        </div>

        {/* Sub-Navigation Bar */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '6px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem',
              background: activeTab === 'overview' ? '#0096c7' : 'transparent', color: '#fff'
            }}
          >
            📋 Queue Overview
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            style={{
              padding: '6px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem',
              background: activeTab === 'notes' ? '#0096c7' : 'transparent', color: '#fff'
            }}
          >
            📝 Diagnosis Writer
          </button>

          <button
            onClick={() => setActiveTab('prescriptions')}
            style={{
              padding: '6px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem',
              background: activeTab === 'prescriptions' ? '#0096c7' : 'transparent', color: '#fff'
            }}
          >
            💊 Rx Prescriptions
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            style={{
              padding: '6px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem',
              background: activeTab === 'timeline' ? '#0096c7' : 'transparent', color: '#fff'
            }}
          >
            📜 Medical History
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        
        {/* Left Patient List */}
        <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '750px', overflowY: 'auto' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
            📋 Assigned Patient Queue ({filteredPatients.length})
          </h3>

          <input
            type="text"
            className="input-field"
            placeholder="Search by Patient ID (VIT-2026-XXXXXX) or name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ fontSize: '0.8rem' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredPatients.map(p => {
              const isSelected = selectedPatient && selectedPatient.id === p.id;
              const patId = p.patient_id || `VIT-2026-000${p.id}`;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  style={{
                    padding: '12px', borderRadius: '10px', cursor: 'pointer',
                    background: isSelected ? 'rgba(0,150,199,0.12)' : '#ffffff',
                    border: isSelected ? '2px solid #0096c7' : '1px solid #cbd5e1',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{p.name}</span>
                    <UrgencyBadge score={p.effective_urgency_score} isOverridden={p.is_overridden} />
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0096c7', marginTop: '2px', fontFamily: 'monospace' }}>
                    {patId}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Workspace Details */}
        {selectedPatient ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Top Selected Patient Card */}
            <div style={{ background: '#ffffff', border: '1.5px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>
                      {selectedPatient.name}
                    </h2>
                    <span style={{ background: '#0096c7', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 900, fontFamily: 'monospace' }}>
                      {formattedSelectedPatId}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                    {selectedPatient.age} yrs • {selectedPatient.gender}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <PatientQRCode patientId={formattedSelectedPatId} size={85} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button className="btn btn-warning" onClick={() => onOpenOverride(selectedPatient)} style={{ fontSize: '0.8rem' }}>
                      ⚡ Override Urgency
                    </button>
                    <button className="btn btn-secondary-ghost" onClick={() => onOpenReport(selectedPatient)} style={{ fontSize: '0.8rem' }}>
                      🖨️ Report
                    </button>
                  </div>
                </div>
              </div>

              {/* Vitals Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginTop: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', fontSize: '0.8rem' }}>
                  <strong>Pain Scale:</strong> {selectedPatient.pain_scale}/10
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', fontSize: '0.8rem' }}>
                  <strong>Heart Rate:</strong> {selectedPatient.vitals.heart_rate || 'N/A'} bpm
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', fontSize: '0.8rem' }}>
                  <strong>SpO2:</strong> {selectedPatient.vitals.spo2 || '98'}%
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', fontSize: '0.8rem' }}>
                  <strong>BP:</strong> {selectedPatient.vitals.blood_pressure || 'N/A'}
                </div>
              </div>
            </div>

            {/* SUB-VIEW 1: DIAGNOSIS & PRESCRIPTION WRITER */}
            {(activeTab === 'notes' || activeTab === 'prescriptions') && (
              <div style={{ background: '#f0f9ff', border: '1.5px solid #7dd3fc', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 800, color: '#0369a1' }}>
                  {activeTab === 'prescriptions' ? '💊 Write Rx Medication Prescription' : '📝 Doctor Diagnosis & Clinical Notes'}
                </h3>

                <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Note Category</label>
                      <select
                        className="input-field"
                        value={noteType}
                        onChange={e => setNoteType(e.target.value)}
                      >
                        <option value="doctor_diagnosis">🩺 Diagnosis & Clinical Finding</option>
                        <option value="prescription">💊 Rx Prescription Writer</option>
                        <option value="doctor_treatment">🏥 Treatment Plan & Orders</option>
                        <option value="discharge_summary">📄 Discharge Summary</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Subject Title</label>
                      <input
                        type="text"
                        className="input-field"
                        value={noteTitle}
                        onChange={e => setNoteTitle(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Doctor Notes & Clinical Directives</label>
                    <textarea
                      className="input-field textarea-field"
                      rows="4"
                      placeholder="Enter clinical examination findings, medication dosages, frequency, and follow-up instructions..."
                      value={noteContent}
                      onChange={e => setNoteContent(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={savingNote}>
                    {savingNote ? 'Saving Record...' : '💾 Save Clinical Record'}
                  </button>
                </form>
              </div>
            )}

            {/* SUB-VIEW 2: MEDICAL HISTORY TIMELINE */}
            {activeTab === 'timeline' && (
              <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  📜 Complete Medical Timeline ({formattedSelectedPatId})
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {timeline.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>No timeline events recorded yet.</div>
                  ) : (
                    timeline.map(evt => (
                      <div key={evt.id} style={{ borderLeft: '3px solid #0096c7', paddingLeft: '14px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                          {evt.date} {evt.author ? `• by ${evt.author}` : ''}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', marginTop: '2px' }}>
                          {evt.title}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '4px', lineHeight: 1.5 }}>
                          {evt.details}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* OVERVIEW DEFAULT */}
            {activeTab === 'overview' && (
              <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0077b6' }}>
                  🤖 AI Clinical Differential & Assessment
                </h3>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <strong>Chief Complaint:</strong> "{selectedPatient.complaint}"
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <strong>AI Urgency Reasoning:</strong><br />
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
                    {selectedPatient.combined_rationale}
                  </p>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Select a patient from the assigned queue.</div>
        )}

      </div>
    </div>
  );
}
